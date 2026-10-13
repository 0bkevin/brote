#!/usr/bin/env python3
"""Render a full-page English Brote walkthrough from real captures.

Config paths are relative to --assets; voiceFile may also live in --work.
Requires FFmpeg/ffprobe, Pillow, and (only for voice fallback) macOS `say`.
The app is always scaled to fit the entire 1920x1080 canvas: no crop or zoom.
"""

import argparse
import hashlib
import json
import math
import re
import shutil
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
NAVY = "#22264a"
PURPLE = "#6c4bff"
LIME = "#d7ff5c"
FONT_DIR = Path(__file__).resolve().parents[1] / "docs/video/english/fonts"
VIDEO_SUFFIXES = {".mp4", ".mov", ".mkv", ".webm"}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


def run(command):
    subprocess.run(command, check=True)


def probe(path):
    data = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path)
    ]))
    stream = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    if stream:
        return int(stream["width"]), int(stream["height"]), float(data["format"]["duration"])
    return 0, 0, float(data["format"]["duration"])


def safe_path(base, name):
    path = (base / name).resolve()
    if not path.is_relative_to(base.resolve()):
        raise ValueError(f"Path escapes its directory: {name}")
    if not path.is_file():
        raise FileNotFoundError(path)
    return path


def asset_path(name, assets, work=None):
    for directory in (assets, work):
        if directory is None:
            continue
        try:
            return safe_path(directory, name)
        except FileNotFoundError:
            pass
    raise FileNotFoundError(f"Could not find {name} in {assets} or {work}")


def font(name, size):
    path = FONT_DIR / ("Outfit.ttf" if name == "heading" else "NunitoSans.ttf")
    if not path.is_file():
        raise FileNotFoundError(f"Expected installed Brote font: {path}")
    face = ImageFont.truetype(str(path), size)
    face.set_variation_by_axes([650] if name == "heading" else [650, 100, 12, 500])
    return face


def text_width(draw, value, face):
    return draw.textbbox((0, 0), value, font=face)[2]


def fit_font(draw, value, kind, start, max_width):
    for size in range(start, 14, -1):
        face = font(kind, size)
        if text_width(draw, value, face) <= max_width:
            return face
    raise ValueError(f"Text too long for on-screen label: {value}")


def contain(source_width, source_height):
    scale = min(W / source_width, H / source_height)
    width = round(source_width * scale)
    height = round(source_height * scale)
    return scale, (W - width) // 2, (H - height) // 2, width, height


def scene_overlay(scene, highlights, scene_length, shot_times, sizes, out):
    image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    section = scene.get("section", "WALKTHROUGH").upper()
    label = scene.get("label", "")
    chip = f"{section}  /  {label}" if label else section
    face = fit_font(draw, chip, "heading", 22, 700)
    box_width = text_width(draw, chip, face) + 38
    # Occupy only the breadcrumb area, leaving Brote's logo and primary controls visible.
    draw.rounded_rectangle((375, 18, 375 + box_width, 58), radius=15,
                           fill=(34, 38, 74, 224))
    draw.text((394, 25), chip, font=face, fill=LIME, stroke_width=0)
    image.save(out)
    overlays = []
    for index, item in enumerate(highlights):
        start, end = float(item["start"]), float(item["end"])
        if not (0 <= start < end <= scene_length + 0.001):
            raise ValueError(f"Invalid highlight timing in {scene['id']}")
        shot_index = int(item.get("shot", next((i for i, (a, b) in enumerate(shot_times)
                                               if a <= start < b), len(shot_times) - 1)))
        if shot_index < 0 or shot_index >= len(sizes):
            raise ValueError("Highlight shot index is out of range")
        a, b = shot_times[shot_index]
        if start < a or end > b + 0.001:
            raise ValueError("A highlight must stay within its source shot")
        rect = item["rect"]
        if len(rect) != 4 or any(not isinstance(v, (int, float)) for v in rect):
            raise ValueError("Highlight rect must be [x,y,width,height] in source pixels")
        sx, sy, rw, rh = map(float, rect)
        sw, sh = sizes[shot_index]
        if sx < 0 or sy < 0 or rw <= 0 or rh <= 0 or sx + rw > sw or sy + rh > sh:
            raise ValueError(f"Highlight outside source bounds in {scene['id']}")
        scale, ox, oy, _, _ = contain(sw, sh)
        x0, y0 = round(ox + sx * scale), round(oy + sy * scale)
        x1, y1 = round(ox + (sx + rw) * scale), round(oy + (sy + rh) * scale)
        if not item.get("label"):
            raise ValueError("Each explicit button highlight needs a label")
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        pen = ImageDraw.Draw(layer)
        pen.rounded_rectangle((x0 - 4, y0 - 4, x1 + 4, y1 + 4), radius=10,
                              outline=PURPLE, width=5)
        # Keep the label small, outside the highlighted control when possible.
        face = fit_font(pen, item["label"], "body", 22, 500)
        lw = text_width(pen, item["label"], face) + 26
        lx = max(8, min(W - lw - 8, x0))
        ly = y0 - 41 if y0 >= 51 else min(H - 37, y1 + 10)
        pen.rounded_rectangle((lx, ly, lx + lw, ly + 32), radius=12,
                              fill=(108, 75, 255, 230))
        pen.text((lx + 13, ly + 4), item["label"], font=face, fill="white")
        path = out.with_name(f"{out.stem}-highlight-{index:02}.png")
        layer.save(path)
        overlays.append((path, start, end))
    return overlays


