export type Position = Readonly<{ x: number; y: number }>;
export type ProductId = "bread" | "milk" | "fruit" | "rice" | "beans" | "bus" | "notebook" | "pencil" | "water" | "sticker" | "sweet";
export type Offer = Readonly<{ id: string; product: ProductId; price: number; x: number; y: number; icon: string; vendor: string }>;
export type Round = Readonly<{ id: string; budget: number; required: readonly ProductId[]; offers: readonly Offer[] }>;

const positions: readonly Position[] = [
  { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 2 },
  { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 1, y: 3 }, { x: 3, y: 3 },
];
const offer = (id: string, product: ProductId, price: number, slot: number, icon: string, vendor: string): Offer => ({
  id, product, price, ...positions[slot], icon, vendor,
});

export const MARKET_WIDTH = 5;
export const MARKET_HEIGHT = 4;
export const CHECKOUT: Position = { x: 4, y: 3 };
export const START: Position = { x: 0, y: 3 };
export const ROUNDS: readonly Round[] = [
  {
    id: "picnic", budget: 12, required: ["bread", "milk", "fruit"], offers: [
      offer("r1-bread", "bread", 4, 0, "🥖", "Panadería"),
      offer("r1-milk", "milk", 4, 1, "🥛", "Lácteos"),
      offer("r1-fruit", "fruit", 3, 2, "🍎", "Frutería"),
      offer("r1-bread-kiosk", "bread", 6, 3, "🥖", "Kiosco"),
      offer("r1-milk-kiosk", "milk", 5, 4, "🥛", "Kiosco"),
      offer("r1-fruit-kiosk", "fruit", 4, 5, "🍎", "Kiosco"),
      offer("r1-sticker", "sticker", 4, 6, "✨", "Regalos"),
      offer("r1-sweet", "sweet", 3, 7, "🍬", "Dulces"),
    ],
  },
  {
    id: "school", budget: 16, required: ["notebook", "pencil", "bus"], offers: [
      offer("r2-notebook", "notebook", 6, 0, "📒", "Papelería"),
      offer("r2-pencil", "pencil", 3, 1, "✏️", "Lápices"),
      offer("r2-bus", "bus", 5, 2, "🚌", "Transporte"),
      offer("r2-notebook-kiosk", "notebook", 8, 3, "📒", "Kiosco"),
      offer("r2-pencil-kiosk", "pencil", 4, 4, "✏️", "Kiosco"),
      offer("r2-bus-kiosk", "bus", 6, 5, "🚌", "Kiosco"),
      offer("r2-sticker", "sticker", 3, 6, "✨", "Regalos"),
      offer("r2-sweet", "sweet", 3, 7, "🍬", "Dulces"),
    ],
  },
  {
    id: "dinner", budget: 17, required: ["rice", "beans", "water"], offers: [
      offer("r3-rice", "rice", 6, 0, "🍚", "Granos"),
      offer("r3-beans", "beans", 5, 1, "🫘", "Legumbres"),
      offer("r3-water", "water", 3, 2, "💧", "Bebidas"),
      offer("r3-rice-kiosk", "rice", 8, 3, "🍚", "Kiosco"),
      offer("r3-beans-kiosk", "beans", 6, 4, "🫘", "Kiosco"),
      offer("r3-water-kiosk", "water", 4, 5, "💧", "Kiosco"),
      offer("r3-sweet", "sweet", 4, 6, "🍬", "Dulces"),
      offer("r3-sticker", "sticker", 3, 7, "✨", "Regalos"),
    ],
  },
];

export type Feedback = "ready" | "moved" | "stall" | "checkout" | "bought" | "refunded" | "already" | "noMoney" | "missing" | "notHere" | "roundDone" | "won";
export type MarketState = Readonly<{
  phase: "intro" | "playing" | "roundCleared" | "won";
  roundIndex: number;
  position: Position;
  cart: readonly string[];
  results: readonly { roundId: string; remaining: number }[];
  feedback: Feedback;
  revision: number;
}>;
export type MarketAction =
  | { type: "START" }
  | { type: "MOVE"; dx: number; dy: number }
  | { type: "VISIT"; x: number; y: number }
  | { type: "BUY"; offerId: string }
  | { type: "REFUND"; offerId: string }
  | { type: "CHECKOUT" }
  | { type: "NEXT" }
  | { type: "RESET" };

