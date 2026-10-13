# English video guides

The English walkthrough is the primary guide in the [video gallery](https://brote-three.vercel.app/guide/). Download the [full walkthrough](https://brote-three.vercel.app/media/brote-walkthrough-en.mp4), [English subtitles](https://brote-three.vercel.app/media/brote-walkthrough-en.srt) ([WebVTT](https://brote-three.vercel.app/media/brote-walkthrough-en.vtt)), or the [quick app teaser](https://brote-three.vercel.app/media/brote-teaser-en.mp4) with its [SRT](https://brote-three.vercel.app/media/brote-teaser-en.srt) and [WebVTT](https://brote-three.vercel.app/media/brote-teaser-en.vtt). The older Spanish walkthrough and games guide remain archived at their original media URLs.

Both English films are 1920 × 1080, 16:9, 30 fps, H.264 video, and AAC stereo at 48 kHz. They use real browser recordings, full-page contain scaling with no crop or zoom, small chapter tags, on-screen captions, and downloadable subtitle tracks. The full walkthrough runs 2:19; the teaser runs 0:49.

## Walkthrough chapters

| Start | Chapter |
| --- | --- |
| 0:00 | Learn. Play. Grow. |
| 0:04 | Create your circle |
| 0:12 | Give them practice Brotes |
| 0:19 | Save toward a goal |
| 0:25 | Market Adventure |
| 0:39 | Goal Island |
| 0:52 | Digital Detective |
| 0:59 | Practice a purchase |
| 1:08 | Review every decision |
| 1:15 | Guide at their pace |
| 1:22 | Choose your Solana network |
| 1:28 | Guardian-controlled testnet account |
| 1:37 | Review before signing |
| 1:47 | Verify in Solana Explorer |
| 1:56 | Keep their progress |
| 2:05 | Make Brote yours |
| 2:14 | Try Brote |

The walkthrough demonstrates creating profiles and confirming consent for adult learners; assigning practice Brotes; setting goals; Market Adventure, Goal Island, and Digital Detective; practice expense requests, approvals, history, and CSV export; guidance controls; mainnet/testnet selection; and account, backup, and accessibility options. The quick teaser gives a shorter overview of practice, games, guardian review, networks, and settings.

## Evidence boundaries

Practice runs in the local browser. Brotes are fictional practice balances, and game coins stay inside their games. Game rewards require an explicit claim and are granted once per profile. The family/personal perspective switch is a demo control; it does not create an authenticated session.

The Solana account shown is a seeded System Program account controlled by the guardian wallet; Brote does not deploy a custom program. The filmed local QA account used a disposable test wallet. The deposit was taken to its review screen and cancelled before wallet signing; withdrawal fields were filled but not reviewed. No funds moved during filming. Earlier testnet transactions shown in the Explorer were checked against a fresh Explorer view. Phantom/Solflare extension screens and funded mainnet execution remain unvalidated.

## Rebuild

The source manifests are [walkthrough-en.json](video/walkthrough-en.json) and [teaser-en.json](video/teaser-en.json). Their media paths resolve under `docs/video/english/`; keep the captures, recordings, and `music-bed.wav` there. Python 3, Pillow, NumPy, FFmpeg, and ffprobe are required. The renderer loads Outfit and Nunito Sans from the committed `docs/video/english/fonts/` folder, alongside both SIL Open Font licenses. If a scene has no supplied voice track, its fallback uses macOS Samantha English via `say` at 185 words per minute.

Generate the original, sample-free 114 BPM synth music bed and render each film:

```sh
python3 -m venv /tmp/brote-video-tools
source /tmp/brote-video-tools/bin/activate
python3 -m pip install Pillow numpy
python3 scripts/make-walkthrough-music.py --output docs/video/english/music-bed.wav
python3 scripts/render-walkthrough.py --config docs/video/walkthrough-en.json \
  --assets docs/video/english --work /tmp/brote-video-en/walkthrough \
  --output-name brote-walkthrough-en.mp4
python3 scripts/render-walkthrough.py --config docs/video/teaser-en.json \
  --assets docs/video/english --work /tmp/brote-video-en/teaser \
  --output-name brote-teaser-en.mp4
```

The renderer writes the MP4, SRT, WebVTT, and timing manifest into each work directory. Its `--preview-only` option renders a scene contact sheet for review before a full build. The committed asset bundle and final publication checks are tracked in [English video QA evidence](evidence/video-english-qa.json).

## Release and audience review

The teaser states its proposition in the first three seconds, moves through several real app actions in its opening six seconds, uses captions, and ends with a direct invitation to try Brote. This follows TikTok's general guidance for an early hook, captions or text, movement, and a clear call to action ([TikTok creative best practices](https://ads.tiktok.com/resources/help/article/creative-best-practices?lang=en)). The 16:9 format keeps the app legible as a full-page walkthrough; TikTok's platform-specific guidance favors vertical 9:16, so these exports are not tailored to that format.

These choices do not guarantee engagement. After release, use audience-retention analytics to find where viewers leave, rewatch, or skip, and revise the opening or pacing based on observed results ([YouTube audience-retention guide](https://support.google.com/youtube/answer/9314415?hl=en)).
