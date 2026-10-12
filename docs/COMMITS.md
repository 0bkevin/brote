# Brote commit history

These commits already exist on the `main` branch. They are ordered from the initial project setup through the audits, fixes, and compact responsive web interface. Each entry explains the change and its purpose.

To inspect the complete repository history:

```sh
git log --reverse --oneline
git show <hash>
```

## 1. `f391f28` — chore: bootstrap the React and TypeScript web workspace

Set up Vite, reproducible npm dependencies, a runnable entry point, and build/test scripts for the hackathon app.

## 2. `92e9645` — refactor: define wallet contracts and separate practice from SOL

Establish profile, goal, transaction and store types shared by parallel modules. Format fictitious Brotes separately from real SOL.

## 3. `bbf730c` — feat: enforce practice balances, approvals and savings rules

Implement immutable integer-cent balances, once-only expense approval, savings goals, paused wallets and validated local profiles. Reject crypto ledger mutations.

## 4. `7cc76c8` — test: protect practice money invariants and saved-state validation

Cover non-negative funds, exact amounts, approval replay protection, savings, unique rewards, pause guards and corrupted persisted data.

## 5. `3dbc590` — feat: persist the practice journey in the browser

Expose a React store backed by validated localStorage, with safe in-memory fallback and synchronous state mutation errors.

## 6. `bf2181f` — feat: introduce the illustrated family identity

Add original SVG profile companions, a leaf logo and a friendly growing plant illustration without third-party game assets.

## 7. `a032135` — style: establish the family dashboard design system

Create the desktop web shell, calm palette, readable cards, wallet layouts and reduced-motion/accessibility styling.

## 8. `15bca20` — feat: add keyboard-accessible dialogs

Trap focus, restore focus on close, handle Escape and keep dialog content scrollable while locking the background.

## 9. `d07a1a6` — feat: create profiles and manage supervised practice wallets

Add profiles with adult sharing agreement, fake-money allocation, categorized expenses, savings goals and guardian spending rules.

## 10. `1a0d93b` — feat: turn financial learning into three playable adventures

Introduce shopping, phishing and emergency-budget games with feedback, XP, badges and one-time practice rewards.

## 11. `c4307a4` — feat: derive stable Solana profile seeds and exact lamports

Keep derivation within the 32-byte seed limit and parse SOL amounts without losing lamport precision. Encode transaction signatures for recovery links.

## 12. `8eff414` — feat: connect mainnet guardian accounts and sign supervised SOL transfers

Verify the cluster fingerprint, derive zero-data System accounts, read RPC balances/history and prepare guardian-signed account creation, deposits and TransferWithSeed withdrawals.

## 13. `a8865d0` — test: verify deterministic accounts and guardian withdrawal authority

Check seed stability, precise lamports, base signer instruction keys and signature encoding without sending funds.

## 14. `1c88b7b` — feat: expose verified Solana balances and transaction receipts

Add wallet connection and read-only exploration, account actions, honest unknown/error states and Explorer links for confirmed or uncertain transactions.

## 15. `ebdcc75` — feat: preserve profile identities through backup and restore

Export stable profile IDs and the guardian public address. Validate imports and download the current journey before replacing local data.

## 16. `654276e` — feat: connect the family dashboard, learner spaces and activity review

Integrate modules, role demo views, derived weekly summaries, guardian review, CSV export, preferences and profile recovery.

## 17. `34ad8b7` — docs: explain the Solana custody model and integration limits

Document seeded System accounts, guardian-only authorization, RPC verification, error behavior and the absence of private-key storage or a custom program.

## 18. `f03ee5a` — docs: define the brand and roadmap beyond the prototype

Capture naming alternatives and distinguish shipped scope, hackathon validation, production identity/consent/recovery and future Visa exploration.

## 19. `d94a69c` — docs: prepare a timed pitch and honest hackathon submission

Map the product to judging criteria and plan a three-minute demo, with explicit placeholders for team bios, recordings and actual transaction proof.

## 20. `380168a` — docs: document setup, verified scope and static Site hosting

Explain how to run/test the app, prototype boundaries and dependency findings. Retain the registered Site ID and declare dist as static output.

## 21. `17863fd` — build: support static app routes and browser-compatible Solana assets

Add a real /app entry for static hosting, resolve browser Buffer imports and split Solana assets into cacheable chunks.

## 22. `bbc89df` — style: give Brote a vivid game-inspired visual identity

Replace the sage palette with purple, blue, lime and coral. Add a dark sidebar, bold rounded type, stronger actions and a quieter simple-mode presentation.

## 23. `11edea2` — feat: refresh the Brote mascot and collectible profile companions

Introduce original cel-shaded SVG artwork, vivid animal avatars, a modern sprout mark, standalone logo and favicon. Use unique SVG gradient IDs.

## 24. `5b69fd6` — feat: add step-by-step learning and optional spoken questions

Make missions more vivid while preserving rewards. Simple mode shows one quiz question at a time, prevents incomplete submissions and offers explicit spoken prompts.

## 25. `1870bb9` — feat: introduce a compelling game-inspired Brote landing page

