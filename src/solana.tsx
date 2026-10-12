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
import { encodeBase58, parseSolLamports, seedFor } from "./solana-utils";

const MAINNET_RPC = "https://api.mainnet.solana.com";
const PUBLIC_FALLBACK_RPC = "https://solana-rpc.publicnode.com";
const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const COMMITMENT = "confirmed" as const;

type WalletName = "Phantom" | "Solflare";
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

export class UnconfirmedTransactionError extends Error {
  constructor(
    public readonly signature: string,
    cause: unknown,
  ) {
    super(
      `La transacción fue firmada, pero el RPC no confirmó si se envió o ejecutó: ${errorText(cause)}. Comprueba el enlace antes de volver a intentarlo.`,
    );
    this.name = "UnconfirmedTransactionError";
  }
}

export type SolanaAPI = {
  network: "Solana mainnet";
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
  return found;
}

function injected(name: WalletName): InjectedWallet {
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
  const genesis = await connection.getGenesisHash();
  if (genesis !== MAINNET_GENESIS)
    throw new Error(
      `RPC rechazado: el clúster no es Solana mainnet (${genesis}).`,
    );
  await connection.getLatestBlockhash(COMMITMENT);
  return connection;
}

function explorerAccount(address: string) {
  return `https://explorer.solana.com/address/${address}`;
}

export function transactionExplorer(signature: string) {
  return `https://explorer.solana.com/tx/${signature}`;
}

