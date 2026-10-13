import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { seo, withSeo } from './seo.mjs';

test('every public route has crawler-readable metadata without executing the app', () => {
  const template = '<!doctype html><html lang="es"><head><title>Old title</title><meta name="description" content="Old copy"><meta name="viewport" content="width=device-width"></head><body><div id="root"></div></body></html>';
  for (const [key, page] of Object.entries(seo.pages)) {
    const html = withSeo(template, key);
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    assert.equal((html.match(/name="description"/g) ?? []).length, 1);
    assert.ok(html.includes(`href="${seo.origin}${page.path}"`));
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
    assert.ok(html.includes(`property="og:image" content="${seo.origin}${seo.locales[page.defaultLanguage].image}"`));
    assert.ok(html.includes('name="viewport"')); // Preserve essential existing head elements.
    assert.ok(!html.includes('Old title'));
    const schema = JSON.parse(html.match(/id="brote-structured-data"[^>]*>(.*?)<\/script>/s)[1]);
    assert.equal(schema['@graph'].find(entity => entity['@type'] === 'WebPage').url, seo.origin + page.path);
    assert.equal(withSeo(html, key), html); // A second build cannot duplicate tags.
  }
});

test('localized share metadata points to valid raster images with accurate dimensions', async () => {
  for (const [language, locale] of Object.entries(seo.locales)) {
    const html = withSeo('<html lang="es"><head></head></html>', 'home', language);
    assert.ok(html.includes(`lang="${locale.html}"`));
    assert.ok(html.includes(`property="og:locale" content="${locale.og}"`));
    assert.equal((html.match(/property="og:locale:alternate"/g) ?? []).length, 2);
    assert.ok(!html.includes(`property="og:locale:alternate" content="${locale.og}"`));
    const png = await readFile(new URL('../public' + locale.image, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  }
});

test('metadata keeps query variants on the canonical public route and preserves the document', () => {
  const html = withSeo('<html lang="en"><head><link rel="canonical" href="http://localhost:5173/app?mode=crypto"><meta property="og:title" content="Stale"><meta name="twitter:title" content="Stale"></head><body><h1>A real demo</h1></body></html>', 'app', 'en');
  assert.ok(!html.includes('localhost'));
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.equal((html.match(/property="og:title"/g) ?? []).length, 1);
  assert.ok(html.includes('<h1>A real demo</h1>'));
});
