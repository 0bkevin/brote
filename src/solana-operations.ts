import { PublicKey, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import { encodeBase58 } from "./solana-utils";

export type OperationKind = "create" | "deposit" | "withdraw";
export type OperationState = "pending" | "confirmed" | "failed";

export type SignedOperation = {
  signature: string;
  bytes: string;
  blockhash: string;
  lastValidBlockHeight: number;
  guardian: string;
  profileId: string;
  profileAddress: string;
  kind: OperationKind;
  state: OperationState;
  createdAt: number;
  detail?: string;
};

export type OperationStorage = Pick<Storage, "getItem" | "setItem">;
export const SOLANA_OPERATIONS_KEY = "brote:solana:operations:v1";
const MAX_TERMINAL_RECORDS = 30;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export class OperationJournal {
  constructor(private readonly storage: OperationStorage, private readonly storageKey = SOLANA_OPERATIONS_KEY) {}

  read(): SignedOperation[] {
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.storageKey);
    } catch {
      throw new Error("No se pudo leer el registro local de transacciones. Se bloquearon nuevas operaciones.");
    }
    if (raw === null) return [];
    try {
      const records: unknown = JSON.parse(raw);
      if (!Array.isArray(records) || !records.every(isSignedOperation)) throw new Error();
      if (new Set(records.map((record) => record.signature)).size !== records.length) throw new Error();
      return records;
    } catch {
      throw new Error("El registro local de transacciones no se puede interpretar. Se bloquearon nuevas operaciones.");
    }
  }

  save(operation: SignedOperation): SignedOperation[] {
    if (!isSignedOperation(operation)) throw new Error("La transacción firmada no tiene un formato válido.");
    const records = this.read();
    const existing = records.find((record) => record.signature === operation.signature);
    const chosen = existing ? mergeOperation(existing, operation) : operation;
    return this.write([chosen, ...records.filter((record) => record.signature !== operation.signature)]);
  }

  /** One durable write; pending entries never expire from the journal. */
  merge(imported: SignedOperation[]): SignedOperation[] {
    if (!imported.every(isSignedOperation) ||
        new Set(imported.map((record) => record.signature)).size !== imported.length)
      throw new Error("La copia contiene transacciones firmadas inválidas.");
    const records = this.read();
    const bySignature = new Map(records.map((record) => [record.signature, record]));
    for (const record of imported) {
      const existing = bySignature.get(record.signature);
      // A backup is user-editable JSON. Its claimed terminal state is not chain
      // evidence, so every imported operation must be reconciled before it can
      // stop blocking new writes.
      const unverified = { ...record, state: "pending" as const, detail: undefined };
      bySignature.set(record.signature, existing ? mergeOperation(existing, unverified) : unverified);
    }
    return this.write([...bySignature.values()]);
  }

  private write(records: SignedOperation[]): SignedOperation[] {
    let terminal = 0;
    const next = records.filter((record) => record.state === "pending" || ++terminal <= MAX_TERMINAL_RECORDS);
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      throw new Error("No se pudo guardar el registro de la transacción. Se conservará el resultado anterior; verifica la firma antes de operar de nuevo.");
    }
    return next;
  }

  assertNoPending(): void {
    if (this.read().some((record) => record.state === "pending"))
      throw new Error("Hay una transacción sin resultado definitivo. Verifica su estado antes de firmar otra operación.");
  }
}

/** Quote the current RPC fee for the exact legacy transaction message. */
export async function estimateTransactionFee(
  transaction: Transaction,
  guardian: PublicKey,
  connection: {
    getLatestBlockhash: (commitment: "confirmed") => Promise<{ blockhash: string; lastValidBlockHeight: number }>;
    getFeeForMessage: (message: ReturnType<Transaction["compileMessage"]>, commitment: "confirmed") => Promise<{ value: number | null }>;
  },
): Promise<number> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = guardian;
  transaction.recentBlockhash = blockhash;
  const { value: fee } = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");
  if (fee === null || !Number.isSafeInteger(fee) || fee < 0)
    throw new Error("El RPC no pudo estimar la comisión de esta transacción.");
  return fee;
}