def shot_info(shot, assets):
    path = asset_path(shot["file"], assets)
    suffix = path.suffix.lower()
    if suffix not in VIDEO_SUFFIXES | IMAGE_SUFFIXES:
        raise ValueError(f"Unsupported shot type: {path}")
    if suffix in IMAGE_SUFFIXES:
        with Image.open(path) as image:
            sw, sh = image.size
        duration = shot.get("duration", shot.get("hold"))
        if duration is None:
            raise ValueError(f"Still shot needs duration or hold: {path}")
        duration = float(duration)
        source_seconds = None
    else:
        sw, sh, source_duration = probe(path)
        start = float(shot.get("start", 0))
        end = float(shot.get("end", source_duration))
        speed = float(shot.get("speed", 1))
        if not (0.77 <= speed <= 1.30):
            raise ValueError("Video speed must stay between 0.77 and 1.30")
        if not (0 <= start < end <= source_duration + 0.05):
            raise ValueError(f"Invalid video trim: {path}")
        source_seconds = (start, end, speed)
        duration = float(shot.get("duration", (end - start) / speed))
        if duration + 0.05 < (end - start) / speed:
            raise ValueError("duration cannot truncate a trimmed video; adjust end")
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("Shot duration must be positive")
    return {"path": path, "size": (sw, sh), "seconds": duration,
            "source": source_seconds, "frames": max(1, round(duration * FPS))}


def voice_file(scene, assets, work):
    if scene.get("voiceFile"):
        return asset_path(scene["voiceFile"], assets, work)
    narration = scene.get("narration", "").strip()
    if not narration:
        return None
    if not shutil.which("say"):
        raise RuntimeError("No voiceFile supplied and macOS `say` is unavailable")
    path = work / f"voice-{scene['id']}.aiff"
    digest = hashlib.sha256(("Samantha:185:" + narration).encode()).hexdigest()
    stamp = path.with_suffix(".sha256")
    if not path.is_file() or not stamp.is_file() or stamp.read_text() != digest:
        run(["say", "-v", "Samantha", "-r", "185", "-o", str(path), narration])
        stamp.write_text(digest)
    return path


