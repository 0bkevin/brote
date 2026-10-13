#!/usr/bin/env python3
"""Render a Spanish Brote guide or game reel from real app captures.

Requires Pillow, macOS ``say`` (Paulina), ffmpeg and ffprobe.  Shots can use a
still ``file`` or a directory of numbered PNGs in ``framesDir``.  Paths in the
config are relative to --assets.  No wallet keys are read.
"""
import argparse
import concurrent.futures
import json
import math
import re
import subprocess
import wave
from functools import lru_cache
from pathlib import Path
from urllib.request import urlretrieve

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
W, H, FPS = 1920, 1080, 24
NAVY, PURPLE, LIME, CORAL = '#22264a', '#6c4bff', '#d7ff5c', '#ff926b'
PANEL = (655, 194, 1195, 674)
CROSSFADE_SECONDS = .65
MAX_ZOOM = 1.75  # Keep at least 57% of each screenshot dimension in view.


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(path)]))


def fonts(folder):
    folder.mkdir(parents=True, exist_ok=True)
    for name, route in [('Outfit', 'outfit/Outfit%5Bwght%5D.ttf'), ('NunitoSans', 'nunitosans/NunitoSans%5BYTLC,opsz,wdth,wght%5D.ttf')]:
        path = folder / (name + '.ttf')
        if not path.exists():
            urlretrieve('https://raw.githubusercontent.com/google/fonts/main/ofl/' + route, path)


@lru_cache(maxsize=64)
def font(folder, size, heading=False, weight=600):
    f = ImageFont.truetype(str(Path(folder) / ('Outfit.ttf' if heading else 'NunitoSans.ttf')), size)
    f.set_variation_by_axes([weight] if heading else [weight, 100, 12, 500])
    return f


def wrap(draw, text, f, max_width):
    lines = []
    for paragraph in text.split('\n'):
        line = ''
        for word in paragraph.split():
            trial = (line + ' ' + word).strip()
            if line and draw.textlength(trial, font=f) > max_width:
                lines.append(line)
                line = word
            else:
                line = trial
        lines.append(line)
    return lines


def textblock(draw, xy, text, f, color, max_width, leading):
    x, y = xy
    lines = wrap(draw, text, f, max_width)
    for line in lines:
        draw.text((x, y), line, font=f, fill=color, anchor='lt')
        y += leading
    return y


def ease(v):
    v = max(0, min(1, v))
    return v * v * (3 - 2 * v)


def sprout(draw, x, y, size=64):
    draw.line((x + size * .48, y + size * .88, x + size * .48, y + size * .38), fill=LIME, width=7)
    draw.ellipse((x + size * .03, y + size * .26, x + size * .46, y + size * .63), fill=LIME)
    draw.ellipse((x + size * .48, y + size * .06, x + size * .96, y + size * .44), fill=LIME)


@lru_cache(maxsize=1)
def backdrop():
    im = Image.new('RGB', (W, H), NAVY)
    d = ImageDraw.Draw(im)
    for y in range(H):
        a = y / H
        d.line((0, y, W, y), fill=(int(29 + 9*a), int(30 + 4*a), int(66 + 23*a)))
    d.ellipse((1510, -410, 2380, 460), fill='#302b64')
    d.ellipse((-320, 730, 340, 1390), fill='#302d61')
    d.arc((1490, 720, 2210, 1440), 190, 300, fill='#504482', width=2)
    return im


def panel_image(img, focus, zoom, width, height):
    iw, ih = img.size
    aspect = width / height
    zoom = max(1., min(MAX_ZOOM, float(zoom)))
    cw = min(iw, ih * aspect) / zoom
    ch = cw / aspect
    cx, cy = focus
    left = max(0, min(iw-cw, cx-cw/2))
    top = max(0, min(ih-ch, cy-ch/2))
    cropped = img.crop((left, top, left+cw, top+ch))
    return cropped.resize((width, height), Image.Resampling.BICUBIC), (left, top, cw, ch)