/** Recheck funds against the exact message prepared for wallet signing. */
export async function assertFinalTransactionFunds(
  transaction: Transaction,
  guardian: PublicKey,
  profileAddress: PublicKey,
  kind: OperationKind,
  connection: {
    getFeeForMessage: (message: ReturnType<Transaction["compileMessage"]>, commitment: "confirmed") => Promise<{ value: number | null }>;
    getBalance: (address: PublicKey, commitment: "confirmed") => Promise<number>;
    getMinimumBalanceForRentExemption: (dataLength: number, commitment: "confirmed") => Promise<number>;
  },
): Promise<void> {
  if (!transaction.feePayer?.equals(guardian) || !transaction.recentBlockhash ||
      transaction.instructions.length !== 1 ||
      !transaction.instructions[0].programId.equals(SystemProgram.programId))
    throw new Error("La transacción cambió antes de firmarse. No se envió.");

  const instruction = transaction.instructions[0];
  let amount = 0n;
  let guardianCredit = 0n;
  try {
    if (kind === "create") {
      const decoded = SystemInstruction.decodeCreateWithSeed(instruction);
      if (!decoded.fromPubkey.equals(guardian) || !decoded.basePubkey.equals(guardian) ||
          !decoded.newAccountPubkey.equals(profileAddress) ||
          !decoded.programId.equals(SystemProgram.programId) || decoded.space !== 0 ||
          !decoded.seed.startsWith("brote1-")) throw new Error();
      amount = BigInt(decoded.lamports);
    } else if (kind === "deposit") {
      const decoded = SystemInstruction.decodeTransfer(instruction);
      if (!decoded.fromPubkey.equals(guardian) || !decoded.toPubkey.equals(profileAddress)) throw new Error();
      amount = BigInt(decoded.lamports);
    } else {
      const decoded = SystemInstruction.decodeTransferWithSeed(instruction);
      if (!decoded.fromPubkey.equals(profileAddress) || !decoded.basePubkey.equals(guardian) ||
          !decoded.programId.equals(SystemProgram.programId) || !decoded.seed.startsWith("brote1-"))
        throw new Error();
      amount = BigInt(decoded.lamports);
      if (decoded.toPubkey.equals(guardian)) guardianCredit = amount;
    }
  } catch {
    throw new Error("La transacción cambió antes de firmarse. No se envió.");
  }
  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("La transacción cambió antes de firmarse. No se envió.");
  const debit = kind === "withdraw" ? 0n : amount;

  const { value: fee } = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");
  if (fee === null || !Number.isSafeInteger(fee) || fee < 0)
    throw new Error("El RPC no pudo estimar la comisión de esta transacción.");
  const balance = await connection.getBalance(guardian, "confirmed");
  if (!Number.isSafeInteger(balance) || balance < 0)
    throw new Error("El RPC devolvió un saldo inválido para la billetera del representante.");
  if (BigInt(balance) < debit + BigInt(fee))
    throw new Error(kind === "create"
      ? "Saldo insuficiente en la billetera del representante para crear la cuenta y pagar la comisión."
      : kind === "deposit"
        ? "Saldo insuficiente para el depósito y la comisión de red."
        : "El representante necesita SOL para la comisión de red.");
  const minimum = await connection.getMinimumBalanceForRentExemption(0, "confirmed");
  if (!Number.isSafeInteger(minimum) || minimum < 0)
    throw new Error("El RPC devolvió un saldo mínimo exento de renta inválido.");
  const afterFee = BigInt(balance) - BigInt(fee);
  const afterInstruction = afterFee - debit + guardianCredit;
  const isValidRemainder = (lamports: bigint) => lamports === 0n || lamports >= BigInt(minimum);
  if (!isValidRemainder(afterFee) || !isValidRemainder(afterInstruction))
    throw new Error("La billetera del representante debe quedar vacía o conservar su saldo mínimo exento de renta tras la comisión y la operación.");
}

