import { useEffect, useReducer, useRef, type KeyboardEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, RotateCcw, ShoppingBasket, Sparkles } from "lucide-react";
import Avatar from "./Avatar";
import { useI18n } from "../i18n";
import { marketMessages } from "../locales/market";
import type { Wallet } from "../types";
import {
  CHECKOUT, ROUNDS, cartTotal, currentRound, initialMarketState, marketReducer,
  missingProducts, offerAt, purchasedOffers, remaining, type ProductId,
} from "../games/market-engine";
import "../games/market.css";

type Props = {
  wallet: Pick<Wallet, "avatar" | "color" | "name">;
  simple: boolean;
  disabled?: boolean;
  onComplete: () => void;
  onReset: () => void;
};

const productNames: Record<ProductId, string> = {
  bread: "Pan", milk: "Leche", fruit: "Fruta", rice: "Arroz", beans: "Caraotas",
  bus: "Pasaje", notebook: "Cuaderno", pencil: "Lápiz", water: "Agua",
  sticker: "Calcomanías", sweet: "Dulce",
};
const roundNames = ["Picnic en el parque", "Camino a clases", "Cena en casa"] as const;

export default function MarketGame({ wallet, simple, disabled = false, onComplete, onReset }: Props) {
  const { language } = useI18n();
  const [state, dispatch] = useReducer(marketReducer, undefined, initialMarketState);
  const root = useRef<HTMLElement>(null);
  const completionSent = useRef(false);
  const previousPhase = useRef(state.phase);
  useEffect(() => {
    if (state.phase === "playing" && previousPhase.current !== "playing") root.current?.focus();
    previousPhase.current = state.phase;
  }, [state.phase]);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  useEffect(() => {
    if (state.phase === "won" && !disabled && !completionSent.current) {
      completionSent.current = true;
      callback.current();
    }
  }, [state.phase, disabled]);

  const msg = (source: string, values: Record<string, string | number> = {}) => {
    const template = language === "es" ? source : marketMessages[source]?.[language] ?? source;
    return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  };
  const product = (id: ProductId) => msg(productNames[id]);
  const money = (amount: number) => msg("{amount} B", { amount });
  const reset = () => {
    if (disabled) return;
    completionSent.current = false;
    dispatch({ type: "RESET" });
    onReset();
  };
  const canPlay = !disabled && state.phase === "playing";
  const live = (() => {
    switch (state.feedback) {
      case "bought": return msg("¡Producto en el carrito! La compra aún es simulada.");
      case "refunded": return msg("Devolución hecha. Recuperaste esos Brotes simulados.");
      case "already": return msg("Ya tienes ese producto. Puedes comparar precios y devolverlo antes de cambiar de puesto.");
      case "noMoney": return msg("Te faltan Brotes para esta compra. Devuelve algo o busca un precio menor.");
      case "missing": return msg("Te falta algo de la lista. Vuelve a los puestos o devuelve un gusto para liberar presupuesto.");
      case "notHere": return msg("Visita el puesto o la caja antes de hacer esa acción.");
      default: return "";
    }
  })();
  const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (!canPlay || !root.current?.getClientRects().length || root.current.closest("[aria-hidden='true'],[inert]")) return;
    const target = event.target as HTMLElement;
    if (target.closest("input,select,textarea,[contenteditable='true']") || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    const direction: Record<string, readonly [number, number]> = {
      arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1],
      arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0],
    };
    const vector = direction[key];
    if (vector) {
      event.preventDefault();
      dispatch({ type: "MOVE", dx: vector[0], dy: vector[1] });
    }
  };

  const round = currentRound(state);
  const basket = purchasedOffers(state);
  const selected = offerAt(state);
  const boughtProduct = new Set(basket.map((item) => item.product));
  const atCheckout = state.position.x === CHECKOUT.x && state.position.y === CHECKOUT.y;

  return <section ref={root} className={`market-game${simple ? " market-simple" : ""}`} aria-label={msg("Mercado aventura")} onKeyDown={handleKeys} tabIndex={-1}>
    <header className="market-head">
      <div className="market-brand"><span className="market-mark"><ShoppingBasket size={21} /></span><div><span className="market-kicker">{msg("UNA AVENTURA DE PRESUPUESTO")}</span><h2>{msg("Mercado aventura")}</h2></div></div>
      {state.phase !== "intro" && <button type="button" className="market-restart" onClick={reset} disabled={disabled}><RotateCcw size={16} />{msg("Reiniciar juego")}</button>}
    </header>

    {disabled && <p className="market-paused" role="status">{msg("Esta pestaña está en modo lectura. El juego estará disponible cuando pueda guardar tu progreso.")}</p>}

    {state.phase === "intro" && <div className="market-intro">
      <div className="market-intro-art"><div className="market-intro-avatar"><Avatar kind={wallet.avatar} color={wallet.color} size={80} /></div><span className="market-intro-spark market-intro-spark-one">✦</span><span className="market-intro-spark market-intro-spark-two">✦</span></div>
      <div className="market-intro-copy"><h3>{msg("¡Vamos de compras, {name}!", { name: wallet.name })}</h3><p>{msg("Recorre el mercado, compara precios y lleva lo que necesitas a la caja. Cada Brote de este juego es simulado.")}</p>
        <div className="market-intro-tags"><span>{msg("3 rondas cortas")}</span><span>{msg("Sin reloj")}</span><span>{msg("Tú decides qué comprar")}</span></div>
        <div className="market-instructions"><strong>{msg("Cómo jugar")}</strong><p>{msg("Muévete con flechas, WASD, los controles o toca un puesto. Mira su precio y pulsa Comprar. Puedes devolver artículos del carrito. Cuando tengas toda la lista, ve a la caja.")}</p></div>
        <button type="button" className="market-primary" onClick={() => dispatch({ type: "START" })} disabled={disabled}>{msg("Empezar aventura")} <ArrowRight size={18} /></button>
      </div>
    </div>}

    {state.phase === "playing" && <>
      <div className="market-round-head"><div><span className="market-round-pill">{msg("Ronda {current} de {total}", { current: state.roundIndex + 1, total: ROUNDS.length })}</span><h3>{msg(roundNames[state.roundIndex])}</h3><p>{msg("Busca lo de la lista y compara puestos antes de pagar.")}</p></div><Avatar kind={wallet.avatar} color={wallet.color} size={54} /></div>
      <div className="market-meter" aria-label={msg("Brotes simulados")}><div><span>{msg("Presupuesto")}</span><strong>{money(round.budget)}</strong></div><div><span>{msg("Gastado")}</span><strong>{money(cartTotal(state))}</strong></div><div className="market-available"><span>{msg("Disponible")}</span><strong>{money(remaining(state))}</strong></div></div>
      <div className="market-list"><strong>{msg("Lista de compras")}</strong><div>{round.required.map((id) => <span key={id} className={boughtProduct.has(id) ? "is-done" : ""} aria-label={msg(boughtProduct.has(id) ? "Conseguido: {product}" : "Pendiente: {product}", { product: product(id) })}>{boughtProduct.has(id) ? <Check size={13} /> : <span className="market-list-dot" />}{product(id)}</span>)}</div></div>
      <div className="market-play-area">
        <div className="market-board-wrap"><div className="market-board" aria-label={msg("Tablero del mercado")}>
          {round.offers.map((item) => <button key={item.id} type="button" className={`market-stall${selected?.id === item.id ? " is-current" : ""}${boughtProduct.has(item.product) ? " is-bought" : ""}`} style={{ gridColumn: item.x + 1, gridRow: item.y + 1 }} onClick={() => dispatch({ type: "VISIT", x: item.x, y: item.y })} disabled={!canPlay} aria-label={msg("Visitar {vendor}: {product}, {price} Brotes simulados", { vendor: msg(item.vendor), product: product(item.product), price: item.price })} aria-pressed={selected?.id === item.id}><span className="market-stall-roof" /><span className="market-stall-icon" aria-hidden="true">{item.icon}</span><span className="market-stall-price">{money(item.price)}</span></button>)}
          <button type="button" className={`market-checkout${atCheckout ? " is-current" : ""}`} style={{ gridColumn: 5, gridRow: 4 }} onClick={() => dispatch({ type: "VISIT", ...CHECKOUT })} disabled={!canPlay} aria-label={msg("Ir a la caja")}>🛎️<small>{msg("Caja")}</small></button>
          <div className="market-player" style={{ left: `${(state.position.x + .5) * 20}%`, top: `${(state.position.y + .5) * 25}%` }} aria-hidden="true"><Avatar kind={wallet.avatar} color={wallet.color} size={38} /></div>
        </div>
        <div className="market-controls"><div><span className="market-controls-label">{msg("Moverse")}</span><p>{msg("Usa flechas o WASD. También puedes tocar un puesto para viajar hasta allí.")}</p></div><div className="market-dpad"><button type="button" aria-label={msg("Mover arriba")} onClick={() => dispatch({ type: "MOVE", dx: 0, dy: -1 })} disabled={!canPlay}><ArrowUp size={18} /></button><button type="button" aria-label={msg("Mover izquierda")} onClick={() => dispatch({ type: "MOVE", dx: -1, dy: 0 })} disabled={!canPlay}><ArrowLeft size={18} /></button><button type="button" aria-label={msg("Mover abajo")} onClick={() => dispatch({ type: "MOVE", dx: 0, dy: 1 })} disabled={!canPlay}><ArrowDown size={18} /></button><button type="button" aria-label={msg("Mover derecha")} onClick={() => dispatch({ type: "MOVE", dx: 1, dy: 0 })} disabled={!canPlay}><ArrowRight size={18} /></button></div></div>
        </div>
        <div className="market-sidebar">
          <div className="market-detail">
            {atCheckout ? <><span className="market-card-label">{msg("Caja")}</span><div className="market-detail-main"><span className="market-detail-emoji">🛎️</span><div><h4>{msg("Revisar compra")}</h4><p>{msg("Lista de compras")}: {round.required.length - missingProducts(state).length}/{round.required.length}</p></div></div><button type="button" className="market-primary market-wide" onClick={() => dispatch({ type: "CHECKOUT" })} disabled={!canPlay}>{msg("Revisar compra")} <ArrowRight size={16} /></button></> : selected ? <><span className="market-card-label">{msg("Puesto actual")} · {msg(selected.vendor)}</span><div className="market-detail-main"><span className="market-detail-emoji">{selected.icon}</span><div><h4>{product(selected.product)}</h4><p>{msg(round.required.includes(selected.product) ? "Necesidad" : "Gusto")} · {money(selected.price)}</p></div></div>{boughtProduct.has(selected.product) && <p className="market-detail-note">{state.cart.includes(selected.id) ? msg("En el carrito") : msg("Ya llevas este producto de otro puesto.")}</p>}<button type="button" className="market-primary market-wide" onClick={() => dispatch({ type: "BUY", offerId: selected.id })} disabled={!canPlay || boughtProduct.has(selected.product)}>{msg("Comprar por {price} B", { price: selected.price })} <ArrowRight size={16} /></button></> : <><span className="market-card-label">{msg("Puesto actual")}</span><p>{msg("Elige un puesto para ver su oferta.")}</p></>}
          </div>
          <div className="market-cart"><span className="market-card-label"><ShoppingBasket size={15} />{msg("Tu carrito")}</span>{basket.length ? <ul>{basket.map((item) => <li key={item.id}><span>{item.icon} {product(item.product)} <small>{money(item.price)}</small></span><button type="button" onClick={() => dispatch({ type: "REFUND", offerId: item.id })} disabled={!canPlay} aria-label={msg("Devolver {product} y recuperar {price} B", { product: product(item.product), price: item.price })}>{msg("Devolver")}</button></li>)}</ul> : <p>{msg("Todavía está vacío. Explora los puestos.")}</p>}</div>
        </div>
      </div>

      <p className="market-feedback" role="status" aria-live="polite" key={state.revision}>{live || "\u00a0"}</p>
    </>}

    {state.phase === "roundCleared" && <div className="market-celebrate"><span className="market-celebrate-icon"><Sparkles size={36} /></span><span className="market-round-pill">{msg("Ronda {current} de {total}", { current: state.roundIndex + 1, total: ROUNDS.length })}</span><h3>{msg("¡Ronda superada!")}</h3><p>{msg("Cubriste lo necesario y te quedaron {amount} B simulados. Comparar precios deja espacio para elegir.", { amount: remaining(state) })}</p><button type="button" className="market-primary" onClick={() => dispatch({ type: "NEXT" })} disabled={disabled}>{msg("Siguiente ronda")} <ArrowRight size={18} /></button></div>}

    {state.phase === "won" && <div className="market-celebrate market-finale"><span className="market-celebrate-icon"><Sparkles size={38} /></span><h3>{msg("¡Aventura completada!")}</h3><p>{msg("Compraste lo importante en las tres rondas sin superar el presupuesto.")}</p><div className="market-results"><strong>{msg("Resumen de tu viaje")}</strong>{state.results.map((result, index) => <div key={result.roundId}><span>{msg(roundNames[index])}</span><b>{msg("Sobraron {amount} B", { amount: result.remaining })}</b></div>)}<div className="market-results-total"><span>{msg("Total sin gastar: {amount} B simulados", { amount: state.results.reduce((sum, result) => sum + result.remaining, 0) })}</span></div></div><button type="button" className="market-primary" onClick={reset} disabled={disabled}>{msg("Jugar otra vez")} <RotateCcw size={17} /></button></div>}
  </section>;
}
