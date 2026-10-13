#!/usr/bin/env python3
"""Generate Brote's original 150-second walkthrough music bed.

This project is distributed under the MIT License (see ../LICENSE). The
composition and all synthesized sounds are original; no samples or downloads
are used. Deterministic seed and defaults keep walkthrough renders repeatable.
"""

from __future__ import annotations

import argparse
import math
import wave
from pathlib import Path

import numpy as np


RATE = 48_000
SECONDS = 150
BPM = 114
SEED = 241018


def midi_hz(note: int) -> float:
    return 440.0 * (2.0 ** ((note - 69) / 12.0))


def pan_gains(pan: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


def add_voice(track: np.ndarray, start: float, duration: float, note: int,
              amplitude: float, pan: float, kind: str = "pluck",
              seed: int = 0) -> None:
    """Add a short, soft synthesized note without allocating a full-track layer."""
    begin = max(0, int(round(start * RATE)))
    end = min(len(track), int(round((start + duration) * RATE)))
    count = end - begin
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float64) / RATE
    hz = midi_hz(note)
    if kind == "pad":
        # Rounded, quiet chord tone with no sharp attack or piercing upper partials.
        attack = np.minimum(1.0, t / 0.30)
        release = np.minimum(1.0, np.maximum(0.0, (duration - t) / 0.35))
        env = attack * release
        phase = 2.0 * np.pi * hz * t
        signal = (np.sin(phase) + 0.20 * np.sin(2.0 * phase + 0.1))
        signal *= (0.90 + 0.10 * np.sin(2 * np.pi * 0.23 * t + seed))
    elif kind == "bass":
        env = np.exp(-t * 4.8) * np.minimum(1.0, t / 0.012)
        phase = 2.0 * np.pi * hz * t
        signal = np.sin(phase) + 0.12 * np.sin(2.0 * phase)
    else:
        env = np.exp(-t * 5.6) * np.minimum(1.0, t / 0.008)
        phase = 2.0 * np.pi * hz * t
        # Warm tine-like pluck with quickly fading, low harmonics.
        signal = (np.sin(phase) + 0.32 * np.sin(2.0 * phase + 0.08)
                  + 0.10 * np.sin(3.0 * phase + 0.19))
        signal *= 1.0 + 0.012 * np.sin(2 * np.pi * 5.1 * t + seed)
    left, right = pan_gains(pan)
    voice = (signal * env * amplitude).astype(np.float32)
    track[begin:end, 0] += voice * left
    track[begin:end, 1] += voice * right


def add_percussion(track: np.ndarray, start: float, kind: str,
                   amplitude: float, rng: np.random.Generator,
                   pan: float = 0.0) -> None:
    duration = {"kick": 0.20, "snare": 0.12, "shaker": 0.060}[kind]
    begin = max(0, int(round(start * RATE)))
    end = min(len(track), int(round((start + duration) * RATE)))
    n = end - begin
    if n <= 0:
        return
    t = np.arange(n, dtype=np.float64) / RATE
    if kind == "kick":
        # Soft low thump with a short pitch sweep, rather than a hard click.
        phase = 2 * np.pi * (71.0 * t - 28.0 * t * t / duration)
        sample = np.sin(phase) * np.exp(-t * 19.0)
    else:
        noise = rng.standard_normal(n)
        # Difference filter removes rumble; short envelope keeps it light.
        noise = np.concatenate(([noise[0]], np.diff(noise)))
        env = np.exp(-t * (35.0 if kind == "snare" else 57.0))
        sample = noise * env
        sample /= max(1.0, float(np.max(np.abs(sample))) * 3.5)
    left, right = pan_gains(pan)
    audio = (sample * amplitude).astype(np.float32)
    track[begin:end, 0] += audio * left
    track[begin:end, 1] += audio * right


