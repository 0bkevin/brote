/** All amounts are fictional island coins. This engine never reads or writes a wallet. */
export const ISLAND = {
  days: 4,
  wage: 9,
  needs: 4,
  reserveDeposit: 3,
  stormCost: 3,
  bridgeDeposit: 3,
  bridgeGoal: 12,
  decorationCost: 2,
} as const;

export type IslandAction =
  | "work"
  | "needs"
  | "reserve"
  | "bridge"
  | "decorate"
  | "repair"
  | "next"
  | "restart";

export interface IslandState {
  day: number;
  coins: number;
  reserve: number;
  bridge: number;
  worked: boolean;
  needsPaid: boolean;
  decoratedDays: number[];
  stormRepaired: boolean;
  won: boolean;
  notice: string;
  event: IslandAction | "start";
  revision: number;
}

export function createIslandGame(): IslandState {
  return {
    day: 1,
    coins: 0,
    reserve: 0,
    bridge: 0,
    worked: false,
    needsPaid: false,
    decoratedDays: [],
    stormRepaired: false,
    won: false,
    notice: "Un puente llevará al jardín del tesoro. Trabaja y decide qué cuidar primero.",
    event: "start",
    revision: 0,
  };
}

/** Returns a disposer so visual feedback cannot update a game after unmount. */
export function scheduleIslandPulse(clear: () => void, delay = 850): () => void {
  const timeout = globalThis.setTimeout(clear, delay);
  return () => globalThis.clearTimeout(timeout);
}

function reply(state: IslandState, notice: string): IslandState {
  return { ...state, notice };
}

function changed(state: IslandState, action: IslandAction, changes: Partial<IslandState>, notice: string): IslandState {
  return { ...state, ...changes, notice, event: action, revision: state.revision + 1 };
}

function spendableToday(state: IslandState): number {
  return Math.max(0, state.coins - (state.needsPaid ? 0 : ISLAND.needs));
}

function decorationFitsPlan(state: IslandState): boolean {
  const futureIncome = (ISLAND.days - state.day) * ISLAND.wage + (state.worked ? 0 : ISLAND.wage);
  const remainingNeeds = (ISLAND.days - state.day) * ISLAND.needs + (state.needsPaid ? 0 : ISLAND.needs);
  const stormGap = state.stormRepaired ? 0 : Math.max(0, ISLAND.stormCost - state.reserve);
  const remainingBridge = ISLAND.bridgeGoal - state.bridge;
  return state.coins + futureIncome - remainingNeeds - stormGap - remainingBridge >= ISLAND.decorationCost;
}

/** Pure, fixed-price transitions; invalid or repeated actions leave all game money unchanged. */
export function playIsland(state: IslandState, action: IslandAction): IslandState {
  if (action === "restart") return createIslandGame();
  if (state.won) return reply(state, "¡El jardín ya está abierto! Puedes jugar otra vez.");

  switch (action) {
    case "work":
      if (state.worked) return reply(state, "Ya hiciste el trabajo de hoy. Mañana habrá otro encargo.");
      return changed(state, action, { coins: state.coins + ISLAND.wage, worked: true }, "¡Encargo terminado! Ganaste 9 monedas de juego.");
    case "needs":
      if (state.needsPaid) return reply(state, "Las necesidades de hoy ya están cubiertas.");
      if (state.coins < ISLAND.needs) return reply(state, "Faltan monedas. Trabaja primero en el muelle.");
      return changed(state, action, { coins: state.coins - ISLAND.needs, needsPaid: true }, "Comida y materiales listos para hoy.");
    case "reserve":
      if (state.coins < ISLAND.reserveDeposit) return reply(state, "Necesitas 3 monedas de juego para la reserva.");
      if (spendableToday(state) < ISLAND.reserveDeposit) return reply(state, "Primero deja 4 monedas para las necesidades de hoy.");
      if (state.reserve >= ISLAND.stormCost || state.stormRepaired) return reply(state, "La reserva para esta tormenta ya está lista.");
      return changed(state, action, { coins: state.coins - ISLAND.reserveDeposit, reserve: ISLAND.stormCost }, "Guardaste 3 monedas para un imprevisto.");
    case "bridge":
      if (state.bridge >= ISLAND.bridgeGoal) return reply(state, "El puente ya tiene todas sus piezas.");
      if (state.coins < ISLAND.bridgeDeposit) return reply(state, "Necesitas 3 monedas de juego para construir otra pieza.");
      if (spendableToday(state) < ISLAND.bridgeDeposit) return reply(state, "Primero deja 4 monedas para las necesidades de hoy.");
      return changed(state, action, { coins: state.coins - ISLAND.bridgeDeposit, bridge: Math.min(ISLAND.bridgeGoal, state.bridge + ISLAND.bridgeDeposit) }, "¡Una pieza más del puente apareció en la isla!");
    case "decorate":
      if (state.decoratedDays.includes(state.day)) return reply(state, "Ya elegiste un adorno para hoy.");
      if (state.coins < ISLAND.decorationCost) return reply(state, "No alcanzan las monedas para un adorno. Puede esperar.");
      if (spendableToday(state) < ISLAND.decorationCost) return reply(state, "Primero deja 4 monedas para las necesidades de hoy.");
      if (!decorationFitsPlan(state)) return reply(state, "Ese adorno quitaría monedas necesarias para el puente o la tormenta. Elige otro día.");
      return changed(state, action, { coins: state.coins - ISLAND.decorationCost, decoratedDays: [...state.decoratedDays, state.day] }, "¡Qué bonito! Un adorno nuevo llegó a la isla.");
    case "repair":
      if (state.day !== 3) return reply(state, "La lluvia llegará el día 3.");
      if (state.stormRepaired) return reply(state, "El sendero ya está reparado.");
      if (state.reserve < ISLAND.stormCost) return reply(state, "La tormenta cuesta 3 monedas de la reserva. Puedes llenarla en el banco.");
      return changed(state, action, { reserve: state.reserve - ISLAND.stormCost, stormRepaired: true }, "¡La reserva cubrió la reparación! Tu puente sigue a salvo.");
    case "next":
      if (!state.worked || !state.needsPaid) return reply(state, "Antes de seguir, trabaja y cubre las necesidades de hoy.");
      if (state.day === 3 && !state.stormRepaired) return reply(state, "Repara el sendero con la reserva antes de seguir.");
      if (state.day === ISLAND.days) {
        if (state.bridge < ISLAND.bridgeGoal) return reply(state, "Faltan piezas del puente. Ahórralas en el banco; si gastaste de más, empieza una nueva aventura.");
        return changed(state, action, { won: true }, "¡Llegaste al jardín del tesoro! Cuidaste lo esencial y preparaste un imprevisto.");
      }
      return changed(state, action, { day: state.day + 1, worked: false, needsPaid: false },
        state.day === 2
          ? "Día 3: llegó una tormenta. Usa tu reserva para reparar el sendero."
          : "¡Amanece un nuevo día! Hay trabajo en el muelle.");
    default:
      return reply(state, "Acción no válida.");
  }
}
