import { readFile } from 'node:fs/promises';

export const seo = JSON.parse(await readFile(new URL('../src/seo-data.json', import.meta.url), 'utf8'));
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

export function seoHead(key, language = seo.pages[key].defaultLanguage) {
  const page = seo.pages[key];
  const copy = page[language];
  const locale = seo.locales[language];
  const url = seo.origin + page.path;
  const image = seo.origin + locale.image;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': seo.origin + '/#website', name: 'Brote', url: seo.origin + '/', inLanguage: ['es', 'en', 'pt-BR'] },
      { '@type': 'WebApplication', '@id': seo.origin + '/app/#application', name: 'Brote', url: seo.origin + '/app/', description: seo.pages.home[language].description, applicationCategory: 'EducationalApplication', operatingSystem: 'Web browser', inLanguage: ['es', 'en', 'pt-BR'], image, featureList: ['Supervised practice wallets', 'Savings goals', 'Financial learning games', 'Guardian-controlled Solana accounts'] },
      { '@type': 'WebPage', '@id': url + '#webpage', url, name: copy.title, description: copy.description, inLanguage: locale.html, isPartOf: { '@id': seo.origin + '/#website' }, about: { '@id': seo.origin + '/app/#application' } },
    ],
  };
  const property = (key, value) => `<meta property="${key}" content="${escape(value)}" />`;
  const name = (key, value) => `<meta name="${key}" content="${escape(value)}" />`;
  return [
    '<!-- Brote SEO -->', `<title>${escape(copy.title)}</title>`,
    name('description', copy.description), name('theme-color', '#6c4bff'),
    name('robots', 'index, follow, max-image-preview:large'),
    `<link rel="canonical" href="${url}" />`,
    property('og:type', 'website'), property('og:site_name', 'Brote'),
    property('og:title', copy.title), property('og:description', copy.description), property('og:url', url),
    property('og:locale', locale.og),
    ...Object.values(seo.locales).filter(item => item.og !== locale.og).map(item => property('og:locale:alternate', item.og)),
    property('og:image', image), property('og:image:secure_url', image), property('og:image:type', 'image/png'),
    property('og:image:width', '1200'), property('og:image:height', '630'), property('og:image:alt', locale.imageAlt),
    name('twitter:card', 'summary_large_image'), name('twitter:title', copy.title), name('twitter:description', copy.description),
    name('twitter:image', image), name('twitter:image:alt', locale.imageAlt),
    `<script id="brote-structured-data" type="application/ld+json">${json(schema)}</script>`,
    ...(key === 'guide' ? [`<script id="brote-seo-locales" type="application/json">${json(Object.fromEntries(Object.keys(seo.locales).map(lang => [lang, { ...page[lang], ...seo.locales[lang], image: seo.origin + seo.locales[lang].image }])))}</script>`] : []),
    '<!-- /Brote SEO -->',
  ].join('\n    ');
}

/** Emit crawler-readable tags in the HTML response, without relying on JavaScript. */
export function withSeo(html, page, language = seo.pages[page].defaultLanguage) {
  html = html.replace(/\s*<!-- Brote SEO -->[\s\S]*?<!-- \/Brote SEO -->/g, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, tag => /(?:name|property)=["'](?:description|theme-color|robots|og:[^"']+|twitter:[^"']+)["']/i.test(tag) ? '' : tag)
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*id=["']brote-(?:structured-data|seo-locales)["'][^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/(<html\b[^>]*\blang=)["'][^"']*["']/i, `$1"${seo.locales[language].html}"`);
  return html.replace(/\s*<\/head>/i, `\n    ${seoHead(page, language)}\n  </head>`).replace(/[ \t]+\n/g, '\n');
}
