import { useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet as WalletIcon,
} from "lucide-react";
import type {
  AvatarKind,
  ColorKind,
  NewWallet,
  StoreAPI,
  Wallet,
} from "../types";
import { formatMoney, levelFor } from "../format";
import { goalProgress } from "../goals";
import Avatar from "./Avatar";
import Modal from "./Modal";

export function WalletCards({
  wallets,
  onSelect,
  selectedId,
  onAdd,
}: {
  wallets: Wallet[];
  onSelect: (id: string) => void;
  selectedId?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="wallet-grid">
      {wallets.map((w) => {
        const goal = w.goals.find((g) => g.mode === "practice");
        return (
          <button
            key={w.id}
            className={`wallet-card card ${w.color} ${selectedId === w.id ? "selected" : ""}`}
            onClick={() => onSelect(w.id)}
            aria-pressed={selectedId === w.id}
          >
            <div className="wallet-card-top">
              <Avatar kind={w.avatar} color={w.color} size={52} />
              <span className={`person-level ${w.paused ? "paused" : ""}`}>
                {w.paused ? "En pausa" : `Nivel ${levelFor(w.xp)}`}
              </span>
            </div>
            <div className="wallet-person">
              <h3>{w.name}</h3>
              <p>{w.relationship}</p>
            </div>
            <div className="wallet-balance">
              <span>Disponible para practicar</span>
              <strong>{formatMoney(w.practiceBalance)}</strong>
            </div>
            {goal ? (
              <div className="wallet-goal">
                <div>
                  <span>
                    <Target size={13} />
                    {goal.title}
                  </span>
                  <b>{goalProgress(goal).percent}%</b>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${goalProgress(goal).percent}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="wallet-goal">
                <span className="muted">Un nuevo comienzo, a tu ritmo.</span>
              </div>
            )}
            <span className="wallet-open">
              Ver su espacio <ChevronRight size={15} />
            </span>
          </button>
        );
      })}
      {onAdd && wallets.length < 3 && (
        <button className="wallet-card wallet-add" onClick={onAdd}>
          <Plus size={25} />
          <strong>Acompaña a alguien más</strong>
          <span>Una wallet, un nuevo comienzo</span>
        </button>
      )}
    </div>
  );
}

export function CreateWalletModal({
  store,
  onClose,
  onCreated,
}: {
  store: StoreAPI;
  onClose: () => void;
  onCreated: (w: Wallet) => void;
}) {
  const [form, setForm] = useState<NewWallet>({
    name: "",
    relationship: "",
    kind: "child",
    avatar: "fox",
    color: "mint",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      if (!form.name.trim() || !form.relationship.trim())
        throw Error("Cuéntanos su nombre y qué relación tienen.");
      if (form.kind !== "child" && !consent)
        throw Error(
          "Confirma que esta persona acepta compartir su actividad contigo.",
        );
      const w = store.createWallet({
        ...form,
        name: form.name.trim(),
        relationship: form.relationship.trim(),
      });
      onCreated(w);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos crear la wallet.");
    }
  }
  return (
    <Modal title="Una wallet para alguien especial" onClose={onClose}>
      <p className="muted modal-intro">
        Aprender se siente mejor en compañía. Su espacio de práctica empieza con
        0 Brotes.
      </p>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            Nombre
            <input
              autoComplete="off"
              maxLength={30}
              value={form.name}
              onChange={(e) => {
                setConsent(false);
                setForm({ ...form, name: e.target.value });
              }}
              placeholder="¿Cómo se llama?"
              required
            />
          </label>
          <label className="field">
            Relación contigo
            <input
              value={form.relationship}
              maxLength={40}
              onChange={(e) => {
                setConsent(false);
                setForm({ ...form, relationship: e.target.value });
              }}
              placeholder="Hija, papá, estudiante…"
              required
            />
          </label>
        </div>
        <label className="field">
          ¿A quién acompañas?
          <select
            value={form.kind}
            onChange={(e) => {
              setConsent(false);
              setForm({ ...form, kind: e.target.value as NewWallet["kind"] });
            }}
          >
            <option value="child">Niño o adolescente</option>
            <option value="adult">Persona adulta</option>
            <option value="senior">Persona mayor</option>
          </select>
        </label>
        <span className="field-label">Elige su compañero</span>
        <div className="avatar-picker">
          {(["fox", "bear", "rabbit", "owl"] as AvatarKind[]).map((kind, i) => (
            <button
              type="button"
              key={kind}
              className={form.avatar === kind ? "chosen" : ""}
              aria-label={`Compañero ${["zorro", "oso", "conejo", "búho"][i]}`}
              aria-pressed={form.avatar === kind}
              onClick={() =>
                setForm({
                  ...form,
                  avatar: kind,
                  color: (
                    ["mint", "peach", "yellow", "lavender"] as ColorKind[]
                  )[i],
                })
              }
            >
              <Avatar
                kind={kind}
                color={
                  (["mint", "peach", "yellow", "lavender"] as ColorKind[])[i]
                }
                size={64}
              />
              {form.avatar === kind && <Check size={16} />}
            </button>
          ))}
        </div>
        {form.kind !== "child" ? (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Esta persona acepta que la acompañe y vea su actividad.
          </label>
        ) : (
          <div className="form-note">
            <ShieldCheck size={18} />
            <span>
              La persona responsable acompaña y aprueba los gastos según sus
              reglas.
            </span>
          </div>
        )}
        <p className="small muted">
          El perfil se guarda en este navegador. Su cuenta Solana se crea por
          separado, con tu firma.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button button-primary full-width" type="submit">
          <Plus size={17} />
          Crear wallet de práctica
        </button>
      </form>
    </Modal>
  );
}