function sameIdentity(left: SignedOperation, right: SignedOperation): boolean {
  return left.signature === right.signature && left.guardian === right.guardian &&
    left.profileId === right.profileId && left.bytes === right.bytes &&
    left.profileAddress === right.profileAddress && left.blockhash === right.blockhash &&
    left.lastValidBlockHeight === right.lastValidBlockHeight && left.kind === right.kind;
}

function mergeOperation(existing: SignedOperation, incoming: SignedOperation): SignedOperation {
  if (!sameIdentity(existing, incoming))
    throw new Error("La firma ya pertenece a otra operación; no se envió.");
  if (existing.state !== "pending") return existing;
  return incoming;
}

export function isSignedOperation(value: unknown): value is SignedOperation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SignedOperation>;
  if (typeof item.signature !== "string" || typeof item.bytes !== "string" ||
      typeof item.blockhash !== "string" || !Number.isSafeInteger(item.lastValidBlockHeight) ||
      (item.lastValidBlockHeight as number) < 0 || typeof item.guardian !== "string" ||
      typeof item.profileId !== "string" || !item.profileId || typeof item.profileAddress !== "string" ||
      (item.kind !== "create" && item.kind !== "deposit" && item.kind !== "withdraw") ||
      (item.state !== "pending" && item.state !== "confirmed" && item.state !== "failed") ||
      !Number.isSafeInteger(item.createdAt) || (item.createdAt as number) < 0 ||
      (item.detail !== undefined && (typeof item.detail !== "string" || item.detail.length > 10_000))) return false;
  try {
    const bytes = base64ToBytes(item.bytes);
    if (bytes.length === 0 || bytes.length > 1232 || bytesToBase64(bytes) !== item.bytes) return false;
    const transaction = Transaction.from(bytes);
    const roundTrip = transaction.serialize();
    if (roundTrip.length !== bytes.length || roundTrip.some((byte, index) => byte !== bytes[index])) return false;
    if (!transaction.signature || !transaction.verifySignatures(true) ||
        encodeBase58(transaction.signature) !== item.signature ||
        transaction.feePayer?.toBase58() !== item.guardian ||
        transaction.recentBlockhash !== item.blockhash || transaction.instructions.length !== 1) return false;
    const instruction = transaction.instructions[0];
    if (!instruction.programId.equals(SystemProgram.programId)) return false;
    const guardian = new PublicKey(item.guardian);
    const profile = new PublicKey(item.profileAddress);
    if (guardian.toBase58() !== item.guardian || profile.toBase58() !== item.profileAddress) return false;
    if (item.kind === "create") {
      const decoded = SystemInstruction.decodeCreateWithSeed(instruction);
      return decoded.fromPubkey.equals(guardian) && decoded.basePubkey.equals(guardian) &&
        decoded.newAccountPubkey.equals(profile) && decoded.programId.equals(SystemProgram.programId) &&
        decoded.space === 0 && decoded.lamports > 0 && decoded.seed.startsWith("brote1-");
    }
    if (item.kind === "deposit") {
      const decoded = SystemInstruction.decodeTransfer(instruction);
      return decoded.fromPubkey.equals(guardian) && decoded.toPubkey.equals(profile) && decoded.lamports > 0;
    }
    const decoded = SystemInstruction.decodeTransferWithSeed(instruction);
    return decoded.fromPubkey.equals(profile) && decoded.basePubkey.equals(guardian) &&
      decoded.programId.equals(SystemProgram.programId) && decoded.lamports > 0 && decoded.seed.startsWith("brote1-");
  } catch {
    return false;
  }
}

