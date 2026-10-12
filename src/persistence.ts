import { PublicKey, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitialState, isAppState } from "./domain";
import type { AppState } from "./types";
import { base64ToBytes, isSignedOperation, OperationJournal, type OperationStorage, type SignedOperation } from "./solana-operations";
import { seedFor } from "./solana-utils";

export const STORAGE_KEY = "brote-demo-v1";
export const WRITER_LOCK = "brote-demo-v1-writer";
export const MAX_BACKUP_BYTES = 50_000_000;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function validAddress(address: string): boolean {
  try {
    return new PublicKey(address).toBase58() === address;
  } catch {
    return false;
  }
}

export function isPersistableState(value: unknown): value is AppState {
  if (!isAppState(value)) return false;
  const state = value as AppState;
  if (
    state.legacyGuardianAddress !== undefined &&
    state.legacyGuardianAddress !== null &&
    typeof state.legacyGuardianAddress !== "string"
  ) return false;
  if (state.guardianBases === undefined) return true;
  if (!Array.isArray(state.guardianBases)) return false;
  const walletIds = new Set(state.wallets.map((wallet) => wallet.id));
  const seen = new Set<string>();
  for (const base of state.guardianBases) {
    if (
      !base ||
      typeof base.walletId !== "string" ||
      !walletIds.has(base.walletId) ||
      typeof base.address !== "string" ||
      !validAddress(base.address)
    ) return false;
    const pair = `${base.walletId}\0${base.address}`;
    if (seen.has(pair)) return false;
    seen.add(pair);
  }
  return true;
}

export interface LoadedState {
  state: AppState;
  raw: string | null;
  corruptRaw: string | null;
  error: string | null;
}

export function decodeStored(raw: string | null): LoadedState {
  if (raw === null) return { state: createInitialState(), raw, corruptRaw: null, error: null };
  try {
    const candidate: unknown = JSON.parse(raw);
    if (isPersistableState(candidate))
      return { state: candidate, raw, corruptRaw: null, error: null };
  } catch {
    // Preserve the original bytes for explicit recovery.
  }
  return {
    state: createInitialState(),
    raw,
    corruptRaw: raw,
    error: "Los datos guardados no se pudieron leer. Descarga el registro original antes de reemplazarlo.",
  };
}

export function loadStored(storage: StorageLike): LoadedState {
  try {
    return decodeStored(storage.getItem(STORAGE_KEY));
  } catch {
    return {
      state: createInitialState(), raw: null, corruptRaw: null,
      error: "Este navegador no permite leer los datos guardados.",
    };
  }
}

export class DurableStore {
  private loaded: LoadedState;
  constructor(private storage: StorageLike) { this.loaded = loadStored(storage); }
  get snapshot(): LoadedState { return this.loaded; }

  /** Called after the exclusive browser lock is acquired or a storage event arrives. */
  refresh(): LoadedState {
    this.loaded = loadStored(this.storage);
    return this.loaded;
  }

  assertDurableWallet(walletId: string): void {
    if (this.loaded.corruptRaw || this.loaded.error)
      throw Error("Los datos de este navegador necesitan recuperación antes de usar Solana.");
    this.assertCurrent();
    if (!this.loaded.raw)
      throw Error("Guarda el perfil en este navegador antes de usar Solana.");
    if (!this.loaded.state.wallets.some((wallet) => wallet.id === walletId))
      throw Error("Este perfil ya no está guardado en este navegador.");
  }

  private assertCurrent(): void {
    let actual: string | null;
    try { actual = this.storage.getItem(STORAGE_KEY); }
    catch { throw Error("No pudimos comprobar los datos guardados en este navegador."); }
    if (actual !== this.loaded.raw)
      throw Error("Los datos cambiaron en otra pestaña. Recarga antes de continuar.");
  }

  replace(state: AppState, allowCorrupt = false): LoadedState {
    if (!isPersistableState(state)) throw Error("Los datos nuevos no tienen un formato válido.");
    if (this.loaded.corruptRaw !== null && !allowCorrupt)
      throw Error("Descarga o reemplaza explícitamente el registro dañado antes de guardar.");
    this.assertCurrent();
    const raw = JSON.stringify(state);
    try { this.storage.setItem(STORAGE_KEY, raw); }
    catch { throw Error("No pudimos guardar los datos en este navegador. Revisa el espacio disponible y vuelve a intentarlo."); }
    this.loaded = { state, raw, corruptRaw: null, error: null };
    return this.loaded;
  }

  mutate(change: (state: AppState) => AppState): LoadedState {
    if (this.loaded.error && this.loaded.corruptRaw === null)
      throw Error(this.loaded.error);
    return this.replace(change(this.loaded.state));
  }

  replaceCorruptWithSeed(): LoadedState {
    if (this.loaded.corruptRaw === null)
      throw Error("No hay un registro dañado que reemplazar.");
    return this.replace(createInitialState(), true);
  }
}

export interface Backup {
  format: "brote-backup";
  version: 1;
  exportedAt: string;
  /** Legacy, unverified hint. Verified bases are in state.guardianBases. */
  guardianAddress: string | null;
  state: AppState;
  /** Absent in older exports. Signed bytes and status travel with current exports. */
  signedOperations?: SignedOperation[];
}

function operationsMatchState(operations: SignedOperation[], state: AppState): boolean {
  const walletIds = new Set(state.wallets.map((wallet) => wallet.id));
  return operations.every((operation) => walletIds.has(operation.profileId) &&
    (state.guardianBases === undefined || state.guardianBases.some((base) =>
      base.walletId === operation.profileId && base.address === operation.guardian)));
}

