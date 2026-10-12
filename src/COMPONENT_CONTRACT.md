# Brote component contract

The interface is Spanish; repository documentation is English. Practice Brotes are fictional and remain separate from real SOL on Solana mainnet. The prototype has no backend or custom deployed Solana program.

## Entry points and providers

`main.tsx` renders `Landing` at `/` and wraps `App` in `StoreProvider` and `SolanaProvider` at `/app` or `/app/`. The landing page does not hold the storage writer lease. Query parameters can open learning or Solana mode directly.

`types.ts` defines profiles, goals, practice transactions, and `StoreAPI`. `useStore()` exposes validated state, persistence status, and synchronous mutations. Success means the change was saved. A Web Locks lease keeps secondary tabs read-only; corrupt records are retained until explicit recovery. The compatibility field `cryptoBalance` is unused and must never be displayed as a real balance.

`useSolana()` supplies injected wallet connection, read-only observation, verified RPC state, derived profile accounts, signed operations, and recovery methods. Its interface and custody rules are documented in [SOLANA.md](../SOLANA.md). All real writes require a durable profile, an active guardian signing session, and no unresolved signed operation.

## Shared components

- `Learning`: `{ wallet, store, notify }`. Shopping, phishing, and emergency missions grant practice rewards and XP once per profile. Optional narration starts only on explicit action and stops when its context closes.
- `SolanaPanel`: `{ wallets, selectedWalletId?, notify }`. Reads mainnet accounts and activity; prepares guardian-reviewed creation, deposits, and withdrawals. Unknown balances remain unknown.
- `Avatar`: `{ kind, color?, size? }`. Original SVG animal companions use unique gradient IDs.
- `Modal`: accessible dialogs and side-sheet presentation through a body portal. Background content is inert, focus stays within visible enabled controls, Escape closes, and focus returns to the opener.
- `MobileNav`: shared navigation handlers in a full-height right-side sheet. Mobile controls are approximately 34 px; wrapped text may grow for readability.

## UI conventions

Vivid purple, blue, lime, and coral accents pair with borderless cards and subtle depth. Desktop navigation is compact; mobile uses a 48 px header. Simple mode emphasizes readable instructions and fewer distractions. Real transaction status must describe verified RPC evidence; local view switches, consent prompts, and practice limits do not provide production authorization or on-chain enforcement.