export class SigningSession {
  private generation = 0;
  private provider: object | null = null;
  private address: string | null = null;
  private mounted = true;

  mount(): void {
    this.mounted = true;
  }

  invalidate(): void {
    this.generation++;
  }

  set(provider: object | null, address: string | null): void {
    this.generation++;
    this.provider = provider;
    this.address = address;
  }

  unmount(): void {
    this.generation++;
    this.mounted = false;
  }

  snapshot(provider: object, address: string): { provider: object; address: string; generation: number } {
    if (!this.mounted || this.provider !== provider || this.address !== address)
      throw new Error("La sesión de la billetera cambió. Vuelve a conectar.");
    return { provider, address, generation: this.generation };
  }

  assert(snapshot: { provider: object; address: string; generation: number }, currentPublicKey: string | null): void {
    if (!this.mounted || this.generation !== snapshot.generation ||
        this.provider !== snapshot.provider || this.address !== snapshot.address ||
        currentPublicKey !== snapshot.address)
      throw new Error("La sesión de la billetera cambió. No se envió la transacción.");
  }
}

export class UnconfirmedTransactionError extends Error {
  constructor(public readonly signature: string, cause: unknown) {
    super(`La transacción fue firmada, pero el RPC no confirmó si se envió o ejecutó: ${cause instanceof Error ? cause.message : String(cause)}. Verifica el estado antes de reintentar.`);
    this.name = "UnconfirmedTransactionError";
  }
}

export async function signAndSendOperation(args: {
  transaction: Transaction;
  provider: { signTransaction: (transaction: Transaction) => Promise<Transaction> };
  guardian: PublicKey;
  connection: {
    getLatestBlockhash: (commitment: "confirmed") => Promise<{ blockhash: string; lastValidBlockHeight: number }>;
    sendRawTransaction: (bytes: Uint8Array) => Promise<string>;
    confirmTransaction: (strategy: { signature: string; blockhash: string; lastValidBlockHeight: number }, commitment: "confirmed") => Promise<{ value: { err: unknown } }>;
  };
  assertSession: () => void;
  journal: OperationJournal;
  save: (operation: SignedOperation) => void;
  profileId: string;
  profileAddress: string;
  kind: OperationKind;
  beforeSign?: (transaction: Transaction) => Promise<void>;
  confirmWithTimeout?: <T>(promise: Promise<T>) => Promise<T>;
}): Promise<SignedOperation> {
  const { transaction, provider, guardian, connection, assertSession, journal, save } = args;
  assertSession();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  assertSession();
  transaction.feePayer = guardian;
  transaction.recentBlockhash = blockhash;
  const expectedMessage = transaction.serializeMessage();
  if (args.beforeSign) {
    await args.beforeSign(transaction);
    assertSession();
    const checkedMessage = transaction.serializeMessage();
    if (expectedMessage.length !== checkedMessage.length ||
        expectedMessage.some((byte, index) => byte !== checkedMessage[index]))
      throw new Error("La transacción cambió antes de firmarse. No se envió.");
  }
  assertSession();
  const signed = await provider.signTransaction(transaction);
  assertSession();
  const signedMessage = signed.serializeMessage();
  if (expectedMessage.length !== signedMessage.length ||
      expectedMessage.some((byte, index) => byte !== signedMessage[index]))
    throw new Error("La billetera devolvió una transacción distinta; no se envió.");
  const serialized = signed.serialize();
  if (!signed.signature)
    throw new Error("La billetera no firmó la transacción requerida; no se envió.");
  const signature = encodeBase58(signed.signature);
  journal.assertNoPending();
  const operation: SignedOperation = {
    signature,
    bytes: bytesToBase64(serialized),
    blockhash,
    lastValidBlockHeight,
    guardian: guardian.toBase58(),
    profileId: args.profileId,
    profileAddress: args.profileAddress,
    kind: args.kind,
    state: "pending",
    createdAt: Date.now(),
  };
  save(operation);
  assertSession();
  let returned: string;
  try {
    returned = await connection.sendRawTransaction(serialized);
  } catch (error) {
    throw new UnconfirmedTransactionError(signature, error);
  }
  if (returned !== signature)
    throw new UnconfirmedTransactionError(signature, new Error("El RPC devolvió una firma distinta a la transacción firmada."));
  let confirmation: { value: { err: unknown } };
  try {
    const pending = connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    confirmation = await (args.confirmWithTimeout ? args.confirmWithTimeout(pending) : pending);
  } catch (error) {
    throw new UnconfirmedTransactionError(signature, error);
  }
  if (confirmation.value.err) {
    save({ ...operation, state: "failed", detail: JSON.stringify(confirmation.value.err) });
    throw new Error(`La transacción falló: ${JSON.stringify(confirmation.value.err)}. Firma: ${signature}`);
  }
  const confirmed = { ...operation, state: "confirmed" as const };
  save(confirmed);
  return confirmed;
}