class ShotSource:
    """Read only the PNG needed for the current output frame (with a small cache)."""

    def __init__(self, shot, assetsdir):
        if ('file' in shot) == ('framesDir' in shot):
            raise ValueError('Each shot needs exactly one of file or framesDir')
        if 'framesDir' in shot:
            folder = assetsdir / shot['framesDir']
            if not folder.is_dir():
                raise FileNotFoundError(folder)
            numbered = []
            for path in folder.iterdir():
                match = re.search(r'(\d+)\.png$', path.name, re.IGNORECASE)
                if match:
                    numbered.append((int(match.group(1)), path.name, path))
            self.paths = [p for _, _, p in sorted(numbered)]
            if not self.paths:
                raise ValueError(f'No numbered PNGs in {folder}')
            self.source_fps = float(shot.get('sourceFps', FPS))
            if not math.isfinite(self.source_fps) or self.source_fps <= 0:
                raise ValueError('sourceFps must be positive')
        else:
            self.paths = [assetsdir / shot['file']]
            self.source_fps = 0
        if not self.paths[0].is_file():
            raise FileNotFoundError(self.paths[0])
        self.size = self.frame(0).size

    @lru_cache(maxsize=8)
    def _load(self, index):
        with Image.open(self.paths[index]) as image:
            return image.convert('RGB')

    def frame(self, elapsed):
        index = min(len(self.paths) - 1, max(0, int(max(0, elapsed) * self.source_fps)))
        return self._load(index)


