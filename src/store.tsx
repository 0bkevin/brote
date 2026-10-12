import {
  createContext,
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
  purchaseState,
  reviewTransactionState,
  saveToGoalState,
  topUpState,
  updateWalletState,
} from "./domain";
import { DurableStore, STORAGE_KEY, startWriterLease } from "./persistence";
import type { AppState, Mode, NewWallet, PersistenceStatus, StoreAPI, Wallet } from "./types";

export { STORAGE_KEY } from "./persistence";
const StoreContext = createContext<StoreAPI | null>(null);

function browserStorage(): Pick<Storage, "getItem" | "setItem"> {
  try { if (typeof window !== "undefined") return window.localStorage; }
  catch { /* Access to the storage object itself can be blocked. */ }
  return {
    getItem: () => { throw Error("Storage unavailable"); },
    setItem: () => { throw Error("Storage unavailable"); },
  };
}

function statusFrom(store: DurableStore, writable: boolean, loading = false): PersistenceStatus {
  const { error, corruptRaw } = store.snapshot;
  return { loading, writable: writable && !error && corruptRaw === null, error, corruptRaw };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const durableRef = useRef<DurableStore | null>(null);
  if (!durableRef.current) durableRef.current = new DurableStore(browserStorage());
  const durable = durableRef.current;
  const writerRef = useRef(false);
  const [state, setState] = useState<AppState>(() => durable.snapshot.state);
  const [persistence, setPersistence] = useState<PersistenceStatus>(() =>
    statusFrom(durable, false, true),
  );

  useEffect(() => {
    let active = true;
    let stopLease: (() => void) | null = null;
    writerRef.current = false;
    setPersistence(statusFrom(durable, false, true));
    const sync = () => {
      if (!active) return;
      const wasWriter = writerRef.current;
      writerRef.current = false;
      if (wasWriter) stopLease?.();
      const loaded = durable.refresh();
      setState(loaded.state);
      setPersistence({
        ...statusFrom(durable, false),
        error: wasWriter
          ? "Los datos cambiaron fuera de esta pestaña. Recarga antes de continuar."
          : loaded.error,
      });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    if (!navigator.locks?.request) {
      setPersistence({
        ...statusFrom(durable, false), loading: false,
        error: "Este navegador no permite coordinar pestañas con Web Locks. Abre Brote en un navegador compatible para guardar cambios.",
      });
      return () => { active = false; window.removeEventListener("storage", onStorage); };
    }
    stopLease = startWriterLease(
      navigator.locks.request.bind(navigator.locks),
      () => {
        if (!active) return;
        let loaded = durable.refresh();
        writerRef.current = true;
        if (loaded.raw === null && loaded.error === null) {
          try { loaded = durable.replace(loaded.state); }
          catch (error) {
            setPersistence({
              ...statusFrom(durable, false),
              error: error instanceof Error ? error.message : "No pudimos guardar los datos iniciales.",
            });
            return;
          }
        }
        setState(loaded.state);
        setPersistence(statusFrom(durable, true));
      },
      () => {
        if (active) setPersistence({
          ...statusFrom(durable, false), loading: false,
          error: "Otra pestaña de Brote está editando estos datos. Esta pestaña se actualizará y podrá editar cuando la otra se cierre.",
        });
      },
      () => {
        if (active) setPersistence({
          ...statusFrom(durable, false), loading: false,
          error: "No pudimos obtener acceso exclusivo a los datos de este navegador.",
        });
      },
    );
    return () => {
      active = false;
      writerRef.current = false;
      stopLease?.();
      window.removeEventListener("storage", onStorage);
    };
  }, [durable]);

  function requireWriter() {
    if (!writerRef.current)
      throw Error("Esta pestaña está en modo lectura. Cierra la otra pestaña de Brote o recarga antes de editar.");
  }
  function save(next: AppState, allowCorrupt = false) {
    requireWriter();
    try {
      const loaded = durable.replace(next, allowCorrupt);
      setState(loaded.state);
      setPersistence(statusFrom(durable, true));
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos guardar los datos.";
      setPersistence({ ...statusFrom(durable, false), error: message });
      throw error;
    }
  }
  function commit(mutate: (state: AppState) => AppState) {
    requireWriter();
    save(mutate(durable.snapshot.state));
  }

  const api: StoreAPI = {
    state,
    persistence,
    assertWriter: requireWriter,
    assertDurableWallet: (walletId) => {
      requireWriter();
      durable.assertDurableWallet(walletId);
    },
    recordGuardianBase: (walletId, address) => {
      commit((current) => {
        if (!current.wallets.some((wallet) => wallet.id === walletId))
          throw Error("Este perfil ya no existe.");
        const bases = current.guardianBases ?? [];
        if (bases.some((base) => base.walletId === walletId && base.address === address))
          return current;
        return { ...current, guardianBases: [...bases, { walletId, address }] };
      });
    },
    restoreBackup: (backupState) => save(backupState, true),
    replaceCorruptWithSeed: () => {
      requireWriter();
      const loaded = durable.replaceCorruptWithSeed();
      setState(loaded.state);
      setPersistence(statusFrom(durable, true));
    },
    createWallet: (input: NewWallet): Wallet => {
      requireWriter();
      const result = createWalletState(durable.snapshot.state, input);
      save(result.state);
      return result.wallet;
    },
    topUp: (walletId, amount, mode: Mode) => commit((s) => topUpState(s, walletId, amount, mode)),
    purchase: (walletId, title, category, amount, mode: Mode) =>
      commit((s) => purchaseState(s, walletId, title, category, amount, mode)),
    saveToGoal: (walletId, goalId, amount) => commit((s) => saveToGoalState(s, walletId, goalId, amount)),
    createGoal: (walletId, title, target, mode: Mode) =>
      commit((s) => createGoalState(s, walletId, title, target, mode)),
    completeMission: (walletId, missionId, xp, reward) =>
      commit((s) => completeMissionState(s, walletId, missionId, xp, reward)),
    reviewTransaction: (transactionId, approve) =>
      commit((s) => reviewTransactionState(s, transactionId, approve)),
    updateWallet: (walletId, changes) => commit((s) => updateWalletState(s, walletId, changes)),
    resetDemo: () => save(createInitialState()),
  };
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreAPI {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Este espacio necesita estar dentro del proveedor de la aplicación.");
  return store;
}
