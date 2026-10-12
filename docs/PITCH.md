# Brote pitch and demo

## 2–3 minute pitch script

Families often want teenagers to learn how to budget, save, and make everyday spending choices, but a conversation or allowance alone gives them few safe chances to practice. Adults may want to stay involved without taking away a young person's agency. Brote starts with supervised teenagers and an adult companion who chooses to participate. The same tools can also support adults and seniors on their own terms.

Brote is a family-friendly web app where each person gets a profile, a practice balance, goals, and a clear activity history. The adult can review a practice purchase when review is enabled. Learning happens through short games: build a needs-first basket within a budget, spot suspicious messages, and plan for an unexpected expense. Completing a mission earns practice Brotes once. These rewards are simulated points, not money.

We also built an optional Solana mainnet flow. A guardian connects Phantom or Solflare; Brote derives a zero-data System Program account for each profile, reads balances from RPC, and prepares account creation, SOL deposit, or withdrawal transactions for the guardian to sign. Transaction links open in Solana Explorer. This is a prototype account model: there is no deployed Anchor program, and the app's practice spending limits are not enforced on chain. We have not yet verified a real mainnet transaction for this submission, so we will show only what we can confirm live.

Our demo will show the difference between learning with simulated Brotes and viewing a real Solana balance, then walk through the guardian-signed flow if the wallet and network are ready. Our next step is to validate the experience with supervised teenagers and opted-in adults, then address consent, privacy, recovery, and enforceable controls before production.

Brote means “sprout” in Spanish: Crecemos juntos — we grow together.

## Demo shot plan (up to 3 minutes)

- **0:00–0:20 — Frame the problem.** Open the family dashboard. Say this is a web prototype for supervised teens and an opted-in adult companion; profiles for adults and seniors are also supported.
- **0:20–0:45 — Family view.** Point out separate profiles and practice balances. State plainly: “Brotes are simulated and have no cash value.”
- **0:45–1:20 — Learning game.** Open the needs-and-wants basket or scam-spotting mission. Complete it if time permits; show its XP and one-time practice reward.
- **1:20–1:45 — Review.** Open activity and approve or reject a pending practice purchase. Explain that review changes only the local practice ledger.
- **1:45–2:40 — Solana.** Switch to Solana, connect the demo guardian wallet, refresh a profile balance, and open its account on Explorer. If and only if a real transaction has been sent and confirmed, show its transaction signature and Explorer receipt; explain who signed and what moved. Otherwise show the read-only balance/derived account view and say no transaction was sent. Do not submit an unverified transfer during the pitch.
- **2:40–3:00 — Close.** Reiterate that real SOL operations require guardian signing and that the prototype has no deployed contract or on-chain spending limits. End with the planned user validation.

## Recording checklist

- Replace the scripted demo with an actual 2–3 minute recording; add its link to `SUBMISSION.md`.
- If presenting a transaction, verify its signature and status on Solana Explorer first. Attach the actual confirmed proof link; never substitute a planned or failed transaction.
- Use a clean browser profile, hide secrets and unrelated personal data, and keep a read-only fallback ready if the wallet or RPC is unavailable.
