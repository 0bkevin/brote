/** Keeps late wallet approvals and events from replacing a newer choice. */
export class ConnectionRequests<Provider extends object> {
  private generation = 0;
  private pending = false;
  private active: Provider | null = null;

  begin(): number {
    this.pending = true;
    this.active = null;
    return ++this.generation;
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation && this.pending;
  }

  accept(generation: number, provider: Provider): boolean {
    if (generation !== this.generation || !this.pending) return false;
    this.active = provider;
    this.pending = false;
    return true;
  }

  fail(generation: number): void {
    if (generation === this.generation) this.pending = false;
  }

  cancel(): void {
    ++this.generation;
    this.pending = false;
    this.active = null;
  }

  acceptsEvent(provider: Provider, generation?: number): boolean {
    return !this.pending && this.active === provider &&
      (generation === undefined || generation === this.generation);
  }
}

/** Used by both automatic and manual refresh indicators. */
export class LatestRequest {
  private generation = 0;

  begin(): number { return ++this.generation; }
  isCurrent(generation: number): boolean { return generation === this.generation; }
  cancel(): void { ++this.generation; }
}

export type ReadResult = { failedReads: number };

export async function verifyMainnetConnection<Connection extends {
  getGenesisHash: () => Promise<string>;
  getLatestBlockhash: (commitment: "confirmed") => Promise<unknown>;
}>(connection: Connection, mainnetGenesis: string): Promise<Connection> {
  const genesis = await connection.getGenesisHash();
  if (genesis !== mainnetGenesis)
    throw new Error(`RPC rechazado: el clúster no es Solana mainnet (${genesis}).`);
  await connection.getLatestBlockhash("confirmed");
  return connection;
}

/** A public read may move to the fallback only after a fresh verification. */
export async function retryReadOnVerifiedFallback<Connection, Result extends ReadResult>(options: {
  primary: Connection;
  primaryUrl: string;
  officialUrl: string;
  configured: boolean;
  verifyFallback: () => Promise<Connection>;
  read: (connection: Connection) => Promise<Result>;
  mergeResults?: (primary: Result, fallback: Result) => Result;
}): Promise<{ connection: Connection; result: Result; usedFallback: boolean; fallbackError?: string }> {
  const result = await options.read(options.primary);
  if (options.configured || options.primaryUrl !== options.officialUrl || result.failedReads === 0)
    return { connection: options.primary, result, usedFallback: false };
  try {
    const fallback = await options.verifyFallback();
    const fallbackResult = await options.read(fallback);
    const retry = options.mergeResults ? options.mergeResults(result, fallbackResult) : fallbackResult;
    if (retry.failedReads < result.failedReads)
      return { connection: fallback, result: retry, usedFallback: true };
    return { connection: options.primary, result, usedFallback: false };
  } catch (error) {
    return {
      connection: options.primary,
      result,
      usedFallback: false,
      fallbackError: error instanceof Error ? error.message : String(error),
    };
  }
}

type ReadProfile = {
  walletId: string;
  exists: boolean | null;
  balanceLamports: number | null;
  activity: { signature: string; changeLamports: number | null }[];
  error?: string;
  historyError?: string;
};

/** Combine complementary reads without changing the address or inventing data. */
export function mergeVerifiedReads<P extends ReadProfile>(
  primary: { profiles: P[]; balance: { value: number | null; error: string | null }; failedReads: number },
  fallback: { profiles: P[]; balance: { value: number | null; error: string | null }; failedReads: number },
) {
  const original = new Map(primary.profiles.map(profile => [profile.walletId, profile]));
  const profiles = fallback.profiles.map(next => {
    const previous = original.get(next.walletId);
    if (!previous) return next;
    const account = next.exists !== null ? next : previous;
    const nextHistoryKnown = next.exists !== null && !next.error && !next.historyError;
    const previousHistoryKnown = previous.exists !== null && !previous.error && !previous.historyError;
    const history = nextHistoryKnown ? next : previousHistoryKnown ? previous : account;
    const alternate = history === next ? previous : next;
    const bySignature = new Map(alternate.activity.map(entry => [entry.signature, entry]));
    const activity = history.activity.map(entry => {
      const other = bySignature.get(entry.signature);
      return entry.changeLamports === null && other?.changeLamports !== null && other !== undefined
        ? { ...entry, changeLamports: other.changeLamports } : entry;
    });
    return { ...account, activity, historyError: history.historyError } as P;
  });
  const balance = fallback.balance.value !== null ? fallback.balance : primary.balance;
  const failedReads = (balance.value === null ? 1 : 0) + profiles.reduce((sum, profile) =>
    sum + (profile.exists === null ? 1 : profile.historyError ? 1 : 0), 0);
  return { profiles, balance, failedReads };
}
