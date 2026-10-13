# Brote verification

Verified on October 12, 2026 in Chrome, using generated demo data. No wallet was connected and no mainnet transaction was submitted.

## Automated checks

- TypeScript and the Vite production build pass.
- `npm test`: 53 tests pass. They cover practice invariants, exact decimal cents, review dates, final-cent goals, CSV literals, durable storage failures and leases, validated backup/journal recovery, switched signer sessions, byte-identical retry, monotonic outcomes, RPC fallback/partial reads, deterministic seeds and guardian signer keys for `TransferWithSeed`.
- `git diff --check` passes.
- Static `/` and `/app/` entries return HTTP 200; query links open the intended learning or Solana view.

## Browser flows

- Created a fresh profile, assigned 100 fictitious Brotes, requested a 12-Brote purchase and approved it. Balance became 88; the pending request did not deduct funds beforehand.
- Created a 50-Brote goal and saved 20. Spendable balance became 68 and goal progress became 40%.
- Completed all three games for a fresh learner. Rewards totalled 36 Brotes and 105 XP, and completion badges persisted.
- Completed the scam quiz in simple mode. It showed one question at a time and disabled the next action until an answer was chosen.
- Exported a backup, restored four profiles and their practice history, then reset the generated test state to the original three examples. Reset and restore saved a copy before replacing data.
- Inspected the landing hero, audience section, game previews and app dashboard. Fixed the white-on-white landing CTA found in a saturated section.
- Checked the final production build's browser console: no errors or warnings in the tested flow.

## Mainnet read verification

The public System Program address `11111111111111111111111111111111` was used only as a read-only test address, not as a real family guardian. Its balance was read from mainnet, and the profile addresses were derived and queried. The official RPC returned HTTP 403; the app used PublicNode after verifying the same mainnet genesis hash and displayed that fallback. The test ran in both development and the production build.

## Remaining verification

- A user-led extension connection and actual signature for creation/deposit/withdrawal remain untested. The browser has no Phantom/Solflare extension. Transaction construction tests are not a substitute for a confirmed mainnet transfer.
- The optional spoken question control is implemented; audio output was not assessed during this browser run.
- Usability sessions with young children, adult beginners and senior learners have not been conducted. No user-research results or adoption statistics are claimed.
- Authentication, secure shared persistence, adult consent verification and program-enforced delegated limits are future work. Practice role switching remains a local demo.
- Four moderate npm audit findings remain in the legacy web3.js dependency tree; see README and the production roadmap.

## Captures

- [`assets/landing.jpg`](assets/landing.jpg)
- [`assets/dashboard.jpg`](assets/dashboard.jpg)
- [`assets/solana.jpg`](assets/solana.jpg)

## Independent audits and current browser regression pass

See [AUDIT.md](AUDIT.md) for per-function coverage, findings and corrections. Independent GPT-6 and Luna agents reviewed ledger rules, persistence/recovery, signing, each of the three games, profile/goal flows, activity/export, mainnet reads, navigation/accessibility and the mobile menu. Follow-up rounds reviewed fixes.

- Created an adult profile, checked consent, changed its name and verified that creation was blocked until consent was checked again.
- Opened two Chrome tabs on the same local origin. The second was explicitly read-only, received the first tab's saved balance, rejected its own profile creation, and acquired editing access when the writer navigated to the landing. The landing does not hold a data lease.
- Created a 2-Brote goal, saved 1.99, verified the final saving action remained enabled, then saved 0.01 and verified exact completion.
- Checked an empty shopping basket, an incorrect quiz response and the initial emergency allocation. Completed each valid game for the generated profile; 36 practice Brotes and 105 XP persisted after reload.
- Requested an 8-Brote purchase while the generated profile held 59. The request left the balance unchanged. Approval deducted once to 51; the guardian controls then disappeared for that completed request.
- Downloaded a filtered CSV and parsed its actual file: seven movements belonging only to the generated profile, with activity and request dates in separate columns. The browser's download-event notification timed out, but the downloaded file was present and validated.
- Exported a four-profile, 15-movement backup; verified its JSON included the signed-operation field. Added one Brote, restored the backup through the file chooser and recovered the expected 51 balance, complete goal and 105 XP. Real signed-operation migration was exercised with mock signed fixtures in tests.
- Queried the public System Program address in the latest production build. PublicNode returned 1 lamport for that watched address; the derived test profile had no created account. This was a read-only mainnet check with no extension or signature.
- Dialog accessibility showed only the modal while open. Tab/Shift+Tab wrapped; Escape closed it and returned focus. Transitioning from the mobile sheet to help also returned focus correctly.
- Final inspected browser console had no errors or warnings.

## Responsive visual checks

The web app and landing were inspected in Chrome viewport emulation. These are browser emulations, not physical-device testing.

