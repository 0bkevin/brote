import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { Wallet } from "./types";
import { translate } from "./i18n-core";
import { useStore } from "./store";
import { hasRentExemptDestinationBalance, hasValidSystemAccountRemainder, parseSolLamports, seedFor } from "./solana-utils";
import { ConnectionRequests, WrongSolanaClusterError, mergeVerifiedReads, retryReadOnVerifiedFallback, verifySolanaConnection } from "./solana-connection";
import { SOLANA_NETWORK } from "./solana-network";
import {
  OperationJournal,
  SigningSession,
  assertFinalTransactionFunds,
  estimateTransactionFee,
  rebroadcastSignedOperation,
  reconcileOperation,
  signAndSendOperation,
  type OperationKind,
  type SignedOperation,
} from "./solana-operations";

const PUBLIC_FALLBACK_RPC = "https://solana-rpc.publicnode.com";
const COMMITMENT = "confirmed" as const;

type WalletName = "Phantom" | "Solflare" | "Test wallet";
type InjectedWallet = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: PublicKey | null;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  off?: (event: string, callback: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    phantom?: { solana?: InjectedWallet };
    solflare?: InjectedWallet;
    solana?: InjectedWallet;
    broteTestWallet?: InjectedWallet;
  }
}

export type ChainActivity = {
  signature: string;
  blockTime: number | null;
  status: "confirmed" | "finalized" | "failed";
  changeLamports: number | null;
};

export type ProfileAccount = {
  walletId: string;
  address: string;
  seed: string;
  exists: boolean | null;
  balanceLamports: number | null;
  activity: ChainActivity[];
  updatedAt: number;
  error?: string;
  historyError?: string;
};

export type ChainReceipt = {
  signature: string;
  explorerUrl: string;
  address: string;
};

export { UnconfirmedTransactionError } from "./solana-operations";

export type SolanaAPI = {
  network: typeof SOLANA_NETWORK.label;
  rpcUrl: string | null;
  rpcNotice: string | null;
  rpcError: string | null;
  availableWallets: WalletName[];
  walletName: WalletName | null;
  connectedAddress: string | null;
  observedAddress: string | null;
  observedBalanceLamports: number | null;
  accounts: Record<string, ProfileAccount>;
  busy: boolean;
  operations: SignedOperation[];
  operationError: string | null;
  reconcile: (signature: string) => Promise<void>;
  retrySigned: (signature: string) => Promise<void>;
  invalidateSigningSession: () => void;
  connect: (name: WalletName) => Promise<void>;
  disconnect: () => Promise<void>;
  observeAddress: (address: string) => Promise<void>;
  refresh: (wallets: Wallet[]) => Promise<void>;
  createProfile: (wallet: Wallet) => Promise<ChainReceipt>;
  deposit: (wallet: Wallet, amountSol: string) => Promise<ChainReceipt>;
  withdraw: (
    wallet: Wallet,
    amountSol: string,
    destination: string,
  ) => Promise<ChainReceipt>;
};

const SolanaContext = createContext<SolanaAPI | null>(null);

function discoverWallets(): WalletName[] {
  if (typeof window === "undefined") return [];
  const found: WalletName[] = [];
  if (window.phantom?.solana?.isPhantom || window.solana?.isPhantom)
    found.push("Phantom");
  if (window.solflare?.isSolflare) found.push("Solflare");
  if (testWalletEnabled() && window.broteTestWallet) found.push("Test wallet");
  return found;
}

function testWalletEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_BROTE_TEST_WALLET === "true" && SOLANA_NETWORK.cluster === "testnet";
}

function injected(name: WalletName): InjectedWallet {
  if (name === "Test wallet") {
    if (!testWalletEnabled() || !window.broteTestWallet)
      throw new Error("La billetera de prueba no está disponible.");
    return window.broteTestWallet;
  }
  const wallet =
    name === "Phantom"
      ? (window.phantom?.solana ??
        (window.solana?.isPhantom ? window.solana : undefined))
      : window.solflare;
  if (
    !wallet ||
    (name === "Phantom" && !wallet.isPhantom) ||
    (name === "Solflare" && !wallet.isSolflare)
  ) {
    throw new Error(
      `No se encontró la extensión ${name}. Instálala y recarga la página.`,
    );
  }
  return wallet;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeLamports(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(
      "El RPC devolvió un saldo que no se puede representar con precisión.",
    );
  return value;
}

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Tiempo de espera del RPC agotado.")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function derive(walletId: string, guardian: PublicKey) {
  const seed = await seedFor(walletId);
  const key = await PublicKey.createWithSeed(
    guardian,
    seed,
    SystemProgram.programId,
  );
  return { seed, key };
}

