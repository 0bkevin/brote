# Brote verification

Verified on October 12, 2026 in Chrome, using generated demo data. No wallet was connected and no mainnet transaction was submitted.

## Automated checks

- TypeScript and the Vite production build pass.
- `npm test`: 14 tests pass. They cover exact practice amounts, non-negative balances, approval replay protection, goal savings, once-only rewards, pause guards, persisted-state validation, deterministic seeds, lamport precision and guardian signer keys for `TransferWithSeed`.
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
