# Brote

**Learn money skills together. Start with practice. Explore Solana with someone you trust.**

Brote is a responsive web app where a guardian creates profiles for children, adults, or seniors, reviews practice spending, and helps them learn through savings goals and short games. The interface is Spanish; repository documentation is English.

## Try it

[Live website](https://brote-three.vercel.app) · [Open the app](https://brote-three.vercel.app/app/) · [Architecture diagram](https://brote-three.vercel.app/architecture/)

Practice mode works without a wallet: create a profile, assign fictional **Brotes**, complete a mission, and review a purchase request. Solana mode supports Phantom, Solflare, and read-only public addresses.

## Architecture

<img src="docs/assets/architecture.svg" width="1100" alt="Brote architecture: browser-local practice and guardian-authorized Solana accounts">

- **React + TypeScript + Vite** serve the landing page and app as static files. No backend is required for this prototype.
- **Practice:** an immutable ledger handles balances, goals, approvals, and once-only XP rewards. Browser storage persists the state; Web Locks coordinate one writing tab. CSV exports and JSON backups support review and recovery.
- **Real SOL:** `@solana/web3.js` derives a separate zero-data System Program account for each profile using `PublicKey.createWithSeed(guardian, profileSeed, SystemProgram.programId)`. The guardian's injected wallet signs account creation, deposits, and `TransferWithSeed` withdrawals. Brote stores no child private keys and deploys no custom program.

![Signing flow: review, guardian signature, durable journal, broadcast, and RPC confirmation](docs/assets/solana-flow.gif)

Signed transaction bytes are saved locally **before broadcast**. Uncertain outcomes block new signatures; recovery checks chain status or explicitly rebroadcasts the same bytes. RPC endpoints are verified against **Solana mainnet**. Practice Brotes have no monetary value and never become SOL.

See [the Solana integration](SOLANA.md) and [interactive architecture diagram](https://brote-three.vercel.app/architecture/) for details.

## Run locally

Use Node.js **22.12+** and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Optional: set `VITE_SOLANA_RPC_URL` to a browser-accessible HTTPS **mainnet** RPC. Vite exposes this value in the client bundle, so use an endpoint intended for public clients. Without it, Brote uses verified public mainnet endpoints.

## Prototype scope

Profiles, practice history, and the signed-operation journal are stored in this browser. The family/personal view switch is a demo control; local limits and consent prompts are not on-chain enforcement or account authentication. Real activity shows blockchain transfers, not merchant purchase details. Mainnet reads were tested; extension signing and funded transfers still require a live wallet test. Visa and production custody are future work.

[Roadmap](docs/ROADMAP.md) · [Pitch](docs/PITCH.md) · [Deployment](docs/DEPLOYMENT.md) · [Audit](docs/AUDIT.md) · [Verification](docs/VERIFICATION.md) · [Commit guide](docs/COMMITS.md)

## License

[MIT](LICENSE) © 2026 Kevin Bravo.