export function operationsForBackup(state: AppState, operations: SignedOperation[]): SignedOperation[] {
  return operations.filter(operation => operation.state === "pending" || operationsMatchState([operation], state));
}

export function serializeBackup(
  state: AppState,
  exportedAt = new Date().toISOString(),
  signedOperations: SignedOperation[] = [],
): string {
  if (!isPersistableState(state)) throw Error("Los datos no tienen un formato válido para la copia.");
  if (!signedOperations.every(isSignedOperation) || !operationsMatchState(signedOperations, state))
    throw Error("El registro de transacciones no coincide con los perfiles guardados.");
  const backup: Backup = {
    format: "brote-backup", version: 1, exportedAt,
    guardianAddress: state.legacyGuardianAddress ?? null,
    state, signedOperations,
  };
  const json = JSON.stringify(backup);
  if (new Blob([json]).size > MAX_BACKUP_BYTES)
    throw Error("La copia excede el tamaño admitido.");
  return json;
}

export function parseBackup(json: string): Backup {
  if (new Blob([json]).size > MAX_BACKUP_BYTES)
    throw Error("Esta copia es demasiado grande.");
  let data: unknown;
  try { data = JSON.parse(json); }
  catch { throw Error("La copia no tiene un formato válido."); }
  if (!data || typeof data !== "object") throw Error("La copia no tiene un formato válido.");
  const candidate = data as Record<string, unknown>;
  if (
    candidate.format !== "brote-backup" || candidate.version !== 1 ||
    typeof candidate.exportedAt !== "string" ||
    !isPersistableState(candidate.state) ||
    (candidate.guardianAddress !== null && typeof candidate.guardianAddress !== "string") ||
    (candidate.signedOperations !== undefined &&
      (!Array.isArray(candidate.signedOperations) ||
        !candidate.signedOperations.every(isSignedOperation) ||
        new Set(candidate.signedOperations.map((item: SignedOperation) => item.signature)).size !== candidate.signedOperations.length ||
        !operationsMatchState(candidate.signedOperations, candidate.state as AppState)))
  ) throw Error("Esta copia no es compatible con Brote.");
  const state = candidate.state as AppState;
  const guardianAddress = candidate.guardianAddress as string | null;
  return {
    format: "brote-backup", version: 1, exportedAt: candidate.exportedAt as string,
    guardianAddress,
    signedOperations: candidate.signedOperations as SignedOperation[] | undefined,
    state: guardianAddress && state.legacyGuardianAddress === undefined
      ? { ...state, legacyGuardianAddress: guardianAddress }
      : state,
  };
}

/** Merge before restoring profile state. A failed journal write leaves that state untouched. */
export async function verifyBackupAccountDerivations(backup: Backup): Promise<void> {
  for (const operation of backup.signedOperations ?? []) {
    const guardian = new PublicKey(operation.guardian);
    const seed = await seedFor(operation.profileId);
    const expected = await PublicKey.createWithSeed(
      guardian, seed, SystemProgram.programId,
    );
    if (expected.toBase58() !== operation.profileAddress)
      throw Error("Una transacción firmada no corresponde a la cuenta del perfil indicada en la copia.");
    const instruction = Transaction.from(base64ToBytes(operation.bytes)).instructions[0];
    if (operation.kind === "create" && SystemInstruction.decodeCreateWithSeed(instruction).seed !== seed ||
        operation.kind === "withdraw" && SystemInstruction.decodeTransferWithSeed(instruction).seed !== seed)
      throw Error("Una transacción firmada usa una semilla distinta a la del perfil indicado en la copia.");
  }
}

export async function mergeBackupOperations(storage: OperationStorage, backup: Backup, assertCurrent: () => void = () => {}): Promise<SignedOperation[]> {
  const imported = backup.signedOperations ?? [];
  if (!imported.every(isSignedOperation) || !operationsMatchState(imported, backup.state))
    throw Error("Las transacciones de la copia no coinciden con sus perfiles.");
  await verifyBackupAccountDerivations(backup);
  assertCurrent();
  const journal = new OperationJournal(storage);
  const existing = journal.read();
  if (!operationsMatchState(existing.filter(operation => operation.state === "pending"), backup.state))
    throw Error("La copia debe conservar los perfiles y responsables de las firmas pendientes de este navegador.");
  if (imported.length === 0) return journal.read();
  return journal.merge(imported);
}

export type LockRequest = (name: string, options: LockOptions, callback: (lock: Lock | null) => Promise<void>) => Promise<void>;

/** One writer holds the lock for its mounted lifetime; queued tabs remain read-only. */
export function startWriterLease(
  request: LockRequest,
  onAcquired: () => void,
  onWaiting: () => void,
  onError: (error: unknown) => void,
): () => void {
  let active = true;
  let release: (() => void) | null = null;
  const controller = new AbortController();
  const hold = async (lock: Lock | null) => {
    if (!active || !lock) return;
    await new Promise<void>((resolve) => {
      release = resolve;
      if (!active) resolve();
      else onAcquired();
    });
    release = null;
  };
  void request(WRITER_LOCK, { ifAvailable: true }, async (lock) => {
    if (lock) { await hold(lock); return; }
    if (!active) return;
    onWaiting();
  }).then(() => {
    if (!active || release) return;
    return request(WRITER_LOCK, { signal: controller.signal }, hold);
  }).catch((error: unknown) => {
    if (active) onError(error);
  });
  return () => {
    active = false;
    controller.abort();
    release?.();
  };
}
