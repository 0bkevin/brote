# Historial de commits de Brote

Estos commits ya existen en la rama `main`. Están ordenados desde la estructura inicial hasta la landing y el branding final. Cada entrada explica el cambio y su propósito.

Para ver el historial completo en el repositorio:

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

## Documentación de entrega

Este índice se añade con `docs: index the complete implementation commit history`. El resumen visual se añade después con `docs: add an interactive product and roadmap overview`. Estos commits documentan la entrega; sus hashes se consultan con `git log` para evitar que el índice tenga que incluir su propio hash.

La publicación mantiene este historial. No se reescribieron ni agruparon los cambios en un único commit.