def shot_panel(shot, source, elapsed, slot, fontdir):
    image = source.frame(elapsed)
    pw, ph = PANEL[2:]
    phase = max(0., min(1., elapsed / max(.01, slot)))
    if image.width < 600:
        # A phone capture remains legible as a centered phone-sized screenshot.
        pane = Image.new('RGB', (pw, ph), '#302b5d')
        h = ph - 32
        w = round(image.width * h / image.height)
        pane.paste(image.resize((w, h), Image.Resampling.LANCZOS), ((pw-w)//2, 16))
        pd = ImageDraw.Draw(pane)
        for y, label, color in [(85, 'ES', LIME), (161, 'EN', 'white'), (237, 'PT', CORAL)]:
            pd.text((65, y), label, font=font(fontdir, 43, True, 700), fill=color)
        crop = None
    else:
        center = shot.get('startFocus', (image.width / 2, image.height / 2))
        target = shot.get('focus', center)
        # Enter the detail, hold it, then return to context before the next cut.
        # Each camera move includes both the requested zoom-in and zoom-out.
        motion = ease(phase / .32) * (1. - ease((phase - .80) / .20))
        focus = (center[0] + (target[0]-center[0])*motion,
                 center[1] + (target[1]-center[1])*motion)
        target_zoom = min(MAX_ZOOM, max(1., float(shot.get('zoom', 1.18))))
        zoom = 1. + (target_zoom-1.) * motion
        pane, crop = panel_image(image, focus, zoom, pw, ph)
    if crop and shot.get('pointer'):
        sx, sy = shot['pointer']
        left, top, cw, ch = crop
        xx, yy = (sx-left)*pw/cw, (sy-top)*ph/ch
        if 32 < xx < pw-32 and 32 < yy < ph-32:
            travel = ease((phase-.1)/.5)
            xx -= (1-travel)*66
            yy -= (1-travel)*48
            opacity = ease((phase-.08)/.2) * (1-ease((phase-.84)/.15))
            if opacity > 0:
                overlay = Image.new('RGBA', (pw, ph))
                pointer = ImageDraw.Draw(overlay)
                r = 16 + 4*math.sin(phase*math.pi*4)
                pointer.ellipse((xx-r, yy-r, xx+r, yy+r), outline=PURPLE, width=4)
                pointer.polygon([(xx,yy),(xx+7,yy+29),(xx+14,yy+19),(xx+25,yy+20)],
                                fill='white', outline=PURPLE, width=2)
                overlay.putalpha(overlay.getchannel('A').point(lambda value: int(value*opacity)))
                pane = Image.alpha_composite(pane.convert('RGBA'), overlay).convert('RGB')
    return pane


def scene_frame(scene, t, length, index, count, sources, fontdir, total_before,
                total_duration, title='brote.', kicker='GUÍA DE INICIO'):
    im = backdrop().copy()
    d = ImageDraw.Draw(im)
    sprout(d, 65, 54)
    title_size = 68
    while title_size > 30 and d.textlength(title, font=font(fontdir, title_size, True, 800)) > 690:
        title_size -= 2
    if d.textlength(title, font=font(fontdir, title_size, True, 800)) > 690:
        raise ValueError('Config title is too long for the header')
    d.text((145, 56), title, font=font(fontdir, title_size, True, 800), fill='white', anchor='lt')
    d.text((1850, 76), kicker, font=font(fontdir, 20, False, 700), fill='#c5c4dc', anchor='rt')
    accent = CORAL if scene.get('chapter') == 'SOLANA' else LIME
    d.rounded_rectangle((70, 197, 145, 247), radius=25, fill=accent)
    d.text((107, 222), f'{index+1:02}', font=font(fontdir, 23, True, 700), fill=NAVY, anchor='mm')
    d.text((163, 211), scene['chapter'], font=font(fontdir, 22, False, 800), fill=accent, anchor='lt')
    reveal = ease(t / .65)
    layer = Image.new('RGBA', (W,H))
    ld = ImageDraw.Draw(layer)
    yy = textblock(ld, (70, 286 + int((1-reveal)*25)), scene['headline'], font(fontdir, 66, True, 750), 'white', 500, 73)
    yy = textblock(ld, (70, yy+30), scene['body'], font(fontdir, 30, False, 500), '#d2d2e6', 490, 42)
    if yy > 695:
        raise ValueError('Text too tall: ' + scene['headline'])
    ld.rounded_rectangle((70, 750, 580, 870), radius=22, fill='#393464')
    ld.text((95, 769), 'HAZ ESTO', font=font(fontdir, 17, False, 800), fill=accent, anchor='lt')
    textblock(ld, (95, 803), scene['action'], font(fontdir, 27, True, 650), 'white', 455, 33)
    layer.putalpha(layer.getchannel('A').point(lambda x: int(x*reveal)))
    im = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')

    shots = scene['shots']
    slot = length / len(shots)
    shot_index = min(int(t / slot), len(shots)-1)
    fade = min(CROSSFADE_SECONDS, slot*.35)
    start = max(0., shot_index*slot - (fade if shot_index else 0))
    pane = shot_panel(shots[shot_index], sources[shot_index], t-start, slot, fontdir)
    boundary = (shot_index+1)*slot
    if shot_index+1 < len(shots) and t >= boundary-fade:
        next_pane = shot_panel(shots[shot_index+1], sources[shot_index+1],
                               t-(boundary-fade), slot, fontdir)
        pane = Image.blend(pane, next_pane, ease((t-(boundary-fade))/fade))
    px, py, pw, ph = PANEL
    mask = Image.new('L', (pw,ph)); ImageDraw.Draw(mask).rounded_rectangle((0,0,pw-1,ph-1),radius=24,fill=255)
    # A soft offset shadow with no decorative card outline.
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((px+7,py+10,px+pw+7,py+ph+10),radius=24,fill='#171832')
    im.paste(pane,(px,py),mask)
    d = ImageDraw.Draw(im)
    d.text((655, 893), scene.get('note','CAPTURAS REALES · DATOS DE EJEMPLO'), font=font(fontdir,18,False,700), fill='#b2b1d0', anchor='lt')
    # Small chapter markers plus a continuous progress line.
    for i in range(count):
        x=70+i*31
        d.ellipse((x,915,x+10,925),fill=accent if i==index else '#575477')
    d.rounded_rectangle((655,925,1850,929),radius=2,fill='#514b78')
    progress=(total_before+t)/total_duration
    d.rounded_rectangle((655,925,655+1195*progress,929),radius=2,fill=accent)
    parts = scene['subtitle_parts']
    subtitle = parts[min(int(max(0,t-.6)/max(.01,(length-1.2))*len(parts)),len(parts)-1)] if .6 <= t < length-.6 else ''
    if subtitle:
        sf=font(fontdir,28,False,600)
        lines=wrap(d,subtitle,sf,1670)
        if len(lines)>2: raise ValueError('Subtitle too long')
        for j,line in enumerate(lines):
            d.text((W/2,969+j*37),line,font=sf,fill='white',anchor='mt')
    return im


def subtitles(text):
    words=text.split(); chunks=[]; part=''
    for word in words:
        if len(part)+len(word)>93:
            chunks.append(part.strip()); part=''
        part += word+' '
    if part: chunks.append(part.strip())
    return chunks


def timestamp(t, separator=','):
    ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
    return f'{h:02}:{m:02}:{s:02}{separator}{ms:03}'


def render_scene(item):
    scene,index,count,assetsdir,fontdir,work,before,total,title,kicker=item
    sources=[ShotSource(shot, assetsdir) for shot in scene['shots']]
    n=scene['frames']; length=n/FPS
    clip=work/f'{index:02}.mp4'
    ff=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','20','-pix_fmt','yuv420p',str(clip)],stdin=subprocess.PIPE)
    try:
        for f in range(n):
            im=scene_frame(scene,f/FPS,length,index,count,sources,fontdir,before,total,title,kicker)
            ff.stdin.write(im.tobytes())
            if f==min(n-1,3*FPS): im.save(work/f'preview-{index:02}.jpg',quality=92)
    finally:
        ff.stdin.close()
    if ff.wait()!=0: raise RuntimeError('ffmpeg render failed')
    print(f'Rendered {index+1}/{count}: {scene["headline"]}',flush=True)
    return clip


def preview_scene(scene, index, count, assetsdir, fontdir, work, before, total, title, kicker):
    sources=[ShotSource(shot, assetsdir) for shot in scene['shots']]
    length=scene['frames']/FPS
    slot=length/len(sources)
    # Validate the entry animation as well as the settled layout. Its vertical
    # offset must never hide an overflow that would fail only during rendering.
    moments=[(0., f'preview-{index:02}-entry.jpg'),
             (min(3., length-.001), f'preview-{index:02}.jpg')]
    for shot_index in range(len(sources)):
        moments.append(((shot_index+.5)*slot, f'preview-{index:02}-shot-{shot_index:02}.jpg'))
        if shot_index+1 < len(sources):
            fade=min(CROSSFADE_SECONDS, slot*.35)
            moments.append(((shot_index+1)*slot-fade/2,
                            f'preview-{index:02}-transition-{shot_index:02}.jpg'))
    for t, filename in moments:
        scene_frame(scene,t,length,index,count,sources,fontdir,before,total,title,kicker).save(
            work/filename, quality=92)


def selected_scenes(config, indices):
    scenes=config['scenes']
    if not isinstance(scenes,list) or not scenes:
        raise ValueError('Config needs a nonempty scenes list')
    if indices is None:
        return scenes
    try:
        choices=[int(part.strip()) for part in indices.split(',')]
    except ValueError as error:
        raise ValueError('--scene-indices needs comma-separated zero-based integers') from error
    if not choices or len(set(choices)) != len(choices) or any(i<0 or i>=len(scenes) for i in choices):
        raise ValueError('--scene-indices contains a duplicate or out-of-range index')
    return [scenes[i] for i in choices]


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--config',type=Path,default=ROOT/'docs/video/guide-es.json',
                   help='JSON script (default: docs/video/guide-es.json)')
    p.add_argument('--assets',type=Path,required=True,help='Root for shot files and framesDir directories')
    p.add_argument('--work',type=Path,required=True,help='Directory for clips, previews, subtitles and final MP4')
    p.add_argument('--fonts',type=Path,help='Folder with Outfit.ttf and NunitoSans.ttf (default: work parent/fonts)')
    p.add_argument('--output-name',default='brote-guide-es',help='Output basename without extension')
    p.add_argument('--scene-indices',help='Zero-based scene indices, comma separated, in render order')
    p.add_argument('--prepare-only',action='store_true',help='Write timing, voice files and subtitles')
    p.add_argument('--preview-only',action='store_true',help='Also render JPG previews, without MP4')
    args=p.parse_args()
    if args.prepare_only and args.preview_only:
        p.error('Choose either --prepare-only or --preview-only')
    if not re.fullmatch(r'[\w-]+',args.output_name,re.UNICODE):
        p.error('--output-name must be a filename stem containing letters, numbers, _ or -')
    config=json.loads(args.config.read_text(encoding='utf-8'))
    if any(config.get(key,value)!=value for key,value in [('width',W),('height',H),('fps',FPS)]):
        p.error('Config width, height and fps must be 1920, 1080 and 24')
    scenes=selected_scenes(config,args.scene_indices)
    title=config.get('title','brote.')
    kicker=config.get('kicker','GUÍA DE INICIO')
    if not isinstance(title,str) or not title or not isinstance(kicker,str):
        p.error('title and kicker must be strings (title cannot be empty)')
    args.work.mkdir(parents=True,exist_ok=True)
    fontdir=args.fonts or args.work.parent/'fonts'; fonts(fontdir)
    before=0
    for i,s in enumerate(scenes):
        txt=args.work/f'{i:02}.txt'
        changed = not txt.exists() or txt.read_text(encoding='utf-8') != s['narration']
        txt.write_text(s['narration'],encoding='utf-8')
        aiff=args.work/f'{i:02}.aiff'
        if changed or not aiff.exists(): run(['say','-v','Paulina','-r','165','-f',str(txt),'-o',str(aiff)])
        length=max(s.get('minimum_seconds',9),duration(aiff)+1.8)
        s['frames']=math.ceil(length*FPS); s['subtitle_parts']=subtitles(s['narration']); s['start']=before; before+=s['frames']/FPS
    (args.work/'timing.json').write_text(json.dumps({'duration':before,'fps':FPS,
        'width':W,'height':H,'title':title,'kicker':kicker,'scenes':scenes},ensure_ascii=False,indent=2))
    print(f'Video duration: {before:.2f}s',flush=True)
    cues=[]; vtt=['WEBVTT\n']; serial=1
    for s in scenes:
        step=(s['frames']/FPS-1.2)/len(s['subtitle_parts'])
        for j,part in enumerate(s['subtitle_parts']):
            a=s['start']+.6+j*step; b=a+step
            cues.append(f'{serial}\n{timestamp(a)} --> {timestamp(b)}\n{part}\n'); serial+=1
            vtt.append(f'{timestamp(a,".")} --> {timestamp(b,".")}\n{part}\n')
    (args.work/f'{args.output_name}.srt').write_text('\n'.join(cues),encoding='utf-8')
    (args.work/f'{args.output_name}.vtt').write_text('\n'.join(vtt),encoding='utf-8')
    if args.prepare_only: return
    if args.preview_only:
        for i,s in enumerate(scenes):
            preview_scene(s,i,len(scenes),args.assets,str(fontdir),args.work,s['start'],before,title,kicker)
        return
    jobs=[(s,i,len(scenes),args.assets,str(fontdir),args.work,s['start'],before,title,kicker) for i,s in enumerate(scenes)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        clips=list(pool.map(render_scene,jobs))
    listing=args.work/'clips.txt'; listing.write_text('\n'.join(f"file '{c.as_posix()}'" for c in clips))
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy',str(args.work/'silent.mp4')])
    # Compose the paced narration timeline with silence between chapters.
    for i,s in enumerate(scenes):
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(args.work/f'{i:02}.aiff'),'-af','adelay=600:all=1,apad','-t',str(s['frames']/FPS),'-ar','48000','-ac','1',str(args.work/f'{i:02}.wav')])
    with wave.open(str(args.work/'voice.wav'),'wb') as target:
        target.setnchannels(1); target.setsampwidth(2); target.setframerate(48000)
        for i in range(len(scenes)):
            with wave.open(str(args.work/f'{i:02}.wav'),'rb') as source: target.writeframes(source.readframes(source.getnframes()))
    output=args.work/f'{args.output_name}.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(args.work/'silent.mp4'),'-i',str(args.work/'voice.wav'),'-c:v','copy','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000','-c:a','aac','-b:a','160k','-metadata:s:a:0','language=spa','-movflags','+faststart','-shortest',str(output)])
    print(f'Finished: {output} ({output.stat().st_size/1048576:.1f} MiB)',flush=True)


if __name__=='__main__': main()
