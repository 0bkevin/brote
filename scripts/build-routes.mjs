import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { seo, withSeo } from './seo.mjs';
const landing = await readFile('dist/index.html', 'utf8');
await writeFile('dist/index.html', withSeo(landing, 'home'));
// Give the web app a real static entry so /app works without host rewrite rules.
await mkdir('dist/app', { recursive: true });
await writeFile('dist/app/index.html', withSeo(landing, 'app'));
// Publish the standalone, self-contained architecture diagram alongside the app.
await mkdir('dist/architecture', { recursive: true });
await writeFile('dist/architecture/index.html', withSeo(await readFile('docs/architecture.html', 'utf8'), 'architecture'));
await writeFile('dist/guide/index.html', withSeo(await readFile('public/guide/index.html', 'utf8'), 'guide'));
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${seo.origin}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.values(seo.pages).map(page => `  <url><loc>${seo.origin}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`);
