# SEO and social previews

Brote serves titles, descriptions, canonical URLs, Open Graph and X cards in the HTML response, so link previews work without running JavaScript. The landing page, app, video guide and architecture page each have their own metadata. The landing page and app also update their metadata when a user switches between Spanish, English and Brazilian Portuguese.

`src/seo-data.json` is the source of truth for public URLs and translated copy. The canonical origin is `https://brote-three.vercel.app`; change it there if the project gets a custom domain. The build generates `robots.txt`, `sitemap.xml` and route-specific HTML through `scripts/build-routes.mjs`. Language selection currently shares the same URLs, so the sitemap does not claim separate translated pages or add `hreflang` links.

The JSON-LD describes Brote as a web application for learning, including practice wallets, goals, games and guardian-controlled Solana accounts. It does not claim ratings, a banking license, payment cards or a deployed custom contract.

Social previews are 1200 × 630 PNGs in `public/og/`, one per language. `scripts/build-og.tsx` renders the actual sprout mascot, Outfit and Nunito Sans typography, and the purple/blue/lime palette. Editable SVGs are saved to `docs/og/`. The fixed font instances in `docs/og/fonts/` come from the existing licensed variable fonts; their OFL licenses are included.

```sh
npm run og       # Regenerate the three social images
npm run build    # Generate images, metadata, sitemap and production routes
```

The browser's saved language changes the visible page and its metadata. Social crawlers receive each route's default language from the static HTML. Share previews can remain cached by a platform after deployment.
