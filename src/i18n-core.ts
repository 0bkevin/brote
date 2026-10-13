import { appMessages } from "./locales/app";
import { landingMessages } from "./locales/landing";
import { learningMessages } from "./locales/learning";
import { solanaMessages } from "./locales/solana";
import { domainMessages } from "./locales/domain";
import { coreMessages } from "./locales/core";
import { arcadeMessages } from "./locales/arcade";
import { marketMessages } from "./locales/market";
import { islandMessages } from "./locales/island";

export type Language = "es" | "en" | "pt";
export type TranslationValues = Record<string, string | number>;
export const languageNames: Record<Language, string> = { es: "Español", en: "English", pt: "Português" };
export const intlLocales: Record<Language, string> = { es: "es-VE", en: "en-US", pt: "pt-BR" };
const storageKey = "brote-language";
const validLanguage = (value: unknown): value is Language => value === "es" || value === "en" || value === "pt";
function initialLanguage(): Language {
  try {
    const saved = typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
    return validLanguage(saved) ? saved : "es";
  } catch { return "es"; }
}
let language: Language = initialLanguage();
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const getIntlLocale = () => intlLocales[language];
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function commitLanguage(next: Language) {
  if (language === next) { syncDocumentLanguage(); return; }
  language = next;
  syncDocumentLanguage();
  listeners.forEach(listener => listener());
}
export function setLanguage(next: Language) {
  if (!validLanguage(next)) return;
  commitLanguage(next);
  try { if (typeof window !== "undefined") window.localStorage.setItem(storageKey, next); } catch { /* The current session still works. */ }
}
if (typeof window !== "undefined") window.addEventListener("storage", event => {
  if (event.key === storageKey) commitLanguage(validLanguage(event.newValue) ? event.newValue : "es");
});
const catalog = { ...coreMessages, ...appMessages, ...landingMessages, ...learningMessages, ...solanaMessages, ...domainMessages, ...arcadeMessages, ...marketMessages, ...islandMessages };
const reverse = new Map<string, string>();
for (const [source, translations] of Object.entries(catalog)) {
  reverse.set(translations.en, source);
  reverse.set(translations.pt, source);
}
const fill = (message: string, values: TranslationValues) => message.replace(/\{([\w]+)\}/g, (placeholder, key: string) => String(values[key] ?? placeholder));
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const templates = Object.entries(catalog).flatMap(([source, translations]) => {
  if (!/\{[\w]+\}/.test(source)) return [];
  return [source, translations.en, translations.pt].map(message => {
    const keys: string[] = [];
    let pattern = "";
    let start = 0;
    for (const match of message.matchAll(/\{([\w]+)\}/g)) {
      pattern += escape(message.slice(start, match.index)) + "(.*?)";
      keys.push(match[1]);
      start = (match.index ?? 0) + match[0].length;
    }
    return { source, keys, regex: new RegExp("^" + pattern + escape(message.slice(start)) + "$", "s") };
  });
});
export function translate(message: string, values: TranslationValues = {}): string {
  if (message.startsWith("Error: ")) return translate(message.slice(7), values);
  let source = Object.hasOwn(catalog, message) ? message : reverse.get(message) ?? message;
  let resolved = values;
  if (!Object.hasOwn(catalog, source)) {
    for (const template of templates) {
      const match = template.regex.exec(message);
      if (match) {
        source = template.source;
        resolved = { ...Object.fromEntries(template.keys.map((key, index) => [key, match[index + 1]])), ...values };
        break;
      }
    }
  }
  const translated = language === "es" ? source : catalog[source]?.[language] ?? source;
  const nestedKeys = new Set(["error", "success", "label", "relationship", "kind", "title"]);
  const localized = Object.fromEntries(Object.entries(resolved).map(([key, value]) =>
    [key, nestedKeys.has(key) && typeof value === "string" && value !== message ? translate(value) : value]));
  return fill(translated, localized);
}
export const t = translate;
function syncDocumentLanguage() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language === "pt" ? "pt-BR" : language;
  document.title = translate("Brote · Crecemos juntos");
  document.querySelector('meta[name="description"]')?.setAttribute("content", translate("Brote: aprende a cuidar tu dinero, en buena compañía. Wallets acompañadas, metas y pequeñas aventuras financieras."));
}
syncDocumentLanguage();
