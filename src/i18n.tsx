import { useSyncExternalStore } from "react";
import { ChevronDown, Globe2 } from "lucide-react";
import { getLanguage, getIntlLocale, languageNames, setLanguage, subscribeLanguage, translate, type Language } from "./i18n-core";
import "./i18n.css";
export { t, translate, getLanguage, getIntlLocale, setLanguage } from "./i18n-core";
export type { Language, TranslationValues } from "./i18n-core";
export function useI18n() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => "es" as Language);
  return { language, locale: getIntlLocale(), t: translate, setLanguage };
}
export const useLocale = useI18n;
export function LanguageSwitcher({ compact = true, className = "" }: { compact?: boolean; className?: string }) {
  const { language, t, setLanguage } = useI18n();
  return <label className={`language-switcher ${compact ? "is-compact" : ""} ${className}`} title={t("Cambiar idioma")}>
    <Globe2 size={16} aria-hidden="true" />
    <span aria-hidden="true">{compact ? language.toUpperCase() : languageNames[language]}</span>
    <ChevronDown size={12} aria-hidden="true" />
    <select aria-label={t("Idioma")} value={language} onChange={event => setLanguage(event.target.value as Language)}>
      <option value="es">Español</option><option value="en">English</option><option value="pt">Português</option>
    </select>
  </label>;
}
