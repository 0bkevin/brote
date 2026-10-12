# Brote — hackathon submission

## Project

**Name:** Brote — _Crecemos juntos_ (“We grow together”)

**Product URL:** https://brote-family-solana.brown-isle-1431.chatgpt.site

**App:** https://brote-family-solana.brown-isle-1431.chatgpt.site/app/

**Logo:** https://brote-family-solana.brown-isle-1431.chatgpt.site/logo.svg

**Project description:** Brote is a family-friendly web app for practicing money decisions together. It gives each family member an individual profile with practice balances, savings goals, activity, and optional adult review of practice purchases. Three short games teach budgeting, scam awareness, and planning for unexpected expenses. The intended audience includes young children learning with a responsible adult, adults new to crypto, and senior learners. Simple mode supports people who prefer a slower, clearer experience.

The app includes an optional Solana mainnet prototype. A connected guardian wallet (Phantom or Solflare) can create deterministic, zero-data System Program accounts for profiles, read balances through RPC, and sign SOL account creation, deposits, and withdrawals. This prototype has no deployed Anchor program, does not enforce app spending limits on chain, and is not production ready. Mainnet RPC balances and profile derivation were verified in the browser. No mainnet transaction was sent; a user-led wallet signing test remains pending. Brotes and game rewards are simulated and have no cash value.

## Tools and blockchains

- **Product:** React, TypeScript, Vite; browser-based web app.
- **Blockchain:** Solana mainnet; System Program seeded accounts and SOL transfers; `@solana/web3.js`; Phantom and Solflare signing; RPC balance reads and Solana Explorer links.
- **Not included:** deployed Anchor program, Visa/card integration, stablecoin flow, or verified transaction proof.

## Pitch and demo

- **Pitch video (2–3 minutes):** [TODO: add the actual recording URL]
- **Demo recording (up to 3 minutes):** [TODO: add the actual demo recording URL]
- **Demo walkthrough:** see [`PITCH.md`](PITCH.md).
- **Deck:** not prepared for this submission.
- **Confirmed Solana transaction proof, if available:** [TODO: add the actual Solana Explorer transaction URL only after independently confirming it; otherwise write “No confirmed transaction submitted.”]

## Team

- **[TODO: team member name]** — [TODO: short factual bio and project contribution]
- **[TODO: team member name]** — [TODO: short factual bio and project contribution]
- **Core team eligibility:** [TODO: confirm community eligibility and list at least one woman on the core team, as required by the brief]

## Submission checks

- **Judging criteria from the supplied brief:** Product 30%, Solana 25%, problem/user 25%, presentation 20%.
- [ ] Confirm the team meets community eligibility.
- [ ] Confirm at least one woman is part of the core team.
- [ ] Replace missing names and bios with accurate information.
- [ ] Publish and open the product URL without requiring private access.
- [ ] Add real pitch/demo recording links and check they open.
- [ ] Include a transaction proof link only if the transaction is confirmed on mainnet.
- [ ] Confirm final deadline and time zone against the official event page. The brief supplied for this draft says **October 12, 2026, 23:59 Brasília time**; this has not been independently verified.