def split_words(narration):
    words = narration.split()
    if not words:
        return []
    chunks = []
    cursor = 0
    while cursor < len(words):
        remaining = len(words) - cursor
        count = min(9, remaining)
        if remaining > 9 and remaining - count < 6:
            count = max(6, remaining // 2)
        chunks.append(" ".join(words[cursor:cursor + count]))
        cursor += count
    return chunks


def parse_time(value):
    h, m, rest = value.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(rest)


def external_cues(path):
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        if isinstance(data, dict):
            data = data.get("cues", [])
        return [(float(c["start"]), float(c["end"]), c["text"].strip()) for c in data]
    if path.suffix.lower() in {".srt", ".vtt"}:
        text = path.read_text(encoding="utf-8-sig")
        cues = []
        for block in re.split(r"\n\s*\n", text):
            lines = [line.strip() for line in block.splitlines() if line.strip()]
            timing = next((i for i, line in enumerate(lines) if "-->" in line), None)
            if timing is not None:
                a, b = lines[timing].split("-->")
                cues.append((parse_time(a.strip()), parse_time(b.strip().split()[0]),
                             " ".join(lines[timing + 1:])))
        return cues
    raise ValueError("voiceCaptions must be JSON, SRT, or VTT")


def scene_cues(scene, voice_duration, scene_duration, assets, work):
    if scene.get("voiceCaptions"):
        cues = external_cues(asset_path(scene["voiceCaptions"], assets, work))
    else:
        chunks = split_words(scene.get("narration", ""))
        if not chunks:
            return []
        speech_end = min(scene_duration - 0.18, voice_duration or scene_duration - 0.36)
        speech_start = min(0.18, max(0, speech_end - 0.2))
        weights = [sum(max(1, len(word)) for word in chunk.split()) for chunk in chunks]
        total = sum(weights)
        cursor = speech_start
        cues = []
        for chunk, weight in zip(chunks, weights):
            end = cursor + (speech_end - speech_start) * weight / total
            cues.append((cursor, end, chunk))
            cursor = end
    for start, end, content in cues:
        if not (0 <= start < end <= scene_duration + 0.05):
            raise ValueError(f"Caption timing outside scene {scene['id']}")
        if len(content.split()) > 9 or len(content.splitlines()) > 2:
            raise ValueError(f"Caption must have at most 9 words and 2 lines: {content}")
    return cues


def stamp(seconds, vtt=False):
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    whole, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{whole:02}{'.' if vtt else ','}{millis:03}"


def write_captions(cues, prefix):
    lines = []
    vtt = ["WEBVTT", ""]
    for index, cue in enumerate(cues, 1):
        start, end, value, _ = cue
        lines += [str(index), f"{stamp(start)} --> {stamp(end)}", value, ""]
        vtt += [f"{stamp(start, True)} --> {stamp(end, True)}", value, ""]
    prefix.with_suffix(".srt").write_text("\n".join(lines), encoding="utf-8")
    prefix.with_suffix(".vtt").write_text("\n".join(vtt), encoding="utf-8")


def caption_overlays(scene_id, cues, position, work):
    if position not in {"top", "bottom"}:
        raise ValueError("captionPosition must be top or bottom")
    overlays = []
    for index, (start, end, value) in enumerate(cues):
        image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        words = value.split()
        lines = [value]
        face = font("body", 31)
        if text_width(draw, value, face) > 1080:
            midpoint = len(words) // 2
            lines = [" ".join(words[:midpoint]), " ".join(words[midpoint:])]
        if len(lines) > 2:
            raise ValueError("Caption exceeds two lines")
        line_width = max(text_width(draw, line, face) for line in lines)
        pill_width = min(1140, line_width + 44)
        pill_height = 50 if len(lines) == 1 else 84
        x = (W - pill_width) // 2
        y = 78 if position == "top" else H - pill_height - 23
        draw.rounded_rectangle((x, y, x + pill_width, y + pill_height), radius=22,
                               fill=(34, 38, 74, 222))
        for line_index, line in enumerate(lines):
            draw.text((W // 2, y + 6 + line_index * 34), line, anchor="mt",
                      font=face, fill="white")
        path = work / f"caption-{scene_id}-{index:02}.png"
        image.save(path)
        overlays.append((path, start, end))
    return overlays


def render_shot(info, path):
    sw, sh = info["size"]
    seconds = info["frames"] / FPS
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    if info["source"] is None:
        command += ["-loop", "1", "-framerate", str(FPS), "-i", str(info["path"])]
        filters = []
    else:
        start, end, speed = info["source"]
        command += ["-ss", str(start), "-t", str(end - start), "-i", str(info["path"])]
        filters = [f"setpts=(PTS-STARTPTS)/{speed}"]
    filters += [f"fps={FPS}",
                f"scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos:out_range=tv",
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={NAVY}",
                "setsar=1", f"tpad=stop_mode=clone:stop_duration={seconds}",
                "format=yuv420p",
                "setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709"]
    command += ["-vf", ",".join(filters), "-frames:v", str(info["frames"]),
                "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709",
                "-color_primaries", "bt709", "-r", str(FPS), str(path)]
    run(command)


def render_scene(scene, infos, length, shots, overlay, highlights, captions, out, work):
    # Concat already normalized shots, then repeat only the final frame if voice needs room.
    concat = work / f"concat-{scene['id']}.txt"
    concat.write_text("".join(f"file '{p.as_posix()}'\n" for p in shots))
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
               "-reinit_filter", "0", "-f", "concat", "-safe", "0", "-i", str(concat),
               "-loop", "1", "-i", str(overlay)]
    for path, _, _ in highlights + captions:
        command += ["-loop", "1", "-i", str(path)]
    filters = [f"[0:v]fps={FPS},tpad=stop_mode=clone:stop_duration={length},"
               f"trim=duration={length},setpts=PTS-STARTPTS[base]",
                "[1:v]format=rgba,fade=t=in:st=0:d=0.18:alpha=1[chip]",
                "[base][chip]overlay=0:0:shortest=0[v0]"]
    last = "v0"
    for index, (_, start, end) in enumerate(highlights + captions):
        next_label = f"v{index + 1}"
        filters.append(f"[{last}][{index + 2}:v]overlay=0:0:enable='between(t,{start},{end})'"
                       f":shortest=0[{next_label}]")
        last = next_label
    command += ["-filter_complex", ";".join(filters), "-map", f"[{last}]",
                "-frames:v", str(round(length * FPS)), "-an", "-c:v", "libx264",
                "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
                "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709",
                "-color_primaries", "bt709", "-r", str(FPS), str(out)]
    run(command)


def click_wav(path, absolute_times, total):
    sample_rate = 48000
    count = math.ceil(total * sample_rate)
    samples = bytearray(count * 2)
    for when in absolute_times:
        origin = round(when * sample_rate)
        for k in range(round(0.065 * sample_rate)):
            pos = origin + k
            if pos >= count:
                break
            level = math.exp(-k / (0.012 * sample_rate))
            value = round(7000 * level * math.sin(2 * math.pi * 850 * k / sample_rate))
            samples[2 * pos:2 * pos + 2] = int(value).to_bytes(2, "little", signed=True)
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(sample_rate)
        stream.writeframes(samples)


def mix_audio(voices, music, clicks, total, out, work):
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
               "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=48000:cl=stereo"]
    for path, _, _ in voices:
        command += ["-i", str(path)]
    music_index = None
    if music:
        music_index = 1 + len(voices)
        command += ["-stream_loop", "-1", "-i", str(music)]
    click_index = None
    if clicks:
        click_index = 1 + len(voices) + int(bool(music))
        command += ["-i", str(clicks)]
    filters = [f"[0:a]atrim=0:{total},aresample=48000[silence]"]
    voice_labels = ["[silence]"]
    for index, (_, at, _) in enumerate(voices, 1):
        delay = round(at * 1000)
        filters.append(f"[{index}:a]aresample=48000,aformat=channel_layouts=stereo,"
                       f"adelay={delay}|{delay}[voice{index}]")
        voice_labels.append(f"[voice{index}]")
    filters.append("".join(voice_labels) +
                   f"amix=inputs={len(voice_labels)}:duration=longest:normalize=0,"
                   f"atrim=0:{total}[voices]")
    mix_labels = ["[voices]"]
    if music_index is not None:
        filters.append(f"[{music_index}:a]aresample=48000,aformat=channel_layouts=stereo,"
                       f"volume=0.65,atrim=0:{total},afade=t=out:st={max(0,total-1.5)}:d=1.5[music]")
        filters.append("[voices]asplit=2[voice_mix][voice_sidechain]")
        mix_labels[0] = "[voice_mix]"
        filters.append("[music][voice_sidechain]sidechaincompress=threshold=0.04:ratio=4:"
                       "attack=40:release=450[ducked]")
        mix_labels.append("[ducked]")
    if click_index is not None:
        filters.append(f"[{click_index}:a]aresample=48000,aformat=channel_layouts=stereo,"
                       f"volume=0.32[clicks]")
        mix_labels.append("[clicks]")
    filters.append("".join(mix_labels) +
                   f"amix=inputs={len(mix_labels)}:duration=longest:normalize=0,"
                   f"atrim=0:{total},alimiter=limit=0.95[aout]")
    command += ["-filter_complex", ";".join(filters), "-map", "[aout]",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
                str(out)]
    run(command)