def compose() -> np.ndarray:
    rng = np.random.default_rng(SEED)
    total = RATE * SECONDS
    track = np.zeros((total, 2), dtype=np.float32)
    beat = 60.0 / BPM
    bar = 4.0 * beat

    # A friendly C-major loop, with one harmony change every two bars.
    chords = [
        (60, (60, 64, 67), (36, 48)),  # C
        (57, (57, 60, 64), (33, 45)),  # Am
        (53, (53, 57, 60), (29, 41)),  # F
        (55, (55, 59, 62), (31, 43)),  # G
    ]
    # An original pentatonic hook, phrased in varied two-bar motifs.
    motifs = [
        [72, 76, 79, 76, 74, 76, 79, 84],
        [79, 76, 72, 74, 76, 79, 76, 72],
        [72, 74, 76, 79, 84, 79, 76, 74],
        [76, 79, 84, 83, 79, 76, 74, 72],
    ]
    bars = math.ceil(SECONDS / bar)
    for bar_index in range(bars):
        bar_start = bar_index * bar
        if bar_start >= SECONDS:
            break
        chord_idx = (bar_index // 2) % len(chords)
        root, chord_notes, bass_notes = chords[chord_idx]
        # Soft sustained chord in the middle register, rotated gently in stereo.
        pad_len = min(bar * 1.92, SECONDS - bar_start)
        for index, note in enumerate(chord_notes):
            add_voice(track, bar_start, pad_len, note + 12, 0.014,
                      (-0.20, 0.10, 0.28)[index], "pad", bar_index + index)

        # Rounded bass pulse, with a small fifth answer every other beat.
        for beat_idx in range(4):
            at = bar_start + beat_idx * beat
            if at < SECONDS:
                bass_note = bass_notes[0] if beat_idx in (0, 2) else bass_notes[1]
                add_voice(track, at, 0.28, bass_note, 0.105, -0.06, "bass")

            # Restrained kick and rim-like backbeat; omit occasional kicks for air.
            if beat_idx in (0, 2) and (bar_index % 4 != 3 or beat_idx == 0):
                add_percussion(track, at, "kick", 0.14, rng)
            if beat_idx in (1, 3):
                add_percussion(track, at, "snare", 0.072, rng, 0.08)

        # Eighth-note sparkle in alternating bars, with a quiet sixteenth pickup.
        if bar_index % 2 == 0:
            for step in range(8):
                at = bar_start + step * beat / 2
                if at < SECONDS:
                    add_percussion(track, at, "shaker", 0.078, rng,
                                   -0.20 if step % 2 == 0 else 0.20)
            if bar_index % 4 == 0:
                add_percussion(track, bar_start + 3.5 * beat, "shaker", 0.044,
                               rng, -0.30)

        # Melodic motif changes every two bars. Leave every fourth bar sparser.
        motif = motifs[(bar_index // 2) % len(motifs)]
        for step, note in enumerate(motif):
            if bar_index % 4 == 3 and step not in (0, 3, 6):
                continue
            at = bar_start + step * beat / 2
            if at >= SECONDS:
                continue
            # Gentle velocity contour; occasional octave echo adds playful lift.
            accent = 1.12 if step in (0, 4) else 0.84 if step in (3, 7) else 1.0
            add_voice(track, at, 0.27 if step % 2 == 0 else 0.21,
                      note, 0.064 * accent, 0.24 if step % 2 else -0.18,
                      seed=bar_index * 8 + step)
            if bar_index % 8 == 5 and step == 4:
                add_voice(track, at, 0.23, note + 12, 0.018, 0.38)

    # Light, click-free fade in and fade out for clean edits.
    fade_in = int(1.4 * RATE)
    fade_out = int(2.8 * RATE)
    track[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)[:, None]
    track[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)[:, None]

    peak = float(np.max(np.abs(track)))
    if peak > 0.66:
        track *= 0.66 / peak
    return track


def main() -> None:
    default_output = Path(__file__).resolve().parents[2] / "output" / "brote-video-en" / "music-bed.wav"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=default_output)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    audio = compose()
    # 24-bit PCM provides a clean source bed for AAC video encoding.
    peak = float(np.max(np.abs(audio)))
    pcm = np.clip(audio, -1.0, 1.0)
    pcm24 = np.rint(pcm * 8_388_607.0).astype(np.int32)
    packed = np.empty((pcm24.size, 3), dtype=np.uint8)
    flat = pcm24.reshape(-1)
    packed[:, 0] = flat & 0xFF
    packed[:, 1] = (flat >> 8) & 0xFF
    packed[:, 2] = (flat >> 16) & 0xFF
    with wave.open(str(args.output), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(3)
        out.setframerate(RATE)
        out.writeframes(packed.tobytes())
    print(f"Wrote {args.output} ({SECONDS}s, {RATE} Hz, stereo, 24-bit PCM, {BPM} BPM; peak {peak:.4f})")


if __name__ == "__main__":
    main()
