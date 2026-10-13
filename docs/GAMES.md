# Interactive learning games

Open [Learn through play](https://brote-three.vercel.app/app/?view=learn). The two illustrated games use original Brote SVG worlds and the profile's animal companion. Both have Spanish, English, and Brazilian Portuguese copy, no time limit, and compact touch controls. Simple mode and reduced-motion preferences remove decorative movement.

| Game | What the player does | What it teaches |
|---|---|---|
| Market adventure | Move with arrow keys/WASD or tap stalls; compare prices, buy, return items, and check out across three rounds. | Cover the shopping list, distinguish needs from wants, and stay within a budget. |
| Goal Island | Earn once per day, cover essentials, reserve coins, build a bridge, and repair a day-three storm across four days. | Plan daily spending, protect savings, and keep an emergency reserve separate. |

## Rules and rewards

The pure TypeScript engines handle transitions without reading wallet state. Market purchases cannot exceed the round budget or duplicate a product; returns refund the exact price. Checkout requires the complete list and the correct position. Island work and repair cannot be claimed twice; optional spending protects daily essentials and the remaining goal budget. Game coins are fictional and never become SOL.

Winning makes an achievement available to save. The existing practice ledger awards **45 XP + 12 Brotes** for `market-adventure` and **50 XP + 16 Brotes** for `goal-island`, once per profile. Replays are playable and do not mint another reward. Closing or restarting resets an unfinished run; saved achievements persist. Paused profiles and read-only tabs cannot claim rewards. Legacy mission records remain in the profile history.

The digital-safety questionnaire remains an additional activity below the two games.

## Verification

- Eleven engine tests cover winning routes, boundaries, duplicate actions, budget guards, returns, day progression, storm repair, restart, and visual timer disposal. `npm test` includes these alongside the existing suite.
- Browser playthroughs completed all three market rounds and all four island days. A full market replay kept the saved XP unchanged. An unaffordable purchase kept its balance unchanged; returning an expensive item restored its exact price.
- Mobile checks at 320 and 390 CSS pixels verified reachable start/purchase/claim actions, a scrolling game body with a fixed dialog header, no horizontal overflow, and 34px island action buttons. English market and Portuguese island screens were inspected. Simple mode disabled the island's animation. A second tab showed the read-only notice and disabled game actions.
- Independent reviews found clipping/read-only copy issues; those were corrected and reviewed again. No unresolved engine, reward, reset, or timer findings remained in the final source review.

The development test wallet is excluded from production. The production app separately offers mainnet and testnet; games do not require a crypto wallet.
