#!/usr/bin/env python3
"""Rebuild tutorial frames from the committed browser recordings and stills."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    source = ROOT / 'docs/video'
    manifest = json.loads((source / 'footage.json').read_text())
    for still in (source / 'captures').glob('*.png'):
        shutil.copy2(still, args.output / still.name)
    for shot in manifest['sequences']:
        folder = args.output / shot['frames_dir']
        folder.mkdir(exist_ok=True)
        for old in folder.glob('[0-9][0-9][0-9][0-9][0-9].png'):
            old.unlink()
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                   '-i', str(source / 'recordings' / shot['file'])]
        if 'seconds' in shot:
            command += ['-t', str(shot['seconds'])]
        command += ['-vf', f"fps={manifest['source_fps']}", str(folder / '%05d.png')]
        subprocess.run(command, check=True)
        print(f"Prepared {shot['frames_dir']}", flush=True)


if __name__ == '__main__':
    main()
