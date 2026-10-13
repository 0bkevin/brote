import data from './seo-data.json';
import type { Language } from './i18n-core';

/** Keep visible language and share metadata consistent; URLs always use the public origin. */
export function syncSeoMetadata(language: Language) {
  if (typeof document === 'undefined') return;
  const page = typeof window !== 'undefined' && /^\/app\/?$/.test(window.location.pathname)
    ? data.pages.app : data.pages.home;
  const copy = page[language];
  const locale = data.locales[language];
  const url = data.origin + page.path;
  document.title = copy.title;
  const setMeta = (attribute: 'name' | 'property', key: string, value: string) => {
    let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attribute, key);
      document.head.append(node);
    }
    node.content = value;
  };
  setMeta('name', 'description', copy.description);
  for (const [key, value] of Object.entries({
    'og:title': copy.title, 'og:description': copy.description, 'og:url': url,
    'og:locale': locale.og, 'og:image': data.origin + locale.image,
    'og:image:secure_url': data.origin + locale.image, 'og:image:alt': locale.imageAlt,
  })) setMeta('property', key, value);
  for (const [key, value] of Object.entries({
    'twitter:title': copy.title, 'twitter:description': copy.description,
    'twitter:image': data.origin + locale.image, 'twitter:image:alt': locale.imageAlt,
  })) setMeta('name', key, value);
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach(node => node.remove());
  for (const other of Object.values(data.locales).filter(item => item.og !== locale.og)) {
    const node = document.createElement('meta');
    node.setAttribute('property', 'og:locale:alternate');
    node.content = other.og;
    document.head.append(node);
  }
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = url;
  const schema = document.getElementById('brote-structured-data');
  if (schema?.textContent) {
    const structured = JSON.parse(schema.textContent);
    for (const entity of structured['@graph'] ?? []) {
      if (entity['@type'] === 'WebPage') Object.assign(entity, { '@id': url + '#webpage', name: copy.title, description: copy.description, inLanguage: locale.html, url });
      if (entity['@type'] === 'WebApplication') Object.assign(entity, { description: data.pages.home[language].description, image: data.origin + locale.image });
    }
    schema.textContent = JSON.stringify(structured);
  }
}
