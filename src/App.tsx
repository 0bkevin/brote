import { useEffect, useState } from "react";
import {
  Accessibility,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Download,
  Flame,
  Home,
  Leaf,
  LogOut,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import { useStore } from "./store";
import { useSolana } from "./solana";
import Recovery, { downloadBackup } from "./components/Recovery";
import type { StoreAPI, Transaction, Wallet, Mode } from "./types";
import { formatMoney, moneyNumber } from "./format";
import { activityDate } from "./activity";
import { csvDocument } from "./csv";
import Avatar from "./components/Avatar";
import Plant, { LeafLogo } from "./components/Plant";
import Modal from "./components/Modal";
import MobileNav, { type Page } from "./components/MobileNav";
import Wallets, {
  CreateWalletModal,
  WalletActionModal,
  WalletCards,
} from "./components/Wallets";
import Learning from "./components/Learning";
import SolanaPanel from "./components/SolanaPanel";
import { useI18n, LanguageSwitcher } from "./i18n";

function TransactionList({
  transactions,
  store,
  isGuardian,
  notify,
  compact = false,
}: {
  transactions: Transaction[];
  store: StoreAPI;
  isGuardian: boolean;
  notify: (s: string) => void;
  compact?: boolean;
}) {
  const { locale, t: tr } = useI18n();
  const sorted = [...transactions].sort(
    (a, b) => Date.parse(activityDate(b)) - Date.parse(activityDate(a)),
  );
  return (
    <div className="transaction-list">
      {(compact ? sorted.slice(0, 4) : sorted).map((t) => {
        const w = store.state.wallets.find((w) => w.id === t.walletId);
        const out = t.type === "purchase" || t.type === "saving";
        return (
          <div
            className={`transaction-row ${t.status === "pending" ? "pending-row" : ""}`}
            key={t.id}
          >
            <span className={`tx-icon ${t.type}`} aria-hidden="true">
              {t.type === "saving" ? (
                <Target size={19} />
              ) : t.type === "reward" ? (
                <Sparkles size={19} />
              ) : out ? (
                <ArrowUpRight size={19} />
              ) : (
                <ArrowDownLeft size={19} />
              )}
            </span>
            <div className="tx-copy">
              <strong>{tr(t.title)}</strong>
              <span>
                {w?.name} <i>·</i> {tr(t.category)} <i>·</i>{" "}
                {new Intl.DateTimeFormat(locale, {
                  day: "numeric",
                  month: "short",
                }).format(new Date(activityDate(t)))}
              </span>
            </div>
            <div className="tx-amount">
              <strong className={!out ? "positive" : ""}>
                {out ? "−" : "+"}
                {formatMoney(Math.abs(t.amount))}
              </strong>
              {t.status !== "completed" && (
                <span
                  className={`tag ${t.status === "pending" ? "tag-orange" : "tag-muted"}`}
                >
                  {t.status === "pending" ? tr("Por aprobar") : tr("Rechazado")}
                </span>
              )}
            </div>
            {t.status === "pending" && isGuardian && !compact && (
              <div className="tx-review">
                <button
                  className="review-button approve"
                  aria-label={tr("Aprobar {name}", { name: tr(t.title) })}
                  onClick={() => {
                    try {
                      store.reviewTransaction(t.id, true);
                      notify(tr("Gasto aprobado. Brotes descontados una sola vez."));
                    } catch (e) {
                      notify(
                        e instanceof Error ? tr(e.message) : tr("No se pudo aprobar."),
                      );
                    }
                  }}
                >
                  <Check size={16} />
                </button>
                <button
                  className="review-button"
                  aria-label={tr("Rechazar {name}", { name: tr(t.title) })}
                  onClick={() => {
                    try {
                      store.reviewTransaction(t.id, false);
                      notify(tr("Gasto rechazado. Su saldo sigue disponible."));
                    } catch (e) {
                      notify(
                        e instanceof Error ? tr(e.message) : tr("No se pudo rechazar."),
                      );
                    }
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        );
      })}
      {!transactions.length && (
        <div className="empty-state">
          <Leaf size={28} />
          <h3>{tr("Aquí empieza tu historia")}</h3>
          <p>{tr("Cada paso aparecerá en tu actividad.")}</p>
        </div>
      )}
    </div>
  );
}

function Activity({
  store,
  isGuardian,
  selectedId,
  notify,
}: {
  store: StoreAPI;
  isGuardian: boolean;
  selectedId: string;
  notify: (s: string) => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const all = store.state.transactions.filter(
    (t) => isGuardian || t.walletId === selectedId,
  );
  const list = all.filter(
    (t) =>
      (filter === "all" || t.walletId === filter) &&
      (status === "all" || t.status === status),
  );
  const exportCSV = () => {
    const rows = [
      [t("Fecha de actividad"), t("Fecha de solicitud"), t("Persona"), t("Concepto"), t("Categoría"), t("Brotes"), t("Tipo"), t("Estado")],
      ...list.map((transaction) => [
        activityDate(transaction),
        transaction.createdAt,
        store.state.wallets.find((w) => w.id === transaction.walletId)?.name || "",
        t(transaction.title),
        t(transaction.category),
        String(transaction.amount),
        transaction.type,
        transaction.status,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        [csvDocument(rows)],
        { type: "text/csv;charset=utf-8;" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "brote-actividad-practica.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    notify(t("Actividad de práctica exportada."));
  };
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>{t("Cada movimiento, una historia")}</h2>
          <p>{t("Entiende cómo practican y qué hábitos van construyendo.")}</p>
        </div>
        <button className="button button-secondary" onClick={exportCSV}>
          <Download size={16} />
          {t("Exportar")}
        </button>
      </div>
      <div className="card activity-card">
        <div className="activity-filters">
          <span className="tag tag-green">
            <Sparkles size={13} />
            {t("Dinero de práctica")}
          </span>
          <div>
            {isGuardian && (
              <label className="sr-label">
                {t("Persona")}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label={t("Filtrar por persona")}
                >
                  <option value="all">{t("Toda la familia")}</option>
                  {store.state.wallets.map((w) => (
                    <option value={w.id} key={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="sr-label">
              {t("Estado")}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label={t("Filtrar por estado")}
              >
                <option value="all">{t("Todos los movimientos")}</option>
                <option value="pending">{t("Por aprobar")}</option>
                <option value="completed">{t("Completados")}</option>
                <option value="rejected">{t("Rechazados")}</option>
              </select>
            </label>
          </div>
        </div>
        <TransactionList
          store={store}
          transactions={list}
          isGuardian={isGuardian}
          notify={notify}
        />
      </div>
    </>
  );
}

function WeekChart({ transactions }: { transactions: Transaction[] }) {
  const { locale, t } = useI18n();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const tx = transactions.filter(
      (t) =>
        t.status === "completed" &&
        new Date(activityDate(t)).toDateString() === d.toDateString(),
    );
    return {
      day: new Intl.DateTimeFormat(locale, { weekday: "short" })
        .format(d)
        .replace(".", ""),
      income: tx
        .filter((t) => t.type === "topup" || t.type === "reward")
        .reduce((s, t) => s + Math.abs(t.amount), 0),
      expense: tx
        .filter((t) => t.type === "purchase")
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    };
  });
  const max = Math.max(1, ...days.flatMap((d) => [d.income, d.expense]));
  return (
    <div
      className="week-chart"
      role="img"
      aria-label={days
        .map(
          (d) =>
            t("{day}: {income} Brotes recibidos, {expense} gastados", { day: d.day, income: d.income, expense: d.expense }),
        )
        .join(". ")}
    >
      <div className="chart-axis">
        <span>{moneyNumber(max)} B</span>
        <span>{moneyNumber(max / 2)} B</span>
        <span>0 B</span>
      </div>
      <div className="chart-bars">
        {days.map((d, i) => (
          <div className="chart-day" key={i}>
            <div className="bar-pair">
              <div
                className="income-bar"
                title={t("{amount} Brotes recibidos", { amount: moneyNumber(d.income) })}
                style={{
                  height: `${(d.income / max) * 100}%`,
                  minHeight: d.income > 0 ? 3 : 0,
                }}
              />
              <div
                className="expense-bar"
                title={t("{amount} Brotes gastados", { amount: moneyNumber(d.expense) })}
                style={{
                  height: `${(d.expense / max) * 100}%`,
                  minHeight: d.expense > 0 ? 3 : 0,
                }}
              />
            </div>
            <span>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useI18n();
  const store = useStore();
  const chain = useSolana();
  const [page, setPage] = useState<Page>(() =>
    new URLSearchParams(location.search).get("view") === "learn"
      ? "learn"
      : "home",
  );
  const [mode, setMode] = useState<Mode>(() =>
    new URLSearchParams(location.search).get("mode") === "crypto"
      ? "crypto"
      : "practice",
  );
  const [simple, setSimple] = useState(() => {
    try {
      return localStorage.getItem("brote-simple-mode") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const wasSimple = document.body.classList.contains("simple-mode");
    document.body.classList.toggle("simple-mode", simple);
    return () => {
      document.body.classList.toggle("simple-mode", wasSimple);
    };
  }, [simple]);
  useEffect(() => {
    try {
      localStorage.setItem("brote-simple-mode", String(simple));
    } catch {
      /* Keep the preference in memory. */
    }
  }, [simple]);
  const [selectedId, setSelectedId] = useState(
    store.state.wallets[0]?.id || "sofia",
  );
  const [role, setRole] = useState("guardian");
  const [create, setCreate] = useState(false);
  const [topup, setTopup] = useState(false);
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [toast, setToast] = useState("");
  const isGuardian = role === "guardian";
  useEffect(() => {
    const first = store.state.wallets[0]?.id;
    if (!first) return;
    if (!store.state.wallets.some(wallet => wallet.id === selectedId)) setSelectedId(first);
    if (role !== "guardian" && !store.state.wallets.some(wallet => wallet.id === role)) setRole(first);
  }, [store.state.wallets, selectedId, role]);
  const selected =
    store.state.wallets.find(
      (w) => w.id === (isGuardian ? selectedId : role),
    ) || store.state.wallets[0];
  const wallets = isGuardian ? store.state.wallets : [selected];
  const tx = store.state.transactions.filter(
    (t) => isGuardian || t.walletId === selected.id,
  );
  const pending = tx.filter((t) => t.status === "pending");
  const savings = wallets
    .flatMap((w) => w.goals)
    .filter((g) => g.mode === "practice")
    .reduce((s, g) => s + g.saved, 0);
  const completed = wallets.reduce((s, w) => s + w.completedMissions.length, 0);
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (next: Page) => {
    setPage(next);
    if (next === "learn" || next === "settings") setMode("practice");
  };
  const changeMode = (next: Mode) => {
    setMode(next);
    if (next === "crypto" && (page === "learn" || page === "settings"))
      setPage("wallets");
  };
  const changeRole = (next: string) => {
    setRole(next);
    if (next !== "guardian") {
      setSelectedId(next);
      setMode("practice");
      setPage("home");
    }
  };
  const openWallet = (id: string) => {
    setSelectedId(id);
    setPage("wallets");
  };
  const nav = [
    { id: "home" as Page, label: t("Inicio"), icon: Home },
    {
      id: "wallets" as Page,
      label: isGuardian ? t("Mis wallets") : t("Mi wallet"),
      icon: WalletIcon,
    },
    { id: "learn" as Page, label: t("Aprender jugando"), icon: Sparkles },
    { id: "activity" as Page, label: t("Actividad"), icon: ArrowUpRight },
  ];
  return (
    <div className={`app-shell${simple ? " simple-mode" : ""}`}>
      <MobileNav
        nav={nav}
        page={page}
        mode={mode}
        role={role}
        selectedId={selectedId}
        people={store.state.wallets}
        simple={simple}
        pendingCount={isGuardian ? pending.length : 0}
        onNavigate={go}
        onModeChange={changeMode}
        onRoleChange={changeRole}
        onPersonChange={setSelectedId}
        onSimpleChange={() => setSimple((value) => !value)}
        onHelp={() => setHelp(true)}
      />
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span>
            <LeafLogo size={30} />
          </span>
          brote<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">{t("CRECEMOS JUNTOS")}</div>
        <div className="family-switch">
          <span className="family-icon">
            <Home size={17} />
          </span>
          <div>
            <strong>{t("Familia García")}</strong>
            <span>{t("Tu círculo de confianza")}</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav aria-label={t("Navegación principal")}>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-link ${page === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {isGuardian && n.id === "activity" && pending.length > 0 && (
                <b>{pending.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <LeafLogo size={29} />
            <strong>
              {t("Aprende a tu ritmo.")}
              <br />
              {t("Avanza en compañía.")}
            </strong>
            <span>{t("Tu próxima aventura te espera.")}</span>
          </div>
          <button
            className={`nav-link ${page === "settings" ? "active" : ""}`}
            onClick={() => go("settings")}
          >
            <Settings2 size={19} />
            {t("Preferencias")}
          </button>
          <button
            className="nav-link simple-toggle"
            aria-pressed={simple}
            onClick={() => setSimple((value) => !value)}
          >
            <Accessibility size={19} />
            {t("Modo simple")}{" "}
            <span className={`toggle-indicator ${simple ? "on" : ""}`} />
          </button>
          <button className="nav-link" onClick={() => setHelp(true)}>
            <CircleHelp size={19} />
            {t("Conoce Brote")}
          </button>
          <div className="sidebar-user">
            <span className="human-avatar">
              {isGuardian ? "CG" : selected.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{isGuardian ? t("Carolina García") : selected.name}</strong>
              <span>
                {isGuardian
                  ? t("Persona responsable · demo")
                  : t("Espacio personal · demo")}
              </span>
            </div>
            <ShieldCheck size={18} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
              {t("Mi espacio")} <span>/</span>{" "}
            <strong>
              {nav.find((n) => n.id === page)?.label || t("Preferencias")}
            </strong>
          </div>
          <div className="topbar-actions">
            <div className="mode-switch" role="group" aria-label={t("Tipo de dinero")}>
              <button
                className={mode === "practice" ? "active" : ""}
                aria-pressed={mode === "practice"}
                onClick={() => changeMode("practice")}
              >
                <Sparkles size={14} />
                {t("Práctica")}
              </button>
              <button
                className={mode === "crypto" ? "active" : ""}
                aria-pressed={mode === "crypto"}
                onClick={() => changeMode("crypto")}
              >
                <span className="solana-mark" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                Solana
              </button>
            </div>
            <label className="role-switch">
              <span className="sr-only">{t("Cambiar vista de demo")}</span>
              <select
                value={role}
                onChange={(e) => changeRole(e.target.value)}
              >
                <option value="guardian">{t("Vista familiar")}</option>
                {store.state.wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {t("Mi espacio · {name}", { name: w.name })}
                  </option>
                ))}
              </select>
            </label>
            <LanguageSwitcher compact />
            <button
              className="bell-button"
              aria-label={isGuardian ? t("Ver aprobaciones") : t("Ver mi actividad")}
              onClick={() => {
                setMode("practice");
                go("activity");
              }}
            >
              <Bell size={20} />
              {isGuardian && pending.length > 0 && <i />}
            </button>
          </div>
        </header>
        <main className="main-content">
          {(store.persistence.loading || !store.persistence.writable) && (
            <div className="form-note persistence-notice" role="status">
              <ShieldCheck size={20} />
              <span>{store.persistence.loading
                ? t("Comprobando los datos guardados…")
                : store.persistence.error ? t(store.persistence.error) : t("Esta pestaña está en modo lectura. Los cambios de la pestaña activa aparecerán aquí.")}
                {store.persistence.corruptRaw && t(" Abre Preferencias para descargar el registro original o restaurar una copia.")}
              </span>
            </div>
          )}
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                {isGuardian
                  ? t("TU CÍRCULO, TU TRANQUILIDAD")
                  : t("TU PRÓXIMO PASO EMPIEZA AQUÍ")}
              </span>
              <h1>
                {mode === "crypto"
                  ? t("Un puente a Solana")
                  : page === "home"
                    ? t("Hola, {name}. {ending}", { name: isGuardian ? t("Carolina García") : selected.name, ending: t(isGuardian ? "Todo va creciendo." : "Vamos a crecer.") })
                    : page === "wallets"
                      ? t("Cada wallet, un mundo.")
                      : page === "learn"
                        ? t("Aventuras de {name}", { name: selected.name })
                        : page === "activity"
                          ? t("Los pasos que van dando.")
                          : t("A tu manera.")}
              </h1>
              <p>
                {mode === "crypto"
                  ? t("Cuentas reales acompañadas, bajo la firma de tu wallet.")
                  : page === "home"
                    ? t("Acompaña sus decisiones de hoy. Celebra sus hábitos de mañana.")
                    : page === "wallets"
                      ? t("Más autonomía, con alguien cerca para acompañar.")
                      : page === "learn"
                        ? t("Aprender sobre dinero también puede ser una pequeña aventura.")
                        : page === "activity"
                          ? t("Una mirada compartida a sus decisiones de práctica.")
                          : t("Un espacio simple para cada persona de tu círculo.")}
              </p>
            </div>
            <span className="network-badge">
              <i />
              {mode === "crypto" ? "Solana mainnet" : t("Brote · demo web")}
            </span>
          </div>
          {mode === "crypto" ? (
            <SolanaPanel
              wallets={wallets}
              selectedWalletId={selected.id}
              notify={notify}
            />
          ) : (
            <>
              {page === "home" && (
                <>
                  <section className="welcome-banner">
                    <div className="welcome-copy">
                      <span className="eyebrow">
                        {t("APRENDER, EN BUENA COMPAÑÍA")}
                      </span>
                      <h2>
                        {t("Tu próxima aventura")}
                        <br />
                        {t("empieza aquí")}<span>.</span>
                      </h2>
                      <p>
                        {t("Un lugar para aprender a cuidar el dinero.")}
                        <br />{t("Y a las personas que más quieres.")}
                      </p>
                      <div className="banner-actions">
                        <button
                          className="button button-primary"
                          onClick={() =>
                            isGuardian ? setTopup(true) : go("wallets")
                          }
                        >
                          {isGuardian ? (
                            <Plus size={17} />
                          ) : (
                            <WalletIcon size={17} />
                          )}{" "}
                          {isGuardian ? t("Asignar Brotes") : t("Mi wallet")}
                        </button>
                        <button
                          className="button button-ghost"
                          onClick={() => go("learn")}
                        >
                          {t("Explorar aventuras")} <ArrowRight size={17} />
                        </button>
                      </div>
                    </div>
                    <Plant />
                    <div className="hero-caption">
                      <Leaf size={13} /> {t("Juntos, al siguiente nivel")}
                    </div>
                  </section>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-icon mint">
                        <WalletIcon size={20} />
                      </span>
                      <div>
                        <span>{t("Disponible para practicar")}</span>
                        <strong>
                          {moneyNumber(
                            wallets.reduce((s, w) => s + w.practiceBalance, 0),
                          )}
                          <small> B</small>
                        </strong>
                        <p>{t("Brotes sin valor monetario")}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon peach">
                        <Target size={20} />
                      </span>
                      <div>
                        <span>{t("Ahorro en sus metas")}</span>
                        <strong>
                          {moneyNumber(savings)}
                          <small> B</small>
                        </strong>
                        <p>
                          {t(wallets.reduce((s, w) => s + w.goals.length, 0) === 1 ? "{count} sueño en camino" : "{count} sueños en camino", { count: wallets.reduce((s, w) => s + w.goals.length, 0) })}
                        </p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon lavender">
                        <Sparkles size={20} />
                      </span>
                      <div>
                        <span>{t("Aventuras completadas")}</span>
                        <strong>
                          {completed}
                          <small> {t("pasos")}</small>
                        </strong>
                        <p>{t("Hábitos que van creciendo")}</p>
                      </div>
                    </div>
                  </div>
                  <section className="family-section">
                    <div className="section-heading">
                      <div>
                        <h2>
                          {isGuardian
                            ? t("Cada persona, su propio camino")
                            : t("Tu pequeño universo")}{" "}
                          <span className="count-badge">{wallets.length}</span>
                        </h2>
                      </div>
                      {isGuardian && (
                        <button
                          className="text-button"
                          onClick={() => setCreate(true)}
                        >
                          <Plus size={16} />
                          {t("Crear wallet")}
                        </button>
                      )}
                    </div>
                    <WalletCards wallets={wallets} onSelect={openWallet} />
                  </section>
                  <div className="dashboard-bottom">
                    <section className="card recent-card">
                      <div className="section-heading">
                        <h2>{t("Sus últimos pasos")}</h2>
                        <button
                          className="text-button"
                          onClick={() => go("activity")}
                        >
                          {t("Ver todos")} <ArrowRight size={14} />
                        </button>
                      </div>
                      <TransactionList
                        transactions={tx}
                        store={store}
                        isGuardian={isGuardian}
                        notify={notify}
                        compact
                      />
                      {isGuardian && pending.length > 0 && (
                        <button
                          className="approval-nudge"
                          onClick={() => go("activity")}
                        >
                          <span>
                            <ShieldCheck size={17} />
                            {pending.length}{" "}
                            {pending.length === 1
                              ? t("decisión espera")
                              : t("decisiones esperan")}{" "}
                            {t("tu acompañamiento")}
                          </span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </section>
                    <section className="card rhythm-card">
                      <div className="section-heading">
                        <div>
                          <h2>{t("El ritmo de la semana")}</h2>
                          <p>{t("Últimos 7 días · práctica")}</p>
                        </div>
                        <span className="tiny-icon">
                          <Leaf size={18} />
                        </span>
                      </div>
                      <WeekChart transactions={tx} />
                      <div className="chart-legend">
                        <span>
                          <i className="legend-income" />
                          {t("Brotes recibidos")}
                        </span>
                        <span>
                          <i className="legend-expense" />
                          {t("Brotes gastados")}
                        </span>
                      </div>
                    </section>
                  </div>
                  <section className="adventure-teaser">
                    <div className="adventure-icon">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <span className="eyebrow">
                        {t("HOY PUEDE SER UN BUEN COMIENZO")}
                      </span>
                      <h3>{t("¿Y si aprender a ahorrar fuera una aventura?")}</h3>
                      <p>
                        {t("Una canasta, un presupuesto y muchas pequeñas decisiones.")}
                      </p>
                    </div>
                    <button
                      className="button button-secondary"
                      onClick={() => go("learn")}
                    >
                      {t("Vamos a jugar")} <ArrowRight size={16} />
                    </button>
                  </section>
                </>
              )}
              {page === "wallets" && (
                <Wallets
                  key={selected.id}
                  store={store}
                  selectedId={selected.id}
                  onSelect={openWallet}
                  onAdd={() => setCreate(true)}
                  isGuardian={isGuardian}
                  notify={notify}
                />
              )}
              {page === "learn" && (
                <>
                  {isGuardian && (
                    <div className="learner-select" role="group" aria-label={t("Perfil para aprender")}>
                      <span>{t("Explorando con")}</span>
                      {store.state.wallets.map((w) => (
                        <button
                          className={selected.id === w.id ? "active" : ""}
                          aria-pressed={selected.id === w.id}
                          onClick={() => setSelectedId(w.id)}
                          key={w.id}
                        >
                          <Avatar kind={w.avatar} color={w.color} size={26} />
                          {w.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <Learning
                    simple={simple}
                    key={selected.id}
                    wallet={selected}
                    store={store}
                    notify={notify}
                  />
                </>
              )}
              {page === "activity" && (
                <Activity
                  store={store}
                  isGuardian={isGuardian}
                  selectedId={selected.id}
                  notify={notify}
                />
              )}
              {page === "settings" && (
                <div className="settings-grid">
                  {isGuardian && (
                    <Recovery state={store.state} notify={notify} />
                  )}
                  <section className="card settings-card">
                    <ShieldCheck size={26} />
                    <h2>{t("Una demo que puedes explorar")}</h2>
                    <p>
                      {t("Los perfiles y Brotes se guardan en este navegador. Puedes cambiar de vista para conocer la experiencia de cada persona.")}
                    </p>
                    <p>
                      {t("Las vistas de demo no son sesiones autenticadas. En Solana, la wallet conectada autoriza las operaciones reales.")}
                    </p>
                    <button
                      className="button button-secondary"
                      onClick={() => setHelp(true)}
                    >
                      {t("Cómo funciona Brote")} <ArrowRight size={16} />
                    </button>
                  </section>
                  {isGuardian && (
                    <section className="card settings-card">
                      <LogOut size={26} />
                      <h2>{t("Empezar de nuevo")}</h2>
                      <p>
                        {t("Reinicia los perfiles y el dinero de práctica. Las cuentas y los fondos Solana siguen en la red.")}
                      </p>
                      <p className="form-note">
                        {t("Antes de reiniciar, conserva los IDs de perfiles nuevos si creaste sus cuentas Solana.")}
                      </p>
                      <button
                        className="button button-secondary"
                        onClick={() => setReset(true)}
                      >
                        {t("Reiniciar práctica")}
                      </button>
                    </section>
                  )}
                </div>
              )}
            </>
          )}
          <footer className="app-footer">
            <span>
              <LeafLogo size={16} /> {t("Brote. Crecemos juntos.")}
            </span>
            <span>
              {mode === "practice"
                ? t("B = Brotes de práctica · sin valor monetario")
                : t("SOL real · Solana mainnet")}
            </span>
          </footer>
        </main>
      </div>
      {create && isGuardian && (
        <CreateWalletModal
          store={store}
          onClose={() => setCreate(false)}
          onCreated={(w) => {
            setSelectedId(w.id);
            go("wallets");
            notify(t("¡Bienvenido, {name}! Su próximo paso empieza aquí.", { name: w.name }));
          }}
        />
      )}
      {topup && isGuardian && (
        <WalletActionModal
          action="topup"
          wallet={selected}
          store={store}
          onClose={() => setTopup(false)}
          notify={notify}
        />
      )}
      {help && (
        <Modal
          title={t("Un lugar para crecer juntos")}
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <span className="help-logo">
              <LeafLogo size={44} />
            </span>
            <p>
              {t("Brote ayuda a una persona responsable a acompañar el aprendizaje financiero de niños, adultos y personas mayores.")}
            </p>
            <div>
              <Sparkles size={21} />
              <section>
                <h3>{t("Primero, practica")}</h3>
                <p>
                  {t("Asigna Brotes, completa misiones y ahorra para una meta. Los Brotes son ficticios y no se convierten en SOL.")}
                </p>
              </section>
            </div>
            <div>
              <WalletIcon size={21} />
              <section>
                <h3>{t("Después, conecta con Solana")}</h3>
                <p>
                  {t("Conecta Phantom o Solflare. Las cuentas del círculo se derivan de la wallet del responsable, quien firma cada movimiento real.")}
                </p>
              </section>
            </div>
            <div>
              <ShieldCheck size={21} />
              <section>
                <h3>{t("Acompaña con claridad")}</h3>
                <p>
                  {t("Revisa actividad de práctica y transacciones en la red. Las categorías de compra las registra la persona; la blockchain no revela qué compró.")}
                </p>
              </section>
            </div>
            <button
              className="button button-primary full-width"
              onClick={() => setHelp(false)}
            >
              {t("Empecemos a crecer")} <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {reset && (
        <Modal
          title={t("¿Volvemos al primer paso?")}
          onClose={() => setReset(false)}
        >
          <p className="muted modal-intro">
            {t("Se reemplazarán los perfiles y la actividad de práctica de este navegador por los ejemplos iniciales. Los fondos Solana no se mueven.")}
          </p>
          <p className="form-note">
            {t("Los IDs de perfiles creados determinan sus direcciones Solana. Guarda una copia antes de reiniciar si creaste cuentas reales.")}
          </p>
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setReset(false)}
            >
              {t("Conservar mis pasos")}
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                try {
                  if (chain.operationError || chain.busy || chain.operations.some(operation => operation.state === "pending"))
                    throw Error(t("Resuelve la operación Solana pendiente antes de reiniciar perfiles."));
                  downloadBackup(store.state);
                  chain.invalidateSigningSession();
                  store.resetDemo();
                  setSelectedId("sofia");
                  setRole("guardian");
                  go("home");
                  setReset(false);
                  notify(t("La práctica empieza de nuevo."));
                } catch (error) {
                  notify(error instanceof Error ? t(error.message) : t("No pudimos reiniciar los datos."));
                }
              }}
            >
              {t("Guardar copia y reiniciar")}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{t(toast)}</span>
          <button onClick={() => setToast("")} aria-label={t("Cerrar mensaje")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