async function checkedConnection(url: string): Promise<Connection> {
  const connection = new Connection(url, {
    commitment: COMMITMENT,
    disableRetryOnRateLimit: true,
    fetch: async (input, init) => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      const timer = setTimeout(abort, 15_000);
      init?.signal?.addEventListener("abort", abort, { once: true });
      if (init?.signal?.aborted) abort();
      try {
        return await fetch(input, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timer);
        init?.signal?.removeEventListener("abort", abort);
      }
    },
  });
  return verifySolanaConnection(connection, SOLANA_NETWORK.genesis, SOLANA_NETWORK.label);
}

function explorerAccount(address: string) {
  return `https://explorer.solana.com/address/${address}${SOLANA_NETWORK.cluster === "testnet" ? "?cluster=testnet" : ""}`;
}

export function transactionExplorer(signature: string) {
  return `https://explorer.solana.com/tx/${signature}${SOLANA_NETWORK.cluster === "testnet" ? "?cluster=testnet" : ""}`;
}

export { explorerAccount };

export function SolanaProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const [availableWallets, setAvailableWallets] =
    useState<WalletName[]>(discoverWallets);
  const [walletName, setWalletName] = useState<WalletName | null>(null);
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [watchedAddress, setWatchedAddress] = useState<string | null>(null);
  const [observedBalanceLamports, setObservedBalanceLamports] = useState<
    number | null
  >(null);
  const [accounts, setAccounts] = useState<Record<string, ProfileAccount>>({});
  const [rpcUrl, setRpcUrl] = useState<string | null>(null);
  const [rpcNotice, setRpcNotice] = useState<string | null>(null);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const providerRef = useRef<InjectedWallet | null>(null);
  const connectionRequests = useRef(new ConnectionRequests<InjectedWallet>());
  const connectionRef = useRef<Connection | null>(null);
  const connectionPromiseRef = useRef<Promise<Connection> | null>(null);
  const refreshVersion = useRef(0);
  const busyRef = useRef(false);
  const sessionRef = useRef(new SigningSession());
  const journalRef = useRef<OperationJournal | null>(null);
  const [operations, setOperations] = useState<SignedOperation[]>([]);
  const [operationError, setOperationError] = useState<string | null>(null);
  const observedAddress = connectedAddress ?? watchedAddress;

  const journal = useCallback(() => {
    if (!journalRef.current) journalRef.current = new OperationJournal(window.localStorage, SOLANA_NETWORK.operationsKey);
    return journalRef.current;
  }, []);

  useEffect(() => {
    sessionRef.current.mount();
    return () => sessionRef.current.unmount();
  }, []);

  useEffect(() => {
    const sync = () => {
    try {
      setOperations(journal().read());
      setOperationError(null);
    } catch (error) {
      setOperationError(errorText(error));
    }
    };
    const changed = (event: StorageEvent) => {
      if (event.key === SOLANA_NETWORK.operationsKey || event.key === null) sync();
    };
    sync();
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [journal, store.persistence.writable]);

  const saveOperation = useCallback((operation: SignedOperation) => {
    const next = journal().save(operation);
    setOperations(next);
    setOperationError(null);
  }, [journal]);

  useEffect(() => {
    const detect = () => setAvailableWallets(discoverWallets());
    const timer = window.setTimeout(detect, 700);
    window.addEventListener("focus", detect);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", detect);
    };
  }, []);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;
    const epoch = connectionEpoch;
    const changed = (...args: unknown[]) => {
      if (providerRef.current !== provider || !connectionRequests.current.acceptsEvent(provider, epoch)) return;
      const key = args[0] as { toBase58?: () => string } | null | undefined;
      const address = key?.toBase58?.() ?? null;
      sessionRef.current.set(address ? provider : null, address);
      refreshVersion.current++;
      setConnectedAddress(address);
      setAccounts({});
      setObservedBalanceLamports(null);
    };
    const disconnected = () => {
      if (providerRef.current !== provider || !connectionRequests.current.acceptsEvent(provider, epoch)) return;
      connectionRequests.current.cancel();
      sessionRef.current.set(null, null);
      refreshVersion.current++;
      setConnectedAddress(null);
      setWalletName(null);
      providerRef.current = null;
      setAccounts({});
      setObservedBalanceLamports(null);
    };
    provider.on?.("accountChanged", changed);
    provider.on?.("disconnect", disconnected);
    return () => {
      provider.off?.("accountChanged", changed);
      provider.off?.("disconnect", disconnected);
    };
  }, [walletName, connectionEpoch]);

  const getConnection = useCallback(async () => {
    if (connectionRef.current) return connectionRef.current;
    if (connectionPromiseRef.current) return connectionPromiseRef.current;
    const pending = (async () => {
      const configured = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
      const primary = configured || SOLANA_NETWORK.rpcUrl;
      if (!/^https:\/\//i.test(primary))
        throw new Error("VITE_SOLANA_RPC_URL debe usar HTTPS.");
      try {
        const connection = await checkedConnection(primary);
        connectionRef.current = connection;
        setRpcUrl(primary);
        setRpcNotice(null);
        setRpcError(null);
        return connection;
      } catch (error) {
        const message = errorText(error);
        if (SOLANA_NETWORK.cluster !== "mainnet" || configured || error instanceof WrongSolanaClusterError) {
          setRpcError(message);
          throw error;
        }
        try {
          const connection = await checkedConnection(PUBLIC_FALLBACK_RPC);
          connectionRef.current = connection;
          setRpcUrl(PUBLIC_FALLBACK_RPC);
          setRpcNotice(
            "La conexión principal no está disponible. Seguimos conectados a Solana mainnet a través de PublicNode.",
          );
          setRpcError(null);
          return connection;
        } catch (fallbackError) {
          const combined = `No se pudo consultar mainnet. RPC oficial: ${message}. PublicNode: ${errorText(fallbackError)}.`;
          setRpcError(combined);
          throw new Error(combined);
        }
      }
    })();
    connectionPromiseRef.current = pending;
    try {
      return await pending;
    } finally {
      if (connectionPromiseRef.current === pending)
        connectionPromiseRef.current = null;
    }
  }, []);

  const connect = useCallback(async (name: WalletName) => {
    const wallet = injected(name);
    const request = connectionRequests.current.begin();
    sessionRef.current.set(null, null);
    providerRef.current = null;
    refreshVersion.current++;
    setWalletName(null);
    setConnectedAddress(null);
    setAccounts({});
    setObservedBalanceLamports(null);
    let response: { publicKey: PublicKey };
    try {
      response = await wallet.connect();
    } catch (error) {
      if (!connectionRequests.current.isCurrent(request)) return;
      connectionRequests.current.fail(request);
      throw error;
    }
    if (!connectionRequests.current.isCurrent(request)) return;
    const key = response.publicKey ?? wallet.publicKey;
    if (!key) {
      connectionRequests.current.fail(request);
      throw new Error("La billetera no devolvió una dirección pública.");
    }
    if (wallet.publicKey && !wallet.publicKey.equals(key)) {
      connectionRequests.current.fail(request);
      throw new Error("La cuenta activa de la extensión cambió. Vuelve a conectar.");
    }
    if (!connectionRequests.current.accept(request, wallet)) return;
    providerRef.current = wallet;
    sessionRef.current.set(wallet, key.toBase58());
    refreshVersion.current++;
    setConnectionEpoch(request);
    setWalletName(name);
    setConnectedAddress(key.toBase58());
    setAccounts({});
    setObservedBalanceLamports(null);
  }, []);

  const disconnect = useCallback(async () => {
    const provider = providerRef.current;
    connectionRequests.current.cancel();
    sessionRef.current.set(null, null);
    refreshVersion.current++;
    providerRef.current = null;
    setWalletName(null);
    setConnectedAddress(null);
    setAccounts({});
    setObservedBalanceLamports(null);
    await provider?.disconnect();
  }, []);

  const observeAddress = useCallback(async (address: string) => {
    const key = new PublicKey(address.trim());
    refreshVersion.current++;
    setWatchedAddress(key.toBase58());
    setAccounts({});
    setObservedBalanceLamports(null);
  }, []);

  const refresh = useCallback(
    async (wallets: Wallet[]) => {
      const address = connectedAddress ?? watchedAddress;
      if (!address) {
        setAccounts({});
        setObservedBalanceLamports(null);
        return;
      }
      const version = ++refreshVersion.current;
      setAccounts({});
      setObservedBalanceLamports(null);
      const connection = await getConnection();
      if (version !== refreshVersion.current) return;
      const guardian = new PublicKey(address);
      const read = async (source: Connection): Promise<{
        profiles: ProfileAccount[];
        balance: { value: number | null; error: string | null };
        failedReads: number;
      }> => {
      let failedReads = 0;
      const balancePromise = source
        .getBalance(guardian, COMMITMENT)
        .then((value) => ({
          value: safeLamports(value),
          error: null as string | null,
        }))
        .catch((error) => {
          failedReads++;
          return {
            value: null,
            error: `Saldo de la dirección consultada no disponible: ${errorText(error)}`,
          };
        });
      const profiles = await Promise.all(
        wallets.map(async (wallet) => {
          const { seed, key } = await derive(wallet.id, guardian);
          let account: Awaited<ReturnType<Connection["getAccountInfo"]>>;
          try {
            account = await source.getAccountInfo(key, COMMITMENT);
          } catch (error) {
            failedReads++;
            return {
              walletId: wallet.id,
              address: key.toBase58(),
              seed,
              exists: null,
              balanceLamports: null,
              activity: [],
              updatedAt: Date.now(),
              error: `Saldo y estado no disponibles: ${errorText(error)}`,
            } satisfies ProfileAccount;
          }
          if (account) {
            try {
              safeLamports(account.lamports);
            } catch (error) {
              failedReads++;
              return {
                walletId: wallet.id,
                address: key.toBase58(),
                seed,
                exists: null,
                balanceLamports: null,
                activity: [],
                updatedAt: Date.now(),
                error: errorText(error),
              } satisfies ProfileAccount;
            }
          }
          if (
            account &&
            (!account.owner.equals(SystemProgram.programId) ||
              account.data.length !== 0)
          ) {
            return {
              walletId: wallet.id,
              address: key.toBase58(),
              seed,
              exists: true,
              balanceLamports: account.lamports,
              activity: [],
              updatedAt: Date.now(),
              error:
                "La cuenta existe, pero no es una cuenta de sistema vacía. Se bloquearon las operaciones.",
            } satisfies ProfileAccount;
          }
          let activity: ChainActivity[] = [];
          let historyError: string | undefined;
          try {
            const signatures = await source.getSignaturesForAddress(
              key,
              { limit: 8 },
              COMMITMENT,
            );
            let incompleteDetails = 0;
            const details = await Promise.all(
              signatures.map(async (entry) => {
                try {
                  const transaction = await source.getParsedTransaction(
                    entry.signature,
                    {
                      commitment: COMMITMENT,
                      maxSupportedTransactionVersion: 1,
                    },
                  );
                  if (!transaction) incompleteDetails++;
                  const keys =
                    transaction?.transaction.message.accountKeys.map((item) =>
                      item.pubkey.toBase58(),
                    ) ?? [];
                  const index = keys.indexOf(key.toBase58());
                  const failed = !!(entry.err || transaction?.meta?.err);
                  const pre =
                    index >= 0
                      ? transaction?.meta?.preBalances[index]
                      : undefined;
                  const post =
                    index >= 0
                      ? transaction?.meta?.postBalances[index]
                      : undefined;
                  const changeLamports =
                    !failed &&
                    pre !== undefined &&
                    post !== undefined &&
                    Number.isSafeInteger(pre) &&
                    Number.isSafeInteger(post)
                      ? post - pre
                      : null;
                  if (transaction && !failed && changeLamports === null)
                    incompleteDetails++;
                  return {
                    signature: entry.signature,
                    blockTime:
                      transaction?.blockTime ?? entry.blockTime ?? null,
                    status: failed
                      ? "failed"
                      : entry.confirmationStatus === "finalized"
                        ? "finalized"
                        : "confirmed",
                    changeLamports,
                  } satisfies ChainActivity;
                } catch {
                  incompleteDetails++;
                  failedReads++;
                  return {
                    signature: entry.signature,
                    blockTime: entry.blockTime ?? null,
                    status: entry.err
                      ? "failed"
                      : entry.confirmationStatus === "finalized"
                        ? "finalized"
                        : "confirmed",
                    changeLamports: null,
                  } satisfies ChainActivity;
                }
              }),
            );
            activity = details;
            if (incompleteDetails)
              historyError = `${incompleteDetails} transacción(es) sin detalle de saldo en este RPC.`;
          } catch (error) {
            failedReads++;
            historyError = `Historial no disponible: ${errorText(error)}`;
          }
          return {
            walletId: wallet.id,
            address: key.toBase58(),
            seed,
            exists: !!account,
            balanceLamports: account?.lamports ?? 0,
            activity,
            updatedAt: Date.now(),
            historyError,
          } satisfies ProfileAccount;
        }),
      );
      const balance = await balancePromise;
      return { profiles, balance, failedReads };
      };
      // Testnet has no approved fallback; a failed read must stay unknown.
      const configured = SOLANA_NETWORK.cluster !== "mainnet" || !!import.meta.env.VITE_SOLANA_RPC_URL?.trim();
      const selected = await retryReadOnVerifiedFallback({
        primary: connection,
        primaryUrl: connection.rpcEndpoint,
        officialUrl: SOLANA_NETWORK.rpcUrl,
        configured,
        verifyFallback: () => checkedConnection(PUBLIC_FALLBACK_RPC),
        read,
        mergeResults: mergeVerifiedReads,
      });
      const { profiles, balance } = selected.result;
      if (version === refreshVersion.current) {
        if (selected.usedFallback && connectionRef.current === connection) {
          connectionRef.current = selected.connection;
          setRpcUrl(PUBLIC_FALLBACK_RPC);
          setRpcNotice("La conexión principal dejó de responder. Seguimos consultando Solana mainnet a través de PublicNode.");
          setRpcError(null);
        } else if (selected.fallbackError) {
          setRpcError(`PublicNode no pudo completar la consulta: ${selected.fallbackError}`);
        } else {
          setRpcError(null);
        }
        setObservedBalanceLamports(balance.value);
        setAccounts(
          Object.fromEntries(
            profiles.map((profile) => [profile.walletId, profile]),
          ),
        );
      }
      if (balance.error && version === refreshVersion.current)
        throw new Error(balance.error);
    },
    [connectedAddress, watchedAddress, getConnection],
  );

  const captureSigner = useCallback(() => {
    if (!connectedAddress || !providerRef.current)
      throw new Error("Conecta la billetera del representante para firmar.");
    const provider = providerRef.current;
    const key = provider.publicKey;
    if (!key || key.toBase58() !== connectedAddress)
      throw new Error(
        "La cuenta activa de la extensión cambió. Vuelve a conectar.",
      );
    return sessionRef.current.snapshot(provider, connectedAddress);
  }, [connectedAddress]);

  const assertSigner = useCallback((session: ReturnType<typeof sessionRef.current.snapshot>) => {
    const provider = providerRef.current;
    sessionRef.current.assert(session, provider?.publicKey?.toBase58() ?? null);
  }, []);

  const invalidateSigningSession = useCallback(() => {
    sessionRef.current.invalidate();
  }, []);

  const requireSigner = useCallback(async (session: ReturnType<typeof sessionRef.current.snapshot>) => {
    assertSigner(session);
    const connection = await getConnection();
    assertSigner(session);
    return {
      connection,
      provider: session.provider as InjectedWallet,
      guardian: new PublicKey(session.address),
    };
  }, [assertSigner, getConnection]);

  const submit = useCallback(
    async (
      transaction: Transaction,
      address: string,
      profileId: string,
      kind: OperationKind,
      session: ReturnType<typeof sessionRef.current.snapshot>,
    ): Promise<ChainReceipt> => {
      storeRef.current.recordGuardianBase(profileId, session.address);
      storeRef.current.assertDurableWallet(profileId);
      const { connection, provider, guardian } = await requireSigner(session);
      const confirmed = await signAndSendOperation({
        transaction,
        provider,
        guardian,
        connection,
        assertSession: () => {
          assertSigner(session);
          storeRef.current.assertDurableWallet(profileId);
        },
        journal: journal(),
        save: saveOperation,
        profileId,
        profileAddress: address,
        kind,
        beforeSign: (prepared) => assertFinalTransactionFunds(
          prepared, guardian, new PublicKey(address), kind, connection,
        ),
        confirmWithTimeout: (promise) => withTimeout(promise, 90_000),
      });
      return {
        signature: confirmed.signature,
        explorerUrl: transactionExplorer(confirmed.signature),
        address,
      };
    },
    [requireSigner, assertSigner, journal, saveOperation],
  );

  const run = useCallback(async (action: (session: ReturnType<typeof sessionRef.current.snapshot>) => Promise<ChainReceipt>) => {
    if (busyRef.current)
      throw new Error("Espera a que termine la operación actual.");
    journal().assertNoPending();
    const session = captureSigner();
    busyRef.current = true;
    setBusy(true);
    try {
      return await action(session);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [captureSigner, journal]);

  const createProfile = useCallback(
    (wallet: Wallet) =>
      run(async (session) => {
        const { connection, guardian } = await requireSigner(session);
        const { seed, key } = await derive(wallet.id, guardian);
        if (await connection.getAccountInfo(key, COMMITMENT))
          throw new Error(SOLANA_NETWORK.cluster === "testnet"
            ? "Esta cuenta ya existe en testnet. Actualiza el saldo."
            : "Esta cuenta ya existe en mainnet. Actualiza el saldo.");
        const lamports = safeLamports(
          await connection.getMinimumBalanceForRentExemption(0, COMMITMENT),
        );
        const transaction = new Transaction().add(
          SystemProgram.createAccountWithSeed({
            fromPubkey: guardian,
            basePubkey: guardian,
            newAccountPubkey: key,
            seed,
            lamports,
            space: 0,
            programId: SystemProgram.programId,
          }),
        );
        const feeLamports = await estimateTransactionFee(transaction, guardian, connection);
        const guardianBalance = safeLamports(
          await connection.getBalance(guardian, COMMITMENT),
        );
        if (guardianBalance < lamports + feeLamports)
          throw new Error(
            "Saldo insuficiente en la billetera del representante para crear la cuenta y pagar la comisión.",
          );
        if (
          !window.confirm(
            translate(SOLANA_NETWORK.cluster === "testnet"
              ? `SOLANA TESTNET · SOL de prueba sin valor monetario\n\nCrear cuenta para ${wallet.name}\nDirección: ${key.toBase58()}\nDesde: ${guardian.toBase58()}\nDepósito inicial: ${(lamports / LAMPORTS_PER_SOL).toFixed(9)} SOL de prueba, más comisión de red.\n\nLa billetera del representante deberá firmar. ¿Continuar?`
              : `SOLANA MAINNET · SOL real\n\nCrear cuenta para ${wallet.name}\nDirección: ${key.toBase58()}\nDesde: ${guardian.toBase58()}\nDepósito inicial: ${(lamports / LAMPORTS_PER_SOL).toFixed(9)} SOL, más comisión de red.\n\nLa billetera del representante deberá firmar. ¿Continuar?`),
          )
        )
          throw new Error("Operación cancelada.");
        assertSigner(session);
        const receipt = await submit(transaction, key.toBase58(), wallet.id, "create", session);
        return receipt;
      }),
    [run, requireSigner, submit, assertSigner],
  );

  const deposit = useCallback(
    (wallet: Wallet, amountSol: string) =>
      run(async (session) => {
        const { connection, guardian } = await requireSigner(session);
        const lamports = parseSolLamports(amountSol);
        const { key } = await derive(wallet.id, guardian);
        const account = await connection.getAccountInfo(key, COMMITMENT);
        if (
          !account ||
          !account.owner.equals(SystemProgram.programId) ||
          account.data.length !== 0
        )
          throw new Error(
            "La cuenta del perfil no existe o no es una cuenta de sistema válida.",
          );
        safeLamports(account.lamports);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: guardian,
            toPubkey: key,
            lamports,
          }),
        );
        const feeLamports = await estimateTransactionFee(transaction, guardian, connection);
        const guardianBalance = safeLamports(
          await connection.getBalance(guardian, COMMITMENT),
        );
        if (guardianBalance < lamports + feeLamports)
          throw new Error(
            "Saldo insuficiente para el depósito y la comisión de red.",
          );
        if (
          !window.confirm(
            translate(SOLANA_NETWORK.cluster === "testnet"
              ? `SOLANA TESTNET · SOL de prueba sin valor monetario\n\nDepositar ${amountSol} SOL de prueba para ${wallet.name}\nDesde: ${guardian.toBase58()}\nHacia: ${key.toBase58()}\nMás comisión de red pagada por el representante.\n\n¿Continuar a la firma en tu billetera?`
              : `SOLANA MAINNET · SOL real\n\nDepositar ${amountSol} SOL para ${wallet.name}\nDesde: ${guardian.toBase58()}\nHacia: ${key.toBase58()}\nMás comisión de red pagada por el representante.\n\n¿Continuar a la firma en tu billetera?`),
          )
        )
          throw new Error("Operación cancelada.");
        assertSigner(session);
        return submit(transaction, key.toBase58(), wallet.id, "deposit", session);
      }),
    [run, requireSigner, submit, assertSigner],
  );

  const withdraw = useCallback(
    (wallet: Wallet, amountSol: string, destination: string) =>
      run(async (session) => {
        const { connection, guardian } = await requireSigner(session);
        const lamports = parseSolLamports(amountSol);
        let toPubkey: PublicKey;
        try {
          toPubkey = new PublicKey(destination.trim());
        } catch {
          throw new Error("Introduce una dirección de destino Solana válida.");
        }
        const { seed, key } = await derive(wallet.id, guardian);
        if (toPubkey.equals(key))
          throw new Error(
            "La dirección de destino debe ser distinta de la cuenta del perfil.",
          );
        const account = await connection.getAccountInfo(key, COMMITMENT);
        if (
          !account ||
          !account.owner.equals(SystemProgram.programId) ||
          account.data.length !== 0
        )
          throw new Error(
            "La cuenta del perfil no existe o no es una cuenta de sistema válida.",
          );
        safeLamports(account.lamports);
        if (account.lamports < lamports)
          throw new Error("Saldo insuficiente en la cuenta del perfil.");
        const minimumBalance = safeLamports(
          await connection.getMinimumBalanceForRentExemption(0, COMMITMENT),
        );
        if (!hasValidSystemAccountRemainder(account.lamports, lamports, minimumBalance))
          throw new Error(
            "El retiro debe dejar la cuenta vacía o conservar su saldo mínimo de rent-exemption.",
          );
        const destinationAccount = await connection.getAccountInfo(toPubkey, COMMITMENT);
        const destinationBalance = safeLamports(destinationAccount?.lamports ?? 0);
        const destinationMinimum = safeLamports(
          await connection.getMinimumBalanceForRentExemption(destinationAccount?.data.length ?? 0, COMMITMENT),
        );
        if (destinationMinimum === 0)
          throw new Error("El RPC devolvió un saldo mínimo exento de renta inválido.");
        if (!hasRentExemptDestinationBalance(destinationBalance, lamports, destinationMinimum))
          throw new Error("El retiro es demasiado pequeño para que la cuenta de destino alcance el saldo mínimo exento de renta.");
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: key,
            basePubkey: guardian,
            toPubkey,
            lamports,
            seed,
            programId: SystemProgram.programId,
          }),
        );
        const feeLamports = await estimateTransactionFee(transaction, guardian, connection);
        if (
          safeLamports(await connection.getBalance(guardian, COMMITMENT)) < feeLamports
        )
          throw new Error(
            "El representante necesita SOL para la comisión de red.",
          );
        if (
          !window.confirm(
            translate(SOLANA_NETWORK.cluster === "testnet"
              ? `SOLANA TESTNET · SOL de prueba sin valor monetario\n\nRetirar ${amountSol} SOL de prueba de ${wallet.name}\nDesde: ${key.toBase58()}\nHacia: ${toPubkey.toBase58()}\nFirma: ${guardian.toBase58()}\nLa comisión se paga desde la billetera del representante.\n\nVerifica cuidadosamente el destino. ¿Continuar?`
              : `SOLANA MAINNET · SOL real\n\nRetirar ${amountSol} SOL de ${wallet.name}\nDesde: ${key.toBase58()}\nHacia: ${toPubkey.toBase58()}\nFirma: ${guardian.toBase58()}\nLa comisión se paga desde la billetera del representante.\n\nVerifica cuidadosamente el destino. ¿Continuar?`),
          )
        )
          throw new Error("Operación cancelada.");
        assertSigner(session);
        return submit(transaction, key.toBase58(), wallet.id, "withdraw", session);
      }),
    [run, requireSigner, submit, assertSigner],
  );

  const reconcile = useCallback(async (signature: string) => {
    storeRef.current.assertWriter();
    const operation = journal().read().find((item) => item.signature === signature);
    if (!operation) throw new Error("No se encontró la transacción firmada.");
    if (operation.state !== "pending") return;
    const connection = await getConnection();
    const result = await reconcileOperation(operation, {
      getSignatureStatuses: (signatures, options) => connection.getSignatureStatuses(signatures, options),
      getBlockHeight: (commitment) => connection.getBlockHeight(commitment),
      getSignaturesForAddress: (address, options, commitment) =>
        connection.getSignaturesForAddress(address as PublicKey, options, commitment),
    }, new PublicKey(operation.profileAddress));
    saveOperation({ ...operation, state: result.state, detail: result.detail });
  }, [journal, getConnection, saveOperation]);

  const retrySigned = useCallback(async (signature: string) => {
    if (busyRef.current) throw new Error("Espera a que termine la operación actual.");
    const operation = journal().read().find((item) => item.signature === signature);
    if (!operation || operation.state !== "pending")
      throw new Error("La transacción ya no está pendiente.");
    storeRef.current.assertDurableWallet(operation.profileId);
    const session = captureSigner();
    if (session.address !== operation.guardian)
      throw new Error("Conecta la billetera del representante que firmó esta transacción.");
    busyRef.current = true;
    setBusy(true);
    try {
      // A failed status read cannot make a byte-identical rebroadcast unsafe.
      try { await reconcile(signature); } catch { /* Keep the persisted pending record. */ }
      const current = journal().read().find((item) => item.signature === signature);
      if (!current || current.state !== "pending") return;
      const connection = await getConnection();
      await rebroadcastSignedOperation(operation, connection, () => {
        assertSigner(session);
        storeRef.current.assertDurableWallet(operation.profileId);
      });
      await reconcile(signature);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [journal, captureSigner, reconcile, getConnection, assertSigner]);

  const value = useMemo<SolanaAPI>(
    () => ({
      network: SOLANA_NETWORK.label,
      rpcUrl,
      rpcNotice,
      rpcError,
      availableWallets,
      walletName,
      connectedAddress,
      observedAddress,
      observedBalanceLamports,
      accounts,
      busy,
      operations,
      operationError,
      reconcile,
      retrySigned,
      invalidateSigningSession,
      connect,
      disconnect,
      observeAddress,
      refresh,
      createProfile,
      deposit,
      withdraw,
    }),
    [
      rpcUrl,
      rpcNotice,
      rpcError,
      availableWallets,
      walletName,
      connectedAddress,
      observedAddress,
      observedBalanceLamports,
      accounts,
      busy,
      operations,
      operationError,
      reconcile,
      retrySigned,
      invalidateSigningSession,
      connect,
      disconnect,
      observeAddress,
      refresh,
      createProfile,
      deposit,
      withdraw,
    ],
  );
  return (
    <SolanaContext.Provider value={value}>{children}</SolanaContext.Provider>
  );
}

export function useSolana(): SolanaAPI {
  const context = useContext(SolanaContext);
  if (!context)
    throw new Error("useSolana debe usarse dentro de SolanaProvider.");
  return context;
}
