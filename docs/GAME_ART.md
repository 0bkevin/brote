# Brote game art

Original, inline-vector scenes and reward art for the real games. Scenes contain no text or UI labels; game controls, rewards, and any counters belong in the interface layer.

## Assets

| File | ViewBox | Use |
| --- | --- | --- |
| `public/games/market-scene.svg` | `0 0 1200 760` (1.58:1) | Colorful neighborhood market with stalls, a central walkway, a cart, planters, and a market hall. |
| `public/games/island-scene.svg` | `0 0 1200 820` (1.46:1) | Floating island with a winding path, shop, home, bank, bridge, trees, water, and flowers. |
| `public/games/coin.svg` | `0 0 128 128` | Earned coin collectible; no numeric value. |
| `public/games/crate.svg` | `0 0 128 128` | Supply crate collectible. |
| `public/games/bridge.svg` | `0 0 160 128` | Bridge upgrade collectible. |
| `public/games/earned-badge.svg` | `0 0 128 128` | Generic earned badge. |

Keep scene SVGs at their natural aspect ratio (`width: 100%; height: auto`) so buildings and paths are not cropped. The island art reserves the broad center and lower center for route markers and small controls; building hit areas can sit on the visible structures.

## Suggested island interaction anchors

Coordinates are percentages of the scene viewBox and refer to the centers of the illustrated structures. Keep overlay controls small enough to leave the artwork visible.

| Structure | Center | Approximate overlay footprint |
| --- | --- | --- |
| Home | 42%, 48% | 12% × 18% |
| Shop | 28%, 55% | 14% × 17% |
| Bank | 70%, 55% | 16% × 19% |
| Small market | 51%, 37% | 11% × 15% |
| Bridge | 86%, 67% | 15% × 13% |

For the market scene, natural object anchors are the left stall at about `18%, 56%`, the right stall at `82%, 56%`, the cart at `13%, 82%`, and the hall at `50%, 34%`. Keep shared controls and labels outside the SVG so localization and responsive layout remain straightforward.