export const initialMarketState = (): MarketState => ({
  phase: "intro", roundIndex: 0, position: START, cart: [], results: [], feedback: "ready", revision: 0,
});
export const currentRound = (state: MarketState): Round => ROUNDS[state.roundIndex];
export const purchasedOffers = (state: MarketState): Offer[] => currentRound(state).offers.filter((item) => state.cart.includes(item.id));
export const cartTotal = (state: MarketState): number => purchasedOffers(state).reduce((sum, item) => sum + item.price, 0);
export const remaining = (state: MarketState): number => currentRound(state).budget - cartTotal(state);
export const missingProducts = (state: MarketState): ProductId[] => {
  const bought = new Set(purchasedOffers(state).map((item) => item.product));
  return currentRound(state).required.filter((product) => !bought.has(product));
};
export const offerAt = (state: MarketState): Offer | undefined => currentRound(state).offers.find(
  (item) => item.x === state.position.x && item.y === state.position.y,
);
const validCell = (x: number, y: number) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < MARKET_WIDTH && y < MARKET_HEIGHT;
const changed = (state: MarketState, patch: Partial<MarketState>): MarketState => ({ ...state, ...patch, revision: state.revision + 1 });

export function marketReducer(state: MarketState, action: MarketAction): MarketState {
  if (action.type === "RESET") return initialMarketState();
  if (action.type === "START") return state.phase === "intro" ? changed(state, { phase: "playing", feedback: "ready" }) : state;
  if (action.type === "NEXT") {
    if (state.phase !== "roundCleared" || state.roundIndex >= ROUNDS.length - 1) return state;
    return changed(state, { phase: "playing", roundIndex: state.roundIndex + 1, position: START, cart: [], feedback: "ready" });
  }
  if (state.phase !== "playing") return state;

  if (action.type === "MOVE") {
    if (!Number.isInteger(action.dx) || !Number.isInteger(action.dy) || Math.abs(action.dx) + Math.abs(action.dy) !== 1) return state;
    const x = Math.max(0, Math.min(MARKET_WIDTH - 1, state.position.x + action.dx));
    const y = Math.max(0, Math.min(MARKET_HEIGHT - 1, state.position.y + action.dy));
    if (x === state.position.x && y === state.position.y) return state;
    return changed(state, { position: { x, y }, feedback: x === CHECKOUT.x && y === CHECKOUT.y ? "checkout" : "moved" });
  }
  if (action.type === "VISIT") {
    if (!validCell(action.x, action.y)) return state;
    if (!(action.x === CHECKOUT.x && action.y === CHECKOUT.y) && !currentRound(state).offers.some((item) => item.x === action.x && item.y === action.y)) return state;
    return changed(state, { position: { x: action.x, y: action.y }, feedback: action.x === CHECKOUT.x && action.y === CHECKOUT.y ? "checkout" : "stall" });
  }
  if (action.type === "BUY") {
    const item = currentRound(state).offers.find((candidate) => candidate.id === action.offerId);
    if (!item || item.x !== state.position.x || item.y !== state.position.y) return changed(state, { feedback: "notHere" });
    if (purchasedOffers(state).some((candidate) => candidate.product === item.product)) return changed(state, { feedback: "already" });
    if (item.price > remaining(state)) return changed(state, { feedback: "noMoney" });
    return changed(state, { cart: [...state.cart, item.id], feedback: "bought" });
  }
  if (action.type === "REFUND") {
    if (!state.cart.includes(action.offerId)) return state;
    return changed(state, { cart: state.cart.filter((id) => id !== action.offerId), feedback: "refunded" });
  }
  if (action.type === "CHECKOUT") {
    if (state.position.x !== CHECKOUT.x || state.position.y !== CHECKOUT.y) return changed(state, { feedback: "notHere" });
    if (missingProducts(state).length) return changed(state, { feedback: "missing" });
    const results = [...state.results, { roundId: currentRound(state).id, remaining: remaining(state) }];
    return changed(state, { phase: state.roundIndex === ROUNDS.length - 1 ? "won" : "roundCleared", results, feedback: state.roundIndex === ROUNDS.length - 1 ? "won" : "roundDone" });
  }
  return state;
}
