#!/usr/bin/env python3
"""Rebuild the standalone architecture page and compact README GIF.

Run from anywhere: python3 scripts/architecture-build.py
Requires Pillow. The hand-authored architecture.svg is the static source of truth.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "docs/assets/architecture.svg"
HTML = ROOT / "docs/architecture.html"
GIF = ROOT / "docs/assets/solana-flow.gif"


def build_html() -> None:
    svg = SVG.read_text(encoding="utf-8")
    html = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Brote architecture</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #24234a; background: #f7f6ff; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: clamp(16px, 3vw, 44px); }
    main { max-width: 1180px; margin: auto; }
    .diagram { margin: 0; overflow-x: auto; border-radius: 24px; box-shadow: 0 18px 50px #32266716; background: #faf9ff; }
    .diagram svg { display: block; width: 100%; min-width: 790px; height: auto; }
    .mobile-hint { display: none; margin: 9px 3px 0; color: #696680; font-size: 13px; }
    .details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .details section { padding: 16px 20px; border: 1px solid #e1ddf3; border-radius: 16px; background: #fff; }
    .details h2 { font-size: 15px; margin: 0 0 6px; }
    .details p { color: #595a75; font-size: 14px; line-height: 1.5; margin: 0; }
    .practice h2 { color: #4c6c22; } .real h2 { color: #6247d4; }
    #step1, #step2, #step3, #step4 { animation: pulse 6s linear infinite; }
    #step2 { animation-delay: -4.5s; } #step3 { animation-delay: -3s; } #step4 { animation-delay: -1.5s; }
    @keyframes pulse { 0%, 22% { fill: #dfd7ff; stroke: #8068e9; } 25%, 100% { fill: #fff; stroke: #d7ceff; } }
    @media (prefers-reduced-motion: reduce) { #step1, #step2, #step3, #step4 { animation: none; } }
    @media (max-width: 760px) { .mobile-hint { display: block; } .details { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
<main>
  <figure class="diagram">
""" + svg + """
  </figure>
  <p class="mobile-hint">Swipe horizontally to explore the full diagram.</p>
  <div class="details">
    <section class="practice"><h2>Practice remains local</h2><p>Brotes are fictitious entries in this browser’s practice ledger. Web Locks lets one tab edit at a time; other tabs follow saved changes in read-only mode.</p></section>
    <section class="real"><h2>Real SOL needs the guardian</h2><p>The guardian signs mainnet System Program transactions. Brote stores the signed bytes locally before broadcasting; an uncertain RPC result stays pending for reconciliation.</p></section>
  </div>
</main>
</body>
</html>
"""
    HTML.write_text(html, encoding="utf-8")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    base = Path("/System/Library/Fonts/Supplemental")
    path = base / ("Arial Bold.ttf" if bold else "Arial.ttf")
    if not path.exists():
        path = Path("/usr/share/fonts/truetype/dejavu") / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    return ImageFont.truetype(str(path), size)


def center(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], label: str, f: ImageFont.FreeTypeFont, fill: str) -> None:
    l, t, r, b = xy
    bounds = draw.textbbox((0, 0), label, font=f)
    draw.text(((l + r - (bounds[2] - bounds[0])) / 2, (t + b - (bounds[3] - bounds[1])) / 2 - bounds[1]), label, font=f, fill=fill)


def card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title: str, active: bool, number: int) -> None:
    draw.rounded_rectangle(box, radius=14, fill="#ddd5ff" if active else "#ffffff", outline="#7458e8" if active else "#d5cafa", width=3 if active else 2)
    x1, y1, x2, y2 = box
    draw.ellipse((x1 + 14, y1 + 18, x1 + 44, y1 + 48), fill="#6c4bff")
    center(draw, (x1 + 14, y1 + 18, x1 + 44, y1 + 48), str(number), font(17, True), "#ffffff")
    center(draw, (x1 + 49, y1 + 12, x2 - 8, y2 - 8), title, font(19, True), "#29254f")


def arrow(draw: ImageDraw.ImageDraw, x: int, y: int, color: str) -> None:
    draw.line((x, y, x + 23, y), fill=color, width=3)
    draw.line((x + 17, y - 6, x + 23, y, x + 17, y + 6), fill=color, width=3, joint="curve")


def gif_frame(active: int) -> Image.Image:
    im = Image.new("RGB", (1000, 440), "#f8f7ff")
    d = ImageDraw.Draw(im)
    d.ellipse((29, 23, 77, 71), fill="#d7ff5c")
    d.line((53, 58, 53, 39), fill="#30315d", width=4)
    d.arc((40, 30, 56, 48), 0, 180, fill="#30315d", width=3)
    d.arc((53, 26, 70, 46), 180, 360, fill="#30315d", width=3)
    d.text((88, 25), "BROTE  /  TWO SEPARATE PATHS", font=font(26, True), fill="#262349")
    d.rounded_rectangle((24, 82, 976, 205), radius=20, fill="#f1ffd2", outline="#d5eaa4", width=2)
    d.rounded_rectangle((42, 99, 228, 129), radius=15, fill="#d7ff5c")
    center(d, (42, 99, 228, 129), "PRACTICE BROTES", font(17, True), "#3f591c")
    d.text((246, 102), "Fictitious · no monetary value", font=font(17), fill="#50643f")
    for i, (label, x1, x2) in enumerate((("Profiles + goals", 42, 302), ("Web Locks: one writer", 369, 655), ("Browser-local ledger", 724, 958))):
        d.rounded_rectangle((x1, 143, x2, 188), radius=12, fill="#e3ffa2" if active == 0 else "#ffffff", outline="#aeca77", width=2)
        center(d, (x1 + 5, 143, x2 - 5, 188), label, font(18, True), "#333d2e")
        if i < 2:
            arrow(d, x2 + 24, 166, "#78972c")
    d.rounded_rectangle((24, 221, 976, 420), radius=20, fill="#efebff", outline="#d8ceff", width=2)
    d.rounded_rectangle((42, 237, 197, 267), radius=15, fill="#6c4bff")
    center(d, (42, 237, 197, 267), "REAL SOL", font(17, True), "#ffffff")
    d.text((215, 241), "Solana mainnet · guardian approval required", font=font(17), fill="#62569b")
    d.text((43, 282), "Phantom / Solflare guardian signs System Program instructions", font=font(21, True), fill="#29254f")
    d.text((43, 311), "for a seed-derived profile account. No child private key or custom program.", font=font(18), fill="#5b577a")
    boxes = ((43, 345, 257, 399), (282, 345, 496, 399), (521, 345, 735, 399), (760, 345, 957, 399))
    labels = ("Wallet signs", "Save signed tx", "Broadcast", "Check status")
    for i, (box, label) in enumerate(zip(boxes, labels)):
        card(d, box, label, active == i + 1, i + 1)
        if i < 3:
            arrow(d, box[2] + 3, 372, "#7458e8")
    return im


def build_gif() -> None:
    frames = [gif_frame(i) for i in range(5)]
    frames[0].save(GIF, save_all=True, append_images=frames[1:], duration=[1200] * 5, loop=0, optimize=True, disposal=2)


if __name__ == "__main__":
    build_html()
    build_gif()
    print(f"Wrote {HTML.relative_to(ROOT)}, {GIF.relative_to(ROOT)} ({GIF.stat().st_size:,} bytes)")
