import { useEffect, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  CircleHelp,
  Menu,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Mode } from "../types";
import { LeafLogo } from "./Plant";
import Modal from "./Modal";
import { useI18n, LanguageSwitcher } from "../i18n";

export type Page = "home" | "wallets" | "learn" | "activity" | "settings";

type NavItem = { id: Page; label: string; icon: LucideIcon };
type Person = { id: string; name: string };

export default function MobileNav({
  nav,
  page,
  mode,
  role,
  selectedId,
  people,
  simple,
  pendingCount,
  onNavigate,
  onModeChange,
  onRoleChange,
  onPersonChange,
  onSimpleChange,
  onHelp,
}: {
  nav: NavItem[];
  page: Page;
  mode: Mode;
  role: string;
  selectedId: string;
  people: Person[];
  simple: boolean;
  pendingCount: number;
  onNavigate: (page: Page) => void;
  onModeChange: (mode: Mode) => void;
  onRoleChange: (role: string) => void;
  onPersonChange: (id: string) => void;
  onSimpleChange: () => void;
  onHelp: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const guardian = role === "guardian";

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 801px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <header className="mobile-header">
        <a
          className="mobile-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("home");
          }}
          aria-label={t("Brote · ir al inicio")}
        >
          <LeafLogo size={27} />
          <span>brote<span className="mobile-brand-dot">.</span></span>
        </a>
        <button
          className="mobile-menu-trigger"
          type="button"
          aria-label={guardian && pendingCount > 0
            ? t(pendingCount === 1 ? "Abrir menú · {count} aprobación pendiente" : "Abrir menú · {count} aprobaciones pendientes", { count: pendingCount })
            : t("Abrir menú")}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={23} aria-hidden="true" />
          {guardian && pendingCount > 0 && (
            <span className="mobile-menu-dot" aria-hidden="true" />
          )}
        </button>
      </header>
      {open && (
        <Modal title={t("Menú de Brote")} variant="sheet" onClose={() => setOpen(false)}>
          <div className="mobile-sheet-content">
            <div className="mobile-sheet-section">
              <p className="mobile-sheet-label">{t("Tu espacio")}</p>
              <label className="mobile-sheet-field">
                <span>{t("Vista de demo")}</span>
                <select
                  value={role}
                  onChange={(event) => choose(() => onRoleChange(event.target.value))}
                >
                  <option value="guardian">{t("Vista familiar")}</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {t("Mi espacio · {name}", { name: person.name })}
                    </option>
                  ))}
                </select>
              </label>
              {guardian ? (
                <label className="mobile-sheet-field">
                  <span>{t("Perfil seleccionado")}</span>
                  <select
                    value={selectedId}
                    onChange={(event) => choose(() => onPersonChange(event.target.value))}
                  >
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mobile-sheet-person">
                  {t("Espacio personal · {name}", { name: people.find((person) => person.id === role)?.name || "" })}
                </p>
              )}
            </div>

            <nav className="mobile-sheet-section mobile-sheet-nav" aria-label={t("Navegación principal móvil")}>
              <p className="mobile-sheet-label">{t("Explorar")}</p>
              {nav.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`mobile-sheet-action${page === item.id ? " active" : ""}`}
                  aria-current={page === item.id ? "page" : undefined}
                  onClick={() => choose(() => onNavigate(item.id))}
                >
                  <item.icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                  {guardian && item.id === "activity" && pendingCount > 0 && (
                    <span className="mobile-sheet-count">{t("{count} por aprobar", { count: pendingCount })}</span>
                  )}
                  <ArrowRight className="mobile-sheet-arrow" size={17} aria-hidden="true" />
                </button>
              ))}
            </nav>

            <div className="mobile-sheet-section">
              <p className="mobile-sheet-label">{t("Tipo de dinero")}</p>
              <div className="mobile-sheet-modes" role="group" aria-label={t("Tipo de dinero")}>
                <button
                  type="button"
                  className={mode === "practice" ? "active" : ""}
                  aria-pressed={mode === "practice"}
                  onClick={() => choose(() => onModeChange("practice"))}
                >
                  <Sparkles size={17} aria-hidden="true" /> {t("Práctica")}
                </button>
                <button
                  type="button"
                  className={mode === "crypto" ? "active" : ""}
                  aria-pressed={mode === "crypto"}
                  onClick={() => choose(() => onModeChange("crypto"))}
                >
                  <span className="solana-mark" aria-hidden="true"><i /><i /><i /></span>
                  Solana
                </button>
              </div>
            </div>

            <div className="mobile-sheet-section mobile-sheet-nav">
              <p className="mobile-sheet-label">{t("Más opciones")}</p>
              <button
                type="button"
                className={`mobile-sheet-action${page === "settings" ? " active" : ""}`}
                aria-current={page === "settings" ? "page" : undefined}
                onClick={() => choose(() => onNavigate("settings"))}
              >
                <Settings2 size={20} aria-hidden="true" />
                <span>{t("Preferencias")}</span>
                <ArrowRight className="mobile-sheet-arrow" size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="mobile-sheet-action"
                aria-pressed={simple}
                onClick={() => choose(onSimpleChange)}
              >
                <Accessibility size={20} aria-hidden="true" />
                <span>{t("Modo simple")}</span>
                <span className="mobile-sheet-state">{simple ? t("Activado") : t("Desactivado")}</span>
              </button>
              <button type="button" className="mobile-sheet-action" onClick={() => choose(onHelp)}>
                <CircleHelp size={20} aria-hidden="true" />
                <span>{t("Conoce Brote")}</span>
                <ArrowRight className="mobile-sheet-arrow" size={17} aria-hidden="true" />
              </button>
              <div className="mobile-sheet-action language-action">
                <span>{t("Idioma")}</span>
                <LanguageSwitcher compact />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