export function WalletActionModal({
  wallet,
  action,
  store,
  onClose,
  notify,
}: {
  wallet: Wallet;
  action: "topup" | "purchase" | "goal";
  store: StoreAPI;
  onClose: () => void;
  notify: (s: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Entretenimiento");
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const n = Number(amount);
      if (action === "topup") store.topUp(wallet.id, n, "practice");
      else if (action === "purchase")
        store.purchase(wallet.id, title.trim(), category, n, "practice");
      else store.createGoal(wallet.id, title.trim(), n, "practice");
      notify(
        action === "topup"
          ? `¡${wallet.name} recibió ${formatMoney(n)} para practicar!`
          : action === "goal"
            ? "Una nueva meta para crecer."
            : "Gasto registrado. Revisa su estado en Actividad.",
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos completar esta acción.",
      );
    }
  }
  return (
    <Modal
      title={
        action === "topup"
          ? `Brotes para ${wallet.name}`
          : action === "purchase"
            ? "Practica una compra"
            : "Una nueva meta"
      }
      onClose={onClose}
    >
      <div className="practice-note">
        <Sparkles size={17} />
        <span>Dinero de práctica · sin valor monetario</span>
      </div>
      <form onSubmit={submit}>
        {action !== "topup" && (
          <label className="field">
            {action === "goal"
              ? "¿Qué quieres lograr?"
              : "¿En qué vas a gastar?"}
            <input
              value={title}
              maxLength={60}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                action === "goal" ? "Mi primera bicicleta" : "Entrada al cine"
              }
              required
            />
          </label>
        )}
        {action === "purchase" && (
          <label className="field">
            Categoría
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "Entretenimiento",
                "Educación",
                "Alimentación",
                "Transporte",
                "Otros",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          {action === "goal"
            ? "¿Cuántos Brotes necesitas?"
            : "Cantidad de Brotes"}
          <div className="amount-input">
            <input
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
            <span>B</span>
          </div>
        </label>
        {action === "topup" && (
          <div className="amount-presets">
            {[25, 50, 100, 200].map((n) => (
              <button
                type="button"
                className={amount === String(n) ? "active" : ""}
                onClick={() => setAmount(String(n))}
                key={n}
              >
                {n} B
              </button>
            ))}
          </div>
        )}
        {action === "purchase" && (
          <p className="small muted">
            Disponible: {formatMoney(wallet.practiceBalance)}.{" "}
            {wallet.approvalRequired
              ? "El gasto espera la aprobación de tu responsable."
              : "Tu gasto se descuenta al registrarlo."}
          </p>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="button button-primary full-width">
          {action === "topup"
            ? "Asignar Brotes"
            : action === "goal"
              ? "Crear mi meta"
              : "Registrar gasto"}
          <ArrowUpRight size={17} />
        </button>
      </form>
    </Modal>
  );
}

function GoalCard({
  wallet,
  goal,
  store,
  notify,
}: {
  wallet: Wallet;
  goal: Wallet["goals"][number];
  store: StoreAPI;
  notify: (s: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { complete, percent } = goalProgress(goal);
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      store.saveToGoal(wallet.id, goal.id, Number(amount));
      setSaving(false);
      setAmount("");
      notify("¡Cada Brote te acerca a tu meta!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }
  return (
    <div className="goal-detail">
      <div className="goal-symbol">
        <Target size={23} />
      </div>
      <div className="goal-body">
        <h3>{goal.title}</h3>
        <p>
          {formatMoney(goal.saved)} <span>de {formatMoney(goal.target)}</span>
        </p>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
        <div className="goal-bottom">
          <span>
            {complete ? "¡Lo lograste!" : `${percent}% del camino`}
          </span>
          <button
            className="text-button"
            disabled={wallet.paused || complete}
            onClick={() => setSaving(!saving)}
          >
            {saving ? "Cancelar" : "Añadir a mi ahorro"} <Plus size={14} />
          </button>
        </div>
        {saving && (
          <form className="inline-save" onSubmit={submit}>
            <label className="sr-only" htmlFor={goal.id}>
              Brotes para ahorrar
            </label>
            <input
              id={goal.id}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
            <button className="button button-primary" type="submit">
              Ahorrar
            </button>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function Wallets({
  store,
  selectedId,
  onSelect,
  onAdd,
  isGuardian,
  notify,
}: {
  store: StoreAPI;
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  isGuardian: boolean;
  notify: (s: string) => void;
}) {
  const wallet =
    store.state.wallets.find((w) => w.id === selectedId) ||
    store.state.wallets[0];
  const [action, setAction] = useState<"topup" | "purchase" | "goal" | null>(
    null,
  );
  const [rules, setRules] = useState(false);
  const [limit, setLimit] = useState(String(wallet.spendingLimit));
  const [approve, setApprove] = useState(wallet.approvalRequired);
  const [paused, setPaused] = useState(wallet.paused);
  const [error, setError] = useState("");
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>
            {isGuardian ? "Sus pequeños universos" : "Tu espacio para crecer"}
          </h2>
          <p>Un ritmo distinto. El mismo acompañamiento.</p>
        </div>
        {isGuardian && (
          <button className="button button-primary" onClick={onAdd}>
            <Plus size={16} />
            Nueva wallet
          </button>
        )}
      </div>
      <WalletCards
        wallets={isGuardian ? store.state.wallets : [wallet]}
        onSelect={onSelect}
        selectedId={wallet.id}
      />
      <section className="card wallet-detail">
        <div className="wallet-detail-head">
          <div className="person-inline">
            <Avatar kind={wallet.avatar} color={wallet.color} />
            <div>
              <h2>El espacio de {wallet.name}</h2>
              <p className="muted">
                {wallet.xp} XP · {wallet.completedMissions.length} aventuras
                completadas
              </p>
            </div>
          </div>
          <div className="detail-actions">
            {isGuardian && (
              <button
                className="button button-secondary"
                onClick={() => {
                  setLimit(String(wallet.spendingLimit));
                  setApprove(wallet.approvalRequired);
                  setPaused(wallet.paused);
                  setRules(true);
                }}
              >
                <ShieldCheck size={16} />
                Acompañamiento
              </button>
            )}
            {isGuardian && (
              <button
                className="button button-primary"
                disabled={wallet.paused}
                onClick={() => setAction("topup")}
              >
                <ArrowDownLeft size={16} />
                Asignar Brotes
              </button>
            )}
            <button
              className="button button-secondary"
              disabled={wallet.paused}
              onClick={() => setAction("purchase")}
            >
              <WalletIcon size={16} />
              Practicar un gasto
            </button>
          </div>
        </div>
        <div className="goal-section-head">
          <h3>Un poquito más cerca de sus metas</h3>
          <button
            className="text-button"
            disabled={wallet.paused}
            onClick={() => setAction("goal")}
          >
            <Plus size={16} />
            Nueva meta
          </button>
        </div>
        <div className="goals-grid">
          {wallet.goals
            .filter((g) => g.mode === "practice")
            .map((g) => (
              <GoalCard
                key={g.id}
                wallet={wallet}
                goal={g}
                store={store}
                notify={notify}
              />
            ))}
          {!wallet.goals.length && (
            <div className="empty-state">
              <Target />
              <h3>¿Qué te gustaría lograr?</h3>
              <p>Crea tu primera meta y empieza con un pequeño paso.</p>
            </div>
          )}
        </div>
        <div className="wallet-guidance">
          <ShieldCheck size={16} />
          <span>
            {wallet.paused
              ? "Wallet de práctica en pausa."
              : wallet.approvalRequired
                ? "Gastos con aprobación de la persona responsable."
                : "Gastos de práctica sin aprobación."}{" "}
            Límite por gasto: {formatMoney(wallet.spendingLimit)}.
          </span>
        </div>
      </section>
      {action && (
        <WalletActionModal
          key={`${wallet.id}-${action}`}
          wallet={wallet}
          action={action}
          store={store}
          onClose={() => setAction(null)}
          notify={notify}
        />
      )}
      {rules && (
        <Modal
          title={`Acompaña a ${wallet.name}`}
          onClose={() => setRules(false)}
        >
          <p className="muted modal-intro">
            Reglas para su dinero de práctica. Las operaciones Solana siempre
            necesitan tu firma.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                store.updateWallet(wallet.id, {
                  spendingLimit: Number(limit),
                  approvalRequired: approve,
                  paused,
                });
                setRules(false);
                notify("Reglas de acompañamiento actualizadas.");
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "No se pudo guardar.",
                );
              }
            }}
          >
            <label className="field">
              Límite por gasto de práctica (B)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={approve}
                onChange={(e) => setApprove(e.target.checked)}
              />
              Pedir mi aprobación antes de descontar gastos
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
              />
              Pausar las acciones de práctica de esta wallet
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="button button-primary full-width" type="submit">
              Guardar reglas
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
