import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  completeMissionState,
  createGoalState,
  createInitialState,
  createWalletState,
  isAppState,
  purchaseState,
  reviewTransactionState,
  saveToGoalState,
  topUpState,
  updateWalletState,
} from "./domain";
import type { AppState, Mode, NewWallet, StoreAPI, Wallet } from "./types";

export const STORAGE_KEY = "brote-demo-v1";
const StoreContext = createContext<StoreAPI | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppState(parsed)) return parsed;
    }
  } catch {
    // A blocked or malformed localStorage entry should not prevent the demo from opening.
  }
  return createInitialState();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const current = useRef(state);
  current.current = state;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Storage may be unavailable or full; keep the in-memory store usable. */
    }
  }, [state]);

  const commit = useCallback((mutate: (state: AppState) => AppState) => {
    const next = mutate(current.current);
    current.current = next;
    setState(next);
  }, []);

  const createWallet = useCallback((input: NewWallet): Wallet => {
    const result = createWalletState(current.current, input);
    current.current = result.state;
    setState(result.state);
    return result.wallet;
  }, []);

  const api: StoreAPI = {
    state,
    createWallet,
    topUp: (walletId, amount, mode: Mode) =>
      commit((s) => topUpState(s, walletId, amount, mode)),
    purchase: (walletId, title, category, amount, mode: Mode) =>
      commit((s) => purchaseState(s, walletId, title, category, amount, mode)),
    saveToGoal: (walletId, goalId, amount) =>
      commit((s) => saveToGoalState(s, walletId, goalId, amount)),
    createGoal: (walletId, title, target, mode: Mode) =>
      commit((s) => createGoalState(s, walletId, title, target, mode)),
    completeMission: (walletId, missionId, xp, reward) =>
      commit((s) => completeMissionState(s, walletId, missionId, xp, reward)),
    reviewTransaction: (transactionId, approve) =>
      commit((s) => reviewTransactionState(s, transactionId, approve)),
    updateWallet: (walletId, changes) =>
      commit((s) => updateWalletState(s, walletId, changes)),
    resetDemo: () => {
      const fresh = createInitialState();
      current.current = fresh;
      setState(fresh);
    },
  };
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreAPI {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error(
      "Este espacio necesita estar dentro del proveedor de la aplicación.",
    );
  return store;
}