Explain the shared learning journey with original illustrations, three steps, playable mission teasers, inclusive messaging and working app links.

## 26. `63f92cb` — feat: connect the landing, app routes and persistent simple mode

Route the product landing and web app separately. Support direct learning/Solana links, save the simple-mode preference and show the active demo profile.

## 27. `11e10ca` — fix: explain mainnet RPC fallback without exposing technical payloads

Keep the verified PublicNode fallback visible in plain language while avoiding raw JSON identifiers in the user flow.

## 28. `a408799` — docs: align the product story with the final brand and broad audience

Retain Brote, document the energetic identity and simple mode, and update the roadmap for young children, adult beginners and senior learners.

## 29. `18ef9ad` — fix: preserve landing CTA contrast on vivid sections

Keep the demo link and arrow dark on light buttons inside purple sections, correcting the issue observed during visual QA.

## 30. `8b58c60` — docs: capture browser verification and submission links

Record automated checks, tested practice flows, real mainnet reads, screenshots and honest remaining signing/usability limits. Include the product and logo targets for the submission.

## 31. `e499590` — docs: index the complete implementation commit history

Document each actual implementation milestone with its hash, purpose, and commands for inspecting the changes.

## 32. `3aafb4c` — docs: add an interactive product and roadmap overview

Add an interactive product summary, screenshots, roadmap, and history to review the submission.

## 33. `46d6a3e` — fix(learning): stop quiz narration when its context closes

Stop quiz narration when it closes, the question changes, or the learner profile changes. Detach callbacks and verify cancellation with a stub.

## 34. `5236f67` — fix(wallets): bind consent to identity and complete goals at their exact target

Require consent again after an identity edit, and allow saving the final cent toward a goal; test 1.99 of 2 before completion.

## 35. `91df8fd` — fix(ledger): preserve exact cents and record purchase review dates

Convert decimal amounts to exact cents, validate positive ledger entries, and record when each purchase is resolved.

## 36. `59df3f1` — fix(a11y): isolate dialogs from background navigation

Isolate the background while dialogs are open, limit focus to visible enabled controls, and restore focus on close. Verify Tab, Shift+Tab, and Escape in Chrome.

## 37. `d0699ae` — fix(solana): journal signed operations and retry identical transactions

Persist signatures and bytes before sending, block uncertain outcomes, and retry the identical transaction. Validate identity, signatures, and terminal states while retaining pending records.

## 38. `f3edd5a` — fix(storage): serialize durable writes and preserve recovery identities

Coordinate a single writer across tabs, persist before confirming, and retain damaged records. Backups preserve identities, guardians, and signed operations.

## 39. `92d1515` — fix(solana): guard wallet sessions, verified reads and operation handoff

Protect wallet sessions and profiles during signing, synchronize the journal when switching tabs, and retain known reads when using the fallback RPC.

## 40. `823c7a1` — fix(export): escape spreadsheet formulas behind leading whitespace

Neutralize CSV formulas even after spaces, tabs, or line breaks. Check quoting, Unicode, and exported files.

## 41. `73ad4fc` — fix(recovery): carry pending signatures and cancel stale restores

Export relevant signatures and validate derivation during restore. Stop cancelled or stale restores and preserve recoverable originals.

## 42. `47cf807` — fix(app): expose persistence state and clarify guardian actions

Show persistence status, limit approval prompts to guardians, and use resolution dates in activity. Keep the landing page from holding the editing lock.

## 43. `a01b0b3` — style(web): remove decorative card borders and compact the responsive layout

Remove card outlines and stripes, compact the desktop bar to 62 px, and adapt forms, games, the landing page, and Solana views for narrow screens.

## 44. `234ee32` — feat(navigation): move mobile controls into a full-height side sheet

Replace mobile bars with a header and a full-height side sheet that enters from the right. Reuse desktop actions and preserve focus handling.

## 45. `27e36eb` — style(mobile): size compact controls and icons around 34px

Reduce the mobile header to 48 px and controls to about 34 px. Keep text legible and allow multi-line content to grow vertically.

## 46. `030244a` — docs(quality): record independent audits and responsive browser evidence

Record the function-by-function audit, 53 tests, and browser flows. Include screenshots and explicit limits around real signing and physical-device checks.

## 47. `cfdd2ef` — docs: extend the complete change history after audits and mobile refinements

Extend this index through the audit and responsive mobile refinements, and update the interactive product overview.

## 48. `3f0e6b8` — chore(license): publish Brote under the MIT license

Add the MIT license and matching package metadata, including the public repository URL.

## 49. `97a1f7e` — docs: present the repository and current architecture in English

Translate the remaining repository presentation, preserve Spanish interface labels, and replace obsolete component ownership instructions with the current architecture.

## 50. `5185f6d` — ci: validate the ledger, Solana safeguards, and production build

Run the regression tests and production build in GitHub Actions using Node.js 22 and read-only repository permissions.

## 51. `1a5911a` — build(vercel): configure static deployment and direct app routes

Configure the Vite build output, deterministic npm installation, direct app routes, and ignored local Vercel settings.

