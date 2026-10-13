import { useEffect, useRef, useState } from "react";
import { ArrowRight, Banknote, Check, CloudRain, Coins, Hammer, Heart, LockKeyhole, RotateCcw, Sparkles, TreePine, Utensils } from "lucide-react";
import type { Wallet } from "../types";
import { useI18n } from "../i18n";
import Avatar from "./Avatar";
import { createIslandGame, ISLAND, playIsland, scheduleIslandPulse, type IslandAction } from "../games/island-engine";
import "../games/island.css";

type Props = {
  wallet: Pick<Wallet, "avatar" | "color" | "name">;
  simple: boolean;
  disabled?: boolean;
  onComplete: () => void;
  onReset: () => void;
};

const stations = [
  { id: "work", label: "Muelle", icon: Coins, action: "Trabajar · +9" },
  { id: "needs", label: "Mercado", icon: Utensils, action: "Cubrir lo esencial · −4" },
  { id: "reserve", label: "Refugio", icon: Heart, action: "Guardar reserva · −3" },
  { id: "bridge", label: "Banco del puente", icon: Banknote, action: "Guardar para el puente · −3" },
  { id: "decorate", label: "Jardín", icon: TreePine, action: "Poner un adorno · −2" },
] as const;

function elementIsVisible(element: HTMLElement | null): boolean {
  if (!element || !element.getClientRects().length) return false;
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (node.hidden || node.inert || node.getAttribute("aria-hidden") === "true") return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  }
  return true;
}