export { explorerAccount };

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [availableWallets, setAvailableWallets] =
    useState<WalletName[]>(discoverWallets);
  const [walletName, setWalletName] = useState<WalletName | null>(null);
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
  const connectionRef = useRef<Connection | null>(null);
  const connectionPromiseRef = useRef<Promise<Connection> | null>(null);
  const refreshVersion = useRef(0);
  const busyRef = useRef(false);
  const observedAddress = connectedAddress ?? watchedAddress;

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
    const changed = (...args: unknown[]) => {
      const key = args[0] as { toBase58?: () => string } | null | undefined;
      refreshVersion.current++;
      setConnectedAddress(key?.toBase58?.() ?? null);
      setAccounts({});
      setObservedBalanceLamports(null);
    };
    const disconnected = () => {
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
  }, [walletName]);

  const getConnection = useCallback(async () => {
    if (connectionRef.current) return connectionRef.current;
    if (connectionPromiseRef.current) return connectionPromiseRef.current;
    const pending = (async () => {
      const configured = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
      const primary = configured || MAINNET_RPC;
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
        if (configured || message.includes("clúster no es")) {
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
    const response = await wallet.connect();
    const key = response.publicKey ?? wallet.publicKey;
    if (!key)
      throw new Error("La billetera no devolvió una dirección pública.");
    providerRef.current = wallet;
    refreshVersion.current++;
    setWalletName(name);
    setConnectedAddress(key.toBase58());
    setAccounts({});
    setObservedBalanceLamports(null);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await providerRef.current?.disconnect();
    } finally {
      refreshVersion.current++;
      providerRef.current = null;
      setWalletName(null);
      setConnectedAddress(null);
      setAccounts({});
      setObservedBalanceLamports(null);
    }
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
      const guardian = new PublicKey(address);
      const balancePromise = connection
        .getBalance(guardian, COMMITMENT)
        .then((value) => ({
          value: safeLamports(value),
          error: null as string | null,
        }))
        .catch((error) => ({
          value: null,
          error: `Saldo de la dirección consultada no disponible: ${errorText(error)}`,
        }));
      const profiles = await Promise.all(
        wallets.map(async (wallet) => {
          const { seed, key } = await derive(wallet.id, guardian);
          let account: Awaited<ReturnType<Connection["getAccountInfo"]>>;
          try {
            account = await connection.getAccountInfo(key, COMMITMENT);
          } catch (error) {
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
            const signatures = await connection.getSignaturesForAddress(
              key,
              { limit: 8 },
              COMMITMENT,
            );
            let incompleteDetails = 0;
            const details = await Promise.all(
              signatures.map(async (entry) => {
                try {
                  const transaction = await connection.getParsedTransaction(
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
      if (version === refreshVersion.current) {
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

  const requireSigner = useCallback(async () => {
    if (!connectedAddress || !providerRef.current)
      throw new Error("Conecta la billetera del representante para firmar.");
    const key = providerRef.current.publicKey;
    if (!key || key.toBase58() !== connectedAddress)
      throw new Error(
        "La cuenta activa de la extensión cambió. Vuelve a conectar.",
      );
    const connection = await getConnection();
    return {
      connection,
      provider: providerRef.current,
      guardian: new PublicKey(connectedAddress),
    };
  }, [connectedAddress, getConnection]);

  const submit = useCallback(
    async (
      transaction: Transaction,
      address: string,
    ): Promise<ChainReceipt> => {
      const { connection, provider, guardian } = await requireSigner();
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash(COMMITMENT);
      transaction.feePayer = guardian;
      transaction.recentBlockhash = blockhash;
      const expectedMessage = transaction.serializeMessage();
      const signed = await provider.signTransaction(transaction);
      const signedMessage = signed.serializeMessage();
      if (
        expectedMessage.length !== signedMessage.length ||
        expectedMessage.some((byte, index) => byte !== signedMessage[index])
      ) {
        throw new Error(
          "La billetera devolvió una transacción distinta; no se envió.",
        );
      }
      const serialized = signed.serialize();
      if (!signed.signature)
        throw new Error(
          "La billetera no firmó la transacción requerida; no se envió.",
        );
      const signedSignature = encodeBase58(signed.signature);
      let signature: string;
      try {
        signature = await connection.sendRawTransaction(serialized);
      } catch (error) {
        throw new UnconfirmedTransactionError(signedSignature, error);
      }
      if (signature !== signedSignature)
        throw new UnconfirmedTransactionError(
          signedSignature,
          new Error(
            "El RPC devolvió una firma distinta a la transacción firmada.",
          ),
        );
      let confirmation: Awaited<ReturnType<Connection["confirmTransaction"]>>;
      try {
        confirmation = await withTimeout(
          connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            COMMITMENT,
          ),
          90_000,
        );
      } catch (error) {
        throw new UnconfirmedTransactionError(signature, error);
      }
      if (confirmation.value.err)
        throw new Error(
          `La transacción falló: ${JSON.stringify(confirmation.value.err)}. Firma: ${signature}`,
        );
      return {
        signature,
        explorerUrl: transactionExplorer(signature),
        address,
      };
    },
    [requireSigner],
  );

  const run = useCallback(async (action: () => Promise<ChainReceipt>) => {
    if (busyRef.current)
      throw new Error("Espera a que termine la operación actual.");
    busyRef.current = true;
    setBusy(true);
    try {
      return await action();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const createProfile = useCallback(
    (wallet: Wallet) =>
      run(async () => {
        const { connection, guardian } = await requireSigner();
        const { seed, key } = await derive(wallet.id, guardian);
        if (await connection.getAccountInfo(key, COMMITMENT))
          throw new Error(
            "Esta cuenta ya existe en mainnet. Actualiza el saldo.",
          );
        const lamports = safeLamports(
          await connection.getMinimumBalanceForRentExemption(0, COMMITMENT),
        );
        const guardianBalance = safeLamports(
          await connection.getBalance(guardian, COMMITMENT),
        );
        if (guardianBalance <= lamports + 10_000)
          throw new Error(
            "Saldo insuficiente en la billetera del representante para crear la cuenta y pagar la comisión.",
          );
        if (
          !window.confirm(
            `SOLANA MAINNET · SOL real\n\nCrear cuenta para ${wallet.name}\nDirección: ${key.toBase58()}\nDesde: ${guardian.toBase58()}\nDepósito inicial: ${(lamports / LAMPORTS_PER_SOL).toFixed(9)} SOL, más comisión de red.\n\nLa billetera del representante deberá firmar. ¿Continuar?`,
          )
        )
          throw new Error("Operación cancelada.");
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
        const receipt = await submit(transaction, key.toBase58());
        return receipt;
      }),
    [run, requireSigner, submit],
  );

  const deposit = useCallback(
    (wallet: Wallet, amountSol: string) =>
      run(async () => {
        const { connection, guardian } = await requireSigner();
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
        const guardianBalance = safeLamports(
          await connection.getBalance(guardian, COMMITMENT),
        );
        if (guardianBalance <= lamports + 10_000)
          throw new Error(
            "Saldo insuficiente para el depósito y la comisión de red.",
          );
        if (
          !window.confirm(
            `SOLANA MAINNET · SOL real\n\nDepositar ${amountSol} SOL para ${wallet.name}\nDesde: ${guardian.toBase58()}\nHacia: ${key.toBase58()}\nMás comisión de red pagada por el representante.\n\n¿Continuar a la firma en tu billetera?`,
          )
        )
          throw new Error("Operación cancelada.");
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: guardian,
            toPubkey: key,
            lamports,
          }),
        );
        return submit(transaction, key.toBase58());
      }),
    [run, requireSigner, submit],
  );

  const withdraw = useCallback(
    (wallet: Wallet, amountSol: string, destination: string) =>
      run(async () => {
        const { connection, guardian } = await requireSigner();
        const lamports = parseSolLamports(amountSol);
        const toPubkey = new PublicKey(destination.trim());
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
        if (
          safeLamports(await connection.getBalance(guardian, COMMITMENT)) <
          10_000
        )
          throw new Error(
            "El representante necesita SOL para la comisión de red.",
          );
        if (
          !window.confirm(
            `SOLANA MAINNET · SOL real\n\nRetirar ${amountSol} SOL de ${wallet.name}\nDesde: ${key.toBase58()}\nHacia: ${toPubkey.toBase58()}\nFirma: ${guardian.toBase58()}\nLa comisión se paga desde la billetera del representante.\n\nVerifica cuidadosamente el destino. ¿Continuar?`,
          )
        )
          throw new Error("Operación cancelada.");
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
        return submit(transaction, key.toBase58());
      }),
    [run, requireSigner, submit],
  );

  const value = useMemo<SolanaAPI>(
    () => ({
      network: "Solana mainnet",
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