| Width | Checks | Result |
|---|---|---|
| 320px | Landing, lateral menu, profile form, Solana view, emergency controls | No horizontal overflow; readable fields; six budget stepper buttons measured 34px. |
| 375px | Wallet cards, sheet actions, role/mode navigation, simple quiz | Cards have 0px border and no top stripe; controls remain usable and wrapped options can grow. |
| 390px | Dashboard, full-height menu, menu sizes | No horizontal overflow; every inspected sheet action/select measured 34px. |
| 768px | Full-height right sheet and background | Sheet is 400px wide, starts at x=368, reaches the full 1024px viewport height. |
| 1280px | Desktop chrome, cards and resize transition | Topbar measures 62px; mobile sheet closes and mobile header is hidden. |

Mobile has one 48px header and a menu that slides in from the right. Single-line controls use 34px; multi-line content retains flexible height. Text input size remains 16px.

Latest captures:

- [Mobile wallets](assets/mobile-wallets.png)
- [Full-height lateral menu](assets/mobile-menu.png)
- [Compact desktop](assets/desktop-compact.png)

## Vercel release verification — October 12, 2026

The public deployment at https://brote-three.vercel.app was checked after the GitHub repository was connected to the Vercel project.

- `/`, `/app`, `/app/`, `/architecture`, `/architecture/`, `logo.svg`, and `favicon.svg` returned HTTP 200 with the expected content types.
- The mobile landing CTA opened the app. At 390 × 844, the app header measured 48 px, the side sheet filled the viewport, and its buttons and selects measured 34 px. The inspected pages had no horizontal overflow.
- The side sheet opened learning and Solana mode correctly. The Spanish interface remained unchanged.
- Read-only observation of the public System Program address returned one lamport through the genesis-verified PublicNode fallback; the derived example profile had no existing account. No extension was connected and no money was moved.
- GitHub rendered the English README, MIT license, architecture SVG, and animated GIF. The validation workflow passed all 53 tests and the production build.

This verifies deployment routing and browser behavior, not a funded mainnet signing session or physical-device coverage.

## Form alignment and full responsive review

The latest [responsive review](RESPONSIVE_QA.md) extends coverage to ten presets from 320 × 780 through 1920 × 1080. It records matched Solana input/action heights, compact savings and amount presets, readable approval rows, medium-width mission cards, game dialog scrolling, short-window navigation, and narrow landing/simple-mode layouts. Independent final reviews found no remaining actionable regressions. All 53 tests and the production build pass; the report includes screenshots and verification limits.

## Three-language and Solana follow-up

The final local suite passes **73 tests** and `npm run build`. See [LOCALIZATION.md](LOCALIZATION.md) for the 120 locale/viewport layout checks, visual captures, translated mission completion, cross-tab form preservation, and dynamic error checks. Solana follow-up findings and the read-only mainnet fee/rent quote are recorded in [AUDIT.md](AUDIT.md). No funded transaction was signed or broadcast. GitHub CI and the production deployment validate the published revision separately.

## Live testnet completion

The user subsequently authorized a disposable testnet wallet and faucet funding. Confirmed on-chain evidence and browser results are recorded in [TESTNET_QA.md](TESTNET_QA.md). The final regression suite passes 87 tests; both selected-cluster builds compile. Test funds have no monetary value.

## Interactive games and production network selection — 2026-10-13

Both mainnet and testnet are publicly selectable through a full navigation; strict URL parsing, per-network RPC overrides, genesis checks, storage keys, backups, and operation journals prevent network mixing. The production bundle excludes the local QA wallet.

Two games replace the shopping/allocation exercises: Market adventure (three walk/shop/refund rounds) and Goal Island (four-day resource and emergency planning). The game engines use fictional currency; the practice ledger saves each achievement once per profile and permits reward-free replays. The digital safety questionnaire remains an extra activity.

The local regression suite passed **100 tests**, including 11 game-engine tests, and the production build passed. Browser playthroughs completed both games, tested refunds and insufficient funds, verified a full market replay with unchanged XP, and checked the island storm gate. Lucas ended with 125 XP and 118 practice Brotes after both new rewards; ordinary game actions did not affect wallet money. Read-only controls were disabled with an explanation; simple mode disabled animation.

Independent reviews found clipped game content and misleading/missing read-only copy. The game body now scrolls below its fixed header, and both games explain the tab's read-only state. Root visual checks confirmed reachable controls at 320 and 390px, 34px island action buttons, no horizontal overflow, English market copy, and Portuguese island copy. No unresolved reward, reset, or timer findings remained in the final source review.

See [game rules](GAMES.md), [machine-readable QA evidence](evidence/games-qa.json), and the new game screenshots in `docs/assets`. The motion-graphics video was paused at the user's request; its drafts are kept outside the repository.
