# Brote roadmap

Brote is a family-friendly web app for learners from their first money decisions through adulthood and later life. The UI offers both a vivid game-inspired experience and a calmer simple mode. Brote is a web app for learning money habits together. Validation should include children with a responsible adult, adults new to crypto, and senior learners who opt in. Adults and seniors should be able to use the same tools on their own terms; the interface should never treat age as a lack of competence.

## Shipped in the prototype

- Separate game-inspired landing page with working links to the demo.
- User-selected simple mode with larger controls, less dense information and a step-by-step quiz with optional spoken prompts.
- Profile backup/restore preserving stable Solana IDs.
- Browser-based family dashboard with individual profiles for children, adults, and seniors.
- Local practice ledger with balances, goals, activity, spending limits, and guardian review of pending practice purchases.
- Three learning games: needs vs. wants, spotting suspicious messages, and planning for unexpected expenses. Completion rewards practice points once per mission.
- Separate Solana mainnet panel. A connected Phantom or Solflare guardian can derive zero-data System Program accounts for profiles, inspect RPC balances, and sign account creation, SOL deposits, and withdrawals. The app provides Explorer links.
- No Anchor program is deployed. The prototype uses deterministic seeded System Program accounts controlled through the guardian signer; this is not contract-enforced delegated spending.

## Next: hackathon validation

1. Put the web demo at a stable, publicly accessible URL and test it in a clean browser.
2. Validate the core story with the intended first cohort: can a teen practice a decision and can the adult understand the review step? Invite adult and senior feedback without assuming they need supervision.
3. Rehearse the demo with a connected test wallet and a clear separation between simulated Brotes and real SOL. Verify any transaction on mainnet before showing or claiming it; never imply a transaction was sent when it was not.
4. Gather permission-based feedback and note usability issues. Do not present a small demo as evidence of broad impact.

## Production work, before real family use

- Add authentication, explicit adult/guardian consent and role management, privacy controls, data minimization, and a clear process for families to export or delete data.
- Design secure multi-device profile metadata and recovery. The current profile IDs and seeded accounts are not a production identity or recovery system.
- Review the wallet and account security model. Decide whether to retain externally controlled accounts or use embedded custody, with clear disclosures and recovery safeguards.
- Enforce delegated limits and approvals in a reviewed on-chain program or another defensible transaction policy. Current guardian-controlled System Program accounts do not enforce app spending limits on chain.
- Operate reliable RPC access, monitoring, failure handling, transaction reconciliation, and support procedures.
- Choose a stable-token rail only after requirements and risks are reviewed: compare the Solana SPL Token and Token-2022 programs, token and issuer support, fees, custody, and jurisdictional requirements. The current on-chain flow is SOL, not USDC.
- Conduct independent security, privacy, accessibility, and legal reviews before handling family data or meaningful funds.

## Later, optional

Explore payment-card or Visa-linked experiences only after the underlying custody, account controls, compliance, and support model are ready. A card is not part of the current prototype or a promised roadmap date.
