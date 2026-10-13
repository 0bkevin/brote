# Instructional videos

[Watch both guides](https://brote-three.vercel.app/guide/) or download the MP4 and subtitle files from that page. The primary guide covers the complete app; the games guide is an optional extra. Both use Spanish narration, animated instructions, real app captures, camera zooms in and out, and burnt captions. The gallery supports Spanish, English, and Brazilian Portuguese.

| Video | Runtime | Format |
| --- | --- | --- |
| Complete app guide | 2:52 | 1920 × 1080, 16:9, 24 fps, H.264/AAC |
| Interactive games guide | 1:02 | 1920 × 1080, 16:9, 24 fps, H.264/AAC |

## Complete app chapters

| Start | Chapter |
| --- | --- |
| 0:00 | El dinero se aprende. En equipo. |
| 0:10 | Un espacio para cada persona. |
| 0:22 | Dale Brotes para empezar. |
| 0:34 | Un sueño. Un primer paso. |
| 0:46 | Detective digital. |
| 0:58 | Mercado aventura. |
| 1:12 | Isla de las metas. |
| 1:26 | Cada movimiento cuenta. |
| 1:41 | Elige tu red. |
| 1:53 | Tu wallet. Tu firma. |
| 2:06 | Deposita. Retira. Verifica. |
| 2:19 | Conserva su camino. |
| 2:32 | También desde el móvil. |
| 2:42 | Tu próxima aventura empieza aquí. |

The walkthrough includes creating profiles and adult consent, assigning fictional Brotes, saving toward goals, the digital safety lesson, Market adventure, Goal Island, practice expense requests and approvals, CSV exports, mainnet/testnet selection, guardian-controlled Solana accounts, deposits and withdrawals, Explorer receipts, backups, demo perspectives, languages, and the mobile side menu.

## Evidence boundaries

Gameplay recordings and stills show actual browser interactions with fictional demo profiles. In-game coins are separate from practice-wallet balances. Rewards require an explicit claim and are granted once per game and profile.

The Solana transaction screens are archived evidence from the disposable local wallet used in [testnet QA](TESTNET_QA.md). The video labels that evidence. No funds were transferred while producing the film. The Phantom/Solflare extension UI and funded mainnet execution remain unvalidated; the app uses the Solana System Program rather than a custom Brote program.

## Rebuild the films

Use macOS with the Paulina voice, Python with Pillow, and `ffmpeg`/`ffprobe`. Fonts are downloaded from the official Google Fonts repository when absent; their licenses remain with the font authors. App art and screenshots are from Brote. No private keys are read.

```sh
python3 -m pip install Pillow
python3 scripts/prepare-video-assets.py --output /tmp/brote-video/assets
python3 scripts/render-guide.py --assets /tmp/brote-video/assets \
  --work /tmp/brote-video/guide --preview-only
python3 scripts/render-guide.py --assets /tmp/brote-video/assets \
  --work /tmp/brote-video/guide
python3 scripts/render-guide.py --config docs/video/games-es.json \
  --assets /tmp/brote-video/assets --work /tmp/brote-video/games \
  --output-name brote-games-es
```

The scene manifests are [guide-es.json](video/guide-es.json) and [games-es.json](video/games-es.json). `--preview-only` checks the entry animation, each shot, and each dissolve before a full render. Audio determines scene lengths, with room between instructions. SRT/VTT captions follow the paced chapter timeline; they are not forced word-level alignment. Production MP4s use `faststart` for progressive playback.

## Review

Parallel implementation and independent content reviews checked the controls, consent, currencies, network costs, evidence labels, rewards, and full-app coverage. Final media validation and browser playback results are recorded in [video evidence](evidence/video-qa.json).
