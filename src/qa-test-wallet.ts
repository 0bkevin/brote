import { PublicKey, Transaction } from "@solana/web3.js";
import { SOLANA_NETWORK } from "./solana-network";

type Listener = (...args: unknown[]) => void;

/** Explicitly named, disposable QA adapter. It has no key material in the browser. */
class BroteTestWallet {
  readonly name = "Test wallet";
  publicKey: PublicKey | null = null;
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  off(event: string, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
  }

  private async request(path: string, payload?: unknown): Promise<Record<string, unknown>> {
    const response = await fetch(`/__brote_test_wallet/${path}`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      ...(payload === undefined ? {} : {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    });
    let result: Record<string, unknown>;
    try { result = await response.json() as Record<string, unknown>; }
    catch { throw new Error("Test wallet endpoint is unavailable."); }
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Test wallet request failed.");
    return result;
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    const result = await this.request("connect", {});
    if (typeof result.publicKey !== "string") throw new Error("Test wallet did not return a public key.");
    const key = new PublicKey(result.publicKey);
    if (key.toBase58() !== result.publicKey) throw new Error("Test wallet returned an invalid public key.");
    this.publicKey = key;
    this.emit("connect", key);
    return { publicKey: key };
  }

  async disconnect(): Promise<void> {
    await this.request("disconnect", {});
    this.publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.publicKey) throw new Error("Connect the Test wallet before signing.");
    const bytes = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
    const result = await this.request("sign", { transaction: bytes.toString("base64") });
    if (typeof result.transaction !== "string") throw new Error("Test wallet returned an invalid signed transaction.");
    const signedBytes = Uint8Array.from(atob(result.transaction), (character) => character.charCodeAt(0));
    const signed = Transaction.from(signedBytes);
    if (!signed.feePayer?.equals(this.publicKey) || !signed.verifySignatures(true))
      throw new Error("Test wallet signature verification failed.");
    return signed;
  }
}

export function installBroteTestWallet(): void {
  if (!import.meta.env.DEV || import.meta.env.VITE_BROTE_TEST_WALLET !== "true" ||
      SOLANA_NETWORK.cluster !== "testnet") return;
  window.broteTestWallet ??= new BroteTestWallet();
}
