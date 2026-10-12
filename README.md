# Brote · Crecemos juntos

A web app for learning to manage money with someone you trust. A responsible person creates profiles for children, adults or seniors, assigns practice money, reviews spending, and helps them grow through goals and short games. Real SOL lives in separate guardian-controlled accounts on **Solana mainnet**.

## Run locally

Requires Node.js 22+ and npm. No secret keys or backend are needed for the prototype.

```sh
npm install
npm run dev
npm test
npm run build
```

The web interface is Spanish. The submission documents are English. This project focuses on the desktop web experience.

## What works

- Create profiles with their own practice wallet, avatar and relationship. Adult profiles ask for agreement to share activity.
- Assign fictitious Brotes, record categorized practice expenses, approve or reject requests, and set a per-purchase limit or pause.
- Create goals and move spendable Brotes into savings. Amounts are checked in integer cents; approval deducts funds once.
- Complete a shopping budget, a phishing quiz and an emergency allocation game. Earn XP, levels and badges; rewards are granted once per profile.
- Switch between family and personal demo views. Filter activity and export CSV.
- Export and restore profile backups, including stable IDs needed to rediscover the same Solana addresses.
- Connect injected Phantom or Solflare, or inspect a public address without signing. Derive profile accounts, read real balances and recent activity from mainnet RPC, and open Solana Explorer.
- Prepare guardian-signed account creation, deposits and seed-authorized withdrawals. The extension reviews the real transaction, and Brote waits for RPC confirmation. No transaction was sent during development.

Brotes have no monetary value and cannot be converted into SOL. The app never uses a simulated balance to represent real SOL.

## Solana architecture

A profile is a zero-data System Program account derived from the guardian public key and a stable profile seed with `PublicKey.createWithSeed`. The guardian signs `CreateAccountWithSeed`, funding transfers and `TransferWithSeed` withdrawals. Profiles do not store private keys. All RPC endpoints are checked against mainnet's genesis hash. No custom on-chain program is deployed.

See [SOLANA.md](SOLANA.md) for the implementation, wallet API, custody model and RPC behavior. An optional `VITE_SOLANA_RPC_URL` can point to a dedicated HTTPS mainnet RPC; the default public endpoint has a verified PublicNode fallback. A browser-visible RPC URL is public configuration; use an appropriately restricted endpoint.

## Prototype boundaries

Practice data is stored in this browser. The role selector is a demo switch, not authentication or access enforcement. Local limits apply to practice money; mainnet operations are authorized by the guardian's signature, with no delegated spending program. Profiles are not independent bank accounts.

Preserve profile IDs and the guardian address to recover the same accounts. Resetting practice downloads a backup first; restoring downloads a copy of the current data first. The app does not infer what was purchased from a Solana transfer. Practice descriptions and categories are entered by the user; on-chain history shows account balance changes.

Creation/deposit/withdrawal transaction construction and signer authority are covered by focused tests. A real wallet signature and confirmed mainnet transfer still require a user-led test. Public RPC availability can vary. This is a hackathon prototype, not a production custody service.

`npm audit` currently reports four moderate findings in the legacy web3.js dependency tree (`jayson`, `stream-json`, `uuid`). A production SDK migration/dependency review remains in the roadmap; do not force a major SDK update without adapting and retesting wallet signing.

## Project files

- `src/domain.ts` — practice ledger, rules and validation.
- `src/store.tsx` — local persistence and React API.
- `src/components/Wallets.tsx` — profile, spending and goal flows.
- `src/components/Learning.tsx` — interactive lessons.
- `src/solana.tsx` — wallet connection, mainnet reads and signing.
- `src/solana-utils.ts` — exact lamport parsing and deterministic seeds.
- `docs/ROADMAP.md` — shipped scope and next milestones.
- `docs/PITCH.md` — timed pitch and demo shot plan.
- `docs/SUBMISSION.md` — competition submission copy and remaining materials.
- `docs/BRAND.md` — naming options and visual direction.
- `docs/COMMITS.md` — the actual commit history and purpose of each change.

Reference: [Piggy Wallet](https://www.piggywallet.app/), for the family wallet and learning concept. Brote's design and code are original.
