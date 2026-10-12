# Deployment

## Published endpoints

- Repository: https://github.com/0bkevin/brote
- Landing page: https://brote-three.vercel.app
- App: https://brote-three.vercel.app/app/
- Animated architecture page: https://brote-three.vercel.app/architecture/
- Vercel project: https://vercel.com/mustafinhos-projects/brote

The project belongs to **mustafinho's projects** and is connected to `0bkevin/brote`. The production branch is `main`. Vercel builds the static frontend; the prototype needs no hosted database, private signing keys, or server functions.

## Build and routing

`vercel.json` selects Vite, installs with `npm ci`, builds with `npm run build`, and serves `dist`. The project uses Node.js 24.x; GitHub Actions validates the tests and build on Node.js 22.

`scripts/build-routes.mjs` creates a static `/app/` entry and publishes the self-contained architecture page. Explicit Vercel rewrites support both trailing-slash and non-trailing-slash URLs. The landing page remains at `/`.

GitHub pushes trigger Vercel deployments. The `Validate Brote` workflow runs the 53 regression tests and production build. To deploy from an authenticated local checkout instead:

```sh
vercel link --yes --scope mustafinhos-projects --project brote
vercel --prod --yes --scope mustafinhos-projects
```

Local `.vercel/` settings and `.env*` files are ignored by Git and excluded from deployment uploads. No RPC override is required for this demo; any `VITE_SOLANA_RPC_URL` must be a mainnet HTTPS endpoint intended for public browser use.

## Moving between hosts

Browser storage belongs to an origin. A profile created on the earlier Site deployment will not automatically appear on Vercel. Export its JSON backup from the old host and restore it on the new host to preserve profile IDs, guardian bases, and signed-operation records. Stable IDs and the same guardian wallet are required to rediscover the same real-SOL accounts.

The original Site remains available at https://brote-family-solana.brown-isle-1431.chatgpt.site. Mainnet reads were tested; no funded transaction was signed or broadcast during deployment verification.