export default function IslandGame({ wallet, simple, disabled = false, onComplete, onReset }: Props) {
  const { t } = useI18n();
  const [game, setGame] = useState(createIslandGame);
  const [pulse, setPulse] = useState<IslandAction | null>(null);
  const root = useRef<HTMLElement>(null);
  const completedRevision = useRef<number | null>(null);

  useEffect(() => {
    if (!game.won || disabled || completedRevision.current === game.revision) return;
    completedRevision.current = game.revision;
    onComplete();
  }, [game.won, game.revision, disabled, onComplete]);

  useEffect(() => {
    if (game.event === "start" || game.event === "restart") return;
    setPulse(game.event);
    return scheduleIslandPulse(() => setPulse(null));
  }, [game.revision, game.event]);

  function act(action: IslandAction) {
    if (disabled || !elementIsVisible(root.current)) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== root.current && !root.current?.contains(active) &&
      active.matches("input, textarea, select, [contenteditable='true']")) return;
    if (action === "restart") {
      completedRevision.current = null;
      setGame(() => createIslandGame());
      setPulse(null);
      onReset();
      return;
    }
    setGame(previous => playIsland(previous, action));
  }

  const pieces = game.bridge / ISLAND.bridgeDeposit;
  const storm = game.day === 3 && !game.stormRepaired;
  const nextLabel = game.day === ISLAND.days ? "Abrir el jardín" : "Siguiente día";
  const nextReady = game.worked && game.needsPaid && !storm &&
    (game.day < ISLAND.days || game.bridge >= ISLAND.bridgeGoal);
  const allow = !disabled;

  return (
    <section ref={root} className={`island-game${simple ? " island-simple" : ""}${game.won ? " island-won" : ""}`} aria-label={t("Isla de las metas")}>
      {disabled && <p className="island-story" role="status">{t("Esta pestaña está en modo lectura. El juego estará disponible cuando pueda guardar tu progreso.")}</p>}
      <div className="island-heading">
        <div>
          <p className="island-eyebrow">{t("AVENTURA DE 4 DÍAS")}</p>
          <h2>{t("Isla de las metas")}</h2>
          <p>{t("Trabaja, cuida lo necesario y construye un puente hasta el jardín del tesoro.")}</p>
        </div>
        <div className="island-day" aria-label={`${t("Día")} ${game.day} ${t("de")} ${ISLAND.days}`}>
          <span>{t("Día")}</span><strong>{game.day}<small>/{ISLAND.days}</small></strong>
        </div>
      </div>

      <div className="island-stats" aria-label={t("Monedas del juego")}>
        <div role="group" aria-label={`${t("Para usar")}: ${game.coins}`}><Coins size={19} aria-hidden="true" /><span>{t("Para usar")}</span><strong>{game.coins}</strong></div>
        <div role="group" aria-label={`${t("Reserva")}: ${game.reserve}/${ISLAND.stormCost}`}><Heart size={19} aria-hidden="true" /><span>{t("Reserva")}</span><strong>{game.reserve}/{ISLAND.stormCost}</strong></div>
        <div role="group" aria-label={`${t("Puente")}: ${game.bridge}/${ISLAND.bridgeGoal}`}><Hammer size={19} aria-hidden="true" /><span>{t("Puente")}</span><strong>{game.bridge}/{ISLAND.bridgeGoal}</strong></div>
      </div>
      <p className="island-currency-note">{t("Monedas ficticias de esta isla. No cambian el saldo de tu billetera.")}</p>

      <div className={`island-scene${storm ? " island-raining" : ""}${pulse ? ` island-pulse-${pulse}` : ""}`}>
        <div className="island-sky" aria-hidden="true"><span className="island-sun" />{storm && <CloudRain className="island-cloud" size={54} />}</div>
        <div className="island-water" aria-hidden="true" />
        <div className="island-land island-land-main" aria-hidden="true" />
        <div className="island-land island-land-garden" aria-hidden="true" />
        <div className="island-bridge" aria-label={`${t("Piezas del puente")} ${pieces} ${t("de")} 4`}>
          {[0, 1, 2, 3].map(index => <span key={index} className={index < pieces ? "is-built" : ""} />)}
        </div>
        <div className="island-companion" aria-hidden="true"><Avatar kind={wallet.avatar} color={wallet.color} size={58} /></div>
        {game.decoratedDays.map(day => <span key={day} className={`island-flower island-flower-${day}`} aria-hidden="true">✿</span>)}
        <div className="island-goal-marker" aria-hidden="true">{game.won ? "✦" : "✧"}</div>
        <div className="island-map-actions">
          {stations.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={`island-pin island-pin-${id}`} onClick={() => act(id)} disabled={!allow || game.won} title={t(label)} aria-label={`${t(label)}: ${t(stations.find(station => station.id === id)!.action)}`}>
            <Icon size={20} aria-hidden="true" /><span>{t(label)}</span>
          </button>)}
          {storm && <button type="button" className="island-pin island-pin-repair" onClick={() => act("repair")} disabled={!allow} aria-label={t("Reparar sendero con la reserva")}> <CloudRain size={20} aria-hidden="true" /><span>{t("Reparar")}</span></button>}
        </div>
        {pulse && !simple && <span key={game.revision} className="island-coin-burst" aria-hidden="true">✦ ✦ ✦</span>}
      </div>

      <div className="island-guide">
        <div className="island-story" role="status" aria-live="polite">
          <Sparkles size={20} aria-hidden="true" /><span>{t(game.notice)}</span>
        </div>
        {storm && <p className="island-storm-note"><CloudRain size={18} aria-hidden="true" />{t(game.reserve >= ISLAND.stormCost ? "Tu reserva está lista. Úsala para reparar el sendero." : "La tormenta rompió el sendero. Guarda 3 en la reserva y repáralo.")}</p>}
        <div className="island-checks">
          <span className={game.worked ? "is-done" : ""}><Check size={16} />{t("Trabajo")}</span>
          <span className={game.needsPaid ? "is-done" : ""}><Check size={16} />{t("Necesidades")}</span>
          <span className={game.stormRepaired ? "is-done" : ""}><Check size={16} />{t("Tormenta")}</span>
        </div>
      </div>

      <div className="island-actions" aria-label={t("Acciones de la isla")}>
        {stations.map(({ id, action, icon: Icon }) => <button key={id} type="button" className={`island-action island-action-${id}`} onClick={() => act(id)} disabled={!allow || game.won}>
          <Icon size={19} aria-hidden="true" /><span>{t(action)}</span>
        </button>)}
        {storm && <button type="button" className="island-action island-action-repair" onClick={() => act("repair")} disabled={!allow}><CloudRain size={19} aria-hidden="true" /><span>{t("Reparar sendero · reserva −3")}</span></button>}
      </div>
      <p className="island-lock-note"><LockKeyhole size={15} aria-hidden="true" />{t("Lo que guardas para el puente queda reservado.")}</p>

      <div className="island-footer">
        <button type="button" className="island-restart" onClick={() => act("restart")} disabled={!allow}><RotateCcw size={18} />{game.won ? t("Jugar otra vez") : t("Reiniciar isla")}</button>
        {!game.won && <button type="button" className="island-next" onClick={() => act("next")} disabled={!allow} aria-describedby="island-next-hint">
          {t(nextLabel)} <ArrowRight size={19} aria-hidden="true" />
        </button>}
      </div>
      {!game.won && <p id="island-next-hint" className="island-next-hint">{nextReady ? t("Puedes avanzar cuando quieras.") : game.day === ISLAND.days && game.worked && game.needsPaid && game.bridge < ISLAND.bridgeGoal ? t("Para abrir el jardín, termina el puente en el banco.") : t("Para avanzar: trabaja, cubre necesidades y repara la tormenta si llegó.")}</p>}
      {game.won && <div className="island-victory" role="status"><Sparkles size={26} aria-hidden="true" /><strong>{t("¡El jardín del tesoro está abierto!")}</strong><span>{t("Planeaste cada día, cuidaste lo esencial y usaste tu reserva cuando llegó la tormenta.")}</span></div>}
    </section>
  );
}