def preview_frame(info, local_time):
    path = info["path"]
    if info["source"] is None:
        return Image.open(path).convert("RGB")
    start, end, speed = info["source"]
    seek = min(end - 1 / FPS, start + max(0, local_time) * speed)
    raw = subprocess.check_output(["ffmpeg", "-hide_banner", "-loglevel", "error",
                                   "-ss", str(seek), "-i", str(path), "-frames:v", "1",
                                   "-f", "image2pipe", "-vcodec", "png", "-"])
    from io import BytesIO
    return Image.open(BytesIO(raw)).convert("RGB")


def make_preview(manifest, work, cues):
    thumbnails = []
    for record in manifest["scenes"]:
        infos = record["infos"]
        for fraction in (0.25, 0.50, 0.75):
            t = record["duration"] * fraction
            elapsed = 0
            active = len(infos) - 1
            for index, info in enumerate(infos):
                if t < elapsed + info["frames"] / FPS:
                    active = index
                    break
                elapsed += info["frames"] / FPS
            source = preview_frame(infos[active], t - elapsed)
            scale, x, y, width, height = contain(*source.size)
            canvas = Image.new("RGB", (W, H), NAVY)
            canvas.paste(source.resize((width, height), Image.Resampling.LANCZOS), (x, y))
            canvas = Image.alpha_composite(canvas.convert("RGBA"),
                                           Image.open(record["overlay"]).convert("RGBA"))
            for layer, start, end in record["highlights"]:
                if start <= t <= end:
                    canvas = Image.alpha_composite(canvas,
                                                   Image.open(layer).convert("RGBA"))
            absolute = record["start"] + t
            for layer, start, end in record["captions"]:
                if start <= t < end:
                    canvas = Image.alpha_composite(canvas,
                                                   Image.open(layer).convert("RGBA"))
            thumbnail = canvas.convert("RGB").resize((640, 360), Image.Resampling.LANCZOS)
            thumbnails.append(thumbnail)
    if thumbnails:
        sheet = Image.new("RGB", (1920, math.ceil(len(thumbnails) / 3) * 360), NAVY)
        for index, thumb in enumerate(thumbnails):
            sheet.paste(thumb, ((index % 3) * 640, (index // 3) * 360))
        sheet.save(work / "story-preview.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument("--work", type=Path, required=True)
    parser.add_argument("--output-name", default="brote-walkthrough.mp4")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--preview-only", action="store_true")
    args = parser.parse_args()
    # FFmpeg concat resolves relative entries against the list file, not the process cwd.
    args.config = args.config.resolve()
    args.assets = args.assets.resolve()
    args.work = args.work.resolve()
    if args.prepare_only and args.preview_only:
        parser.error("Choose either --prepare-only or --preview-only")
    config = json.loads(args.config.read_text())
    if config.get("language", "en") != "en":
        raise ValueError("This walkthrough renderer supports English only")
    if args.output_name != Path(args.output_name).name or not args.output_name.endswith(".mp4"):
        raise ValueError("--output-name must be a simple .mp4 filename")
    if not config.get("scenes"):
        raise ValueError("Config needs at least one scene")
    ids = [scene["id"] for scene in config["scenes"]]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-z0-9_-]+", i) for i in ids):
        raise ValueError("Scene IDs must be unique lowercase slugs")
    args.work.mkdir(parents=True, exist_ok=True)
    scenes = []
    voices, all_cues, clicks = [], [], []
    timeline = []
    elapsed = 0.0
    for scene in config["scenes"]:
        if not scene.get("shots"):
            raise ValueError(f"Scene {scene['id']} needs shots")
        infos = [shot_info(shot, args.assets) for shot in scene["shots"]]
        shot_times = []
        shot_elapsed = 0.0
        for info in infos:
            duration = info["frames"] / FPS
            shot_times.append((shot_elapsed, shot_elapsed + duration))
            shot_elapsed += duration
        voice = voice_file(scene, args.assets, args.work)
        voice_duration = probe(voice)[2] if voice else 0
        length = max(4.0, float(scene.get("minimum_seconds", 4)),
                     shot_elapsed, voice_duration + 0.6)
        length = math.ceil(length * FPS) / FPS
        cues = scene_cues(scene, voice_duration, length, args.assets, args.work)
        caption_layers = caption_overlays(scene["id"], cues,
                                          scene.get("captionPosition", "bottom"), args.work)
        all_cues.extend((elapsed + a, elapsed + b, value,
                         scene.get("captionPosition", "bottom")) for a, b, value in cues)
        if voice:
            voices.append((voice, elapsed, voice_duration))
        for event in scene.get("clicks", []):
            click_time = float(event["time"] if isinstance(event, dict) else event)
            if not (0 <= click_time < length):
                raise ValueError("Click timestamp outside scene")
            clicks.append(elapsed + click_time)
        overlay = args.work / f"overlay-{scene['id']}.png"
        highlights = scene_overlay(scene, scene.get("highlights", []), length,
                                   shot_times, [info["size"] for info in infos], overlay)
        scenes.append({"id": scene["id"], "infos": infos, "start": elapsed,
                       "duration": length, "overlay": overlay,
                       "highlights": highlights, "captions": caption_layers,
                       "caption_position": scene.get("captionPosition", "bottom")})
        timeline.append({"id": scene["id"], "section": scene.get("section", ""),
                         "label": scene.get("label", ""), "start": round(elapsed, 3),
                         "end": round(elapsed + length, 3),
                         "voiceFile": str(voice) if voice else None,
                         "voiceSeconds": round(voice_duration, 3),
                         "shots": [{"file": str(info["path"]),
                                    "start": round(a, 3), "end": round(b, 3),
                                    "sourceSize": list(info["size"])}
                                   for info, (a, b) in zip(infos, shot_times)],
                         "captions": [{"start": round(a, 3), "end": round(b, 3),
                                       "text": value} for a, b, value in cues]})
        elapsed += length
    prefix = args.work / Path(args.output_name).stem
    write_captions(all_cues, prefix)
    (args.work / "timing-manifest.json").write_text(json.dumps({
        "width": W, "height": H, "fps": FPS, "language": "en",
        "duration": round(elapsed, 3), "scenes": timeline,
        "clicks": [round(t, 3) for t in clicks]
    }, indent=2) + "\n")
    if args.prepare_only:
        print(args.work / "timing-manifest.json")
        return
    if args.preview_only:
        make_preview({"scenes": scenes}, args.work, all_cues)
        print(args.work / "story-preview.png")
        return
    scene_files = []
    for record, scene in zip(scenes, config["scenes"]):
        shot_files = []
        for index, info in enumerate(record["infos"]):
            path = args.work / f"shot-{scene['id']}-{index:02}.mp4"
            render_shot(info, path)
            shot_files.append(path)
        path = args.work / f"scene-{scene['id']}.mp4"
        render_scene(scene, record["infos"], record["duration"], shot_files,
                     record["overlay"], record["highlights"],
                     record["captions"], path, args.work)
        scene_files.append(path)
    concat = args.work / "scenes.txt"
    concat.write_text("".join(f"file '{p.as_posix()}'\n" for p in scene_files))
    video = args.work / "video-joined.mp4"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat",
         "-safe", "0", "-i", str(concat), "-c", "copy", str(video)])
    music = asset_path(config["music"], args.assets, args.work) if config.get("music") else None
    click_path = args.work / "clicks.wav" if clicks else None
    if clicks:
        click_wav(click_path, clicks, elapsed)
    audio = args.work / "audio.m4a"
    mix_audio(voices, music, click_path, elapsed, audio, args.work)
    output = args.work / args.output_name
    # Captions were composited into each scene as small translucent pills.
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
         "-i", str(audio), "-c:v", "copy",
         "-bsf:v", "h264_metadata=video_full_range_flag=0", "-color_range", "tv",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
         "-metadata", "language=eng", "-metadata:s:a:0", "language=eng",
         "-movflags", "+faststart", "-t", str(elapsed), str(output)])
    actual = json.loads(subprocess.check_output(["ffprobe", "-v", "error",
        "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
        "-of", "json", str(output)]))["streams"][0]
    if (actual["width"], actual["height"], actual["r_frame_rate"]) != (W, H, "30/1"):
        raise RuntimeError(f"Output video failed geometry/fps validation: {actual}")
    expected = round(elapsed * FPS)
    if abs(int(actual["nb_frames"]) - expected) > 1:
        raise RuntimeError(f"Frame count mismatch: expected {expected}, got {actual['nb_frames']}")
    make_preview({"scenes": scenes}, args.work, all_cues)
    print(output)


if __name__ == "__main__":
    main()