## 52. `1ec64ec` — docs(architecture): illustrate practice storage and guardian signing flows

Add a static SVG, responsive standalone HTML diagram, six-second GIF, and reproducible generator for the separate practice and real-SOL paths.

## 53. `0c92d7e` — build: publish the architecture page and exclude local deployment credentials

Publish the standalone architecture page with both URL forms and exclude local credentials and generated files from deployment uploads.

## 54. `89b2455` — docs(readme): explain Brote and its Solana architecture concisely

Replace the long introduction with a concise English README covering the product, architecture, mainnet signing, local setup, and prototype limits.

## 55. `bfdcd5f` — fix(docs): give the architecture SVG readable intrinsic dimensions

Set explicit SVG dimensions so GitHub displays the architecture at a legible width; regenerate the standalone HTML.

## 56. `6e84d41` — docs(deployment): record the live release and complete publication history

Record the public GitHub repository, Vercel deployment, live route and responsive checks, and all publication commits.

## 57. `5f75f79` — fix(readme): retain legible diagram sizing in GitHub previews

Declare the diagram's display width in the README so cached SVG intrinsic dimensions cannot shrink the architecture preview.

## 58. `3f10bae` — fix(solana): align form inputs with wallet action buttons

Remove label-wrapper spacing and use shared control heights: 44px on desktop, 48px in simple mode, and 34px on mobile.

## 59. `5917158` — fix(ui): keep responsive actions compact and readable

Align savings fields, keep amount presets on one line, preserve narrow approval text, and make short sidebars reachable. Prevent simple-mode dashboard overflow at 320px.

## 60. `6b328cc` — fix(learning): adapt mission cards and dialog scroll layouts

Use two mission columns at medium desktop widths, wrap footer actions, preserve budget amounts, and keep game headings outside the scrolling body. Align mobile allocation icons and labels.

## 61. `6b1052d` — style(landing): soften cards and compact mobile actions

Remove hard card outlines, soften shadows, contain narrow game cards, and use 34px mobile calls to action with a shorter header.

## 62. `e37af6b` — docs(quality): record responsive alignment checks and evidence

Record the ten viewport presets, verified form heights, independent review results, and screenshot evidence. Extend the complete commit index and product overview.

## 63. `3496833` — fix(dashboard): enlarge the weekly chart and clarify its scale

Let the weekly chart fill its card, use proportional responsive bars, enlarge labels and the legend, and align guide lines to the plot. Keep zero values invisible and preserve completed-transaction filtering.

## 64. `94bf26a` — docs(quality): document weekly chart readability checks

Record the chart sizing correction, ten responsive presets, rendered typography, zero-value checks, and desktop/mobile captures. Extend this index and the product overview.

## 65. `8066e03` — fix(docs): capture the enlarged weekly chart accurately

Replace the mistaken hero capture with the actual enlarged weekly chart, using document coordinates for the screenshot crop.

## 66. `411b7d2` — feat(i18n): add persistent Spanish, English, and Portuguese catalogs

Add reactive language selection, cross-tab synchronization, document metadata, precise locale formatting, dynamic templates, and translation regression tests.

## 67. `6bd3f78` — feat(landing): localize every section and add a compact language selector

Translate the complete landing experience and keep its language selector and mobile demo action compact.

## 68. `26e1d1a` — feat(wallets): translate profile, spending, savings, and recovery flows

Localize wallet creation, consent, amounts, rules, savings, backup and restore while preserving profile identities and open form values.

## 69. `ee3290a` — feat(app): localize dashboards, activity, settings, and mobile navigation

Translate the shared shell, side menu, summaries, activity filters and CSV display descriptions; keep existing notifications reactive to language changes.

## 70. `6a9702c` — feat(learning): translate missions, feedback, badges, and read-aloud prompts

Localize all three games, feedback, rewards, badges and narration using stable mission and answer IDs.

## 71. `6413b55` — feat(solana): localize account controls, receipts, and exact SOL displays

Translate the account panel, validation, status and receipts; format SOL precisely with locale separators and preserve public addresses.

## 72. `6dcff37` — fix(solana): parse decimal commas and reject rent-invalid withdrawals

Accept a single decimal comma or point without losing lamports; reject mixed separators and profile withdrawals leaving an invalid rent balance.

## 73. `1dc689c` — fix(solana): recheck final fees, rent states, and imported signatures

Quote the final signing message, recheck guardian funds and rent transitions, preserve session/message identity, and reconcile imported terminal claims before accepting them.

## 74. `c1264a2` — docs(quality): record localization coverage and mainnet integration safeguards

Document 120 responsive locale checks, screenshot evidence, the 73-test suite, exact fee/rent guards, and the limits of read-only mainnet verification.

## 75. docs(history): index localization and Solana verification commits

Extend the complete functional commit index and product overview through this release. Retrieve this index update with `git log --oneline --grep="index localization"`.

## Updating this index

The history retains the individual commits and has not been rewritten as a single commit. To keep this index current, append each new commit with its hash, subject, and a concise summary.