export async function rebroadcastSignedOperation(
  operation: SignedOperation,
  rpc: {
    getBlockHeight: (commitment: "confirmed") => Promise<number>;
    sendRawTransaction: (bytes: Uint8Array) => Promise<string>;
  },
  assertSession: () => void,
): Promise<void> {
  assertSession();
  const height = await rpc.getBlockHeight("confirmed");
  assertSession();
  if (height > operation.lastValidBlockHeight)
    throw new Error("La transacción firmada venció. Su resultado sigue sin resolverse; no se creó otra firma.");
  try {
    const returned = await rpc.sendRawTransaction(base64ToBytes(operation.bytes));
    if (returned !== operation.signature)
      throw new Error("El RPC devolvió una firma distinta.");
  } catch (error) {
    throw new UnconfirmedTransactionError(operation.signature, error);
  }
}

export type Reconciliation = { state: OperationState; detail: string; expired: boolean };

export async function reconcileOperation(
  operation: SignedOperation,
  rpc: {
    getSignatureStatuses: (signatures: string[], options: { searchTransactionHistory: boolean }) => Promise<{ value: ({ err: unknown; confirmationStatus?: string | null; confirmations?: number | null } | null)[] }>;
    getBlockHeight: (commitment: "confirmed") => Promise<number>;
    getSignaturesForAddress: (address: unknown, options: { limit: number }, commitment: "confirmed") => Promise<{ signature: string; err: unknown; confirmationStatus?: string | null }[]>;
  },
  profileKey: unknown,
): Promise<Reconciliation> {
  const status = (await rpc.getSignatureStatuses([operation.signature], { searchTransactionHistory: true })).value[0];
  if (status) {
    const settled = status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized" ||
      (status.confirmationStatus == null && typeof status.confirmations === "number" && status.confirmations > 0);
    if (settled) return {
      state: status.err ? "failed" : "confirmed",
      detail: status.err ? "La red confirmó que la transacción falló." : "La red confirmó la transacción.",
      expired: false,
    };
  }
  const height = await rpc.getBlockHeight("confirmed");
  const expired = height > operation.lastValidBlockHeight;
  const history = await rpc.getSignaturesForAddress(profileKey, { limit: 100 }, "confirmed");
  const entry = history.find((item) => item.signature === operation.signature);
  if (entry) return {
    state: entry.err ? "failed" : "confirmed",
    detail: entry.err ? "El historial registra la transacción como fallida." : "El historial registra la transacción como confirmada.",
    expired,
  };
  return {
    state: "pending",
    detail: expired
      ? "El bloque de validez venció, pero la ausencia en el historial reciente no demuestra que la transacción no se ejecutó. Sigue pendiente de verificación."
      : "La firma aún no aparece confirmada. Puedes reenviar exactamente la misma transacción firmada.",
    expired,
  };
}

