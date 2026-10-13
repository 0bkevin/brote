import { readFile, lstat } from "node:fs/promises";
import { Keypair, Connection, PublicKey, SystemInstruction, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js";

const PREFIX = "/__brote_test_wallet";
const MAX_LAMPORTS = 5 * 1_000_000_000;
const TESTNET_RPC = clusterApiUrl("testnet");

function enabled() {
  return process.env.BROTE_TEST_WALLET_PATH &&
    process.env.VITE_BROTE_TEST_WALLET === "true" &&
    process.env.VITE_SOLANA_NETWORK === "testnet";
}

function localHost(value) {
  if (typeof value !== "string" || value.length > 255) return false;
  try {
    const host = new URL(`http://${value}`).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch { return false; }
}

function localOrigin(value) {
  if (typeof value !== "string") return false;
  try {
    const origin = new URL(value);
    return (origin.protocol === "http:" || origin.protocol === "https:") &&
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname.toLowerCase());
  } catch { return false; }
}

async function loadKeypair() {
  const path = process.env.BROTE_TEST_WALLET_PATH;
  if (!path) throw new Error("Test wallet unavailable");
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o777) !== 0o600)
    throw new Error("Test wallet key file must be a regular 0600 file");
  const json = await readFile(path, "utf8");
  const bytes = JSON.parse(json);
  if (!Array.isArray(bytes) || bytes.length !== 64 || bytes.some((x) => !Number.isInteger(x) || x < 0 || x > 255))
    throw new Error("Invalid test wallet key file");
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

async function bodyJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16_000) throw new Error("Request too large");
  }
  return JSON.parse(body);
}

function positiveCapped(value) {
  if (typeof value === "bigint") return value > 0n && value <= BigInt(MAX_LAMPORTS);
  return Number.isSafeInteger(value) && value > 0 && value <= MAX_LAMPORTS;
}

export async function validateTransaction(transaction, guardian, connection) {
  if (transaction.instructions.length !== 1 ||
      !transaction.feePayer?.equals(guardian) ||
      typeof transaction.recentBlockhash !== "string" ||
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(transaction.recentBlockhash))
    throw new Error("Transaction shape rejected");

  if (await connection.getGenesisHash() !== "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY")
    throw new Error("Refusing to sign outside verified Solana testnet");
  const blockhash = await connection.isBlockhashValid(transaction.recentBlockhash, "confirmed");
  if (!blockhash.value) throw new Error("Recent blockhash is not valid on testnet");

  const instruction = transaction.instructions[0];
  if (!instruction.programId.equals(SystemProgram.programId)) throw new Error("Program rejected");
  let lamports;
  try {
    const type = SystemInstruction.decodeInstructionType(instruction);
    if (type === "CreateWithSeed") {
      const d = SystemInstruction.decodeCreateWithSeed(instruction);
      if (!d.fromPubkey.equals(guardian) || !d.basePubkey.equals(guardian) ||
          !d.programId.equals(SystemProgram.programId) || d.space !== 0 || !d.seed.startsWith("brote1-"))
        throw new Error();
      const derived = await PublicKey.createWithSeed(d.basePubkey, d.seed, d.programId);
      if (!derived.equals(d.newAccountPubkey)) throw new Error();
      lamports = d.lamports;
    } else if (type === "Transfer") {
      const d = SystemInstruction.decodeTransfer(instruction);
      if (!d.fromPubkey.equals(guardian)) throw new Error();
      lamports = d.lamports;
    } else if (type === "TransferWithSeed") {
      const d = SystemInstruction.decodeTransferWithSeed(instruction);
      if (!d.basePubkey.equals(guardian) || !d.programId.equals(SystemProgram.programId) || !d.seed.startsWith("brote1-"))
        throw new Error();
      const derived = await PublicKey.createWithSeed(d.basePubkey, d.seed, d.programId);
      if (!derived.equals(d.fromPubkey)) throw new Error();
      lamports = d.lamports;
    } else {
      throw new Error();
    }
  } catch { throw new Error("System instruction rejected"); }
  if (!positiveCapped(lamports)) throw new Error("Lamport amount rejected");
}

export function broteTestWalletPlugin() {
  return {
    name: "brote-local-test-wallet",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(`${PREFIX}/`)) return next();
        const path = req.url.split("?", 1)[0];
        const method = req.method || "";
        const allowedPath = path === `${PREFIX}/connect` || path === `${PREFIX}/sign` || path === `${PREFIX}/disconnect`;
        const host = req.headers.host;
        const origin = req.headers.origin;
        const boundAddress = server.httpServer?.address?.();
        const boundLoopback = boundAddress && typeof boundAddress === "object" &&
          (boundAddress.address === "127.0.0.1" || boundAddress.address === "::1");
        let matchingOrigin = false;
        try { matchingOrigin = !!origin && localOrigin(origin) && new URL(origin).host.toLowerCase() === String(host).toLowerCase(); }
        catch { matchingOrigin = false; }
        if (!enabled() || !allowedPath || !boundLoopback || !localHost(host) || !matchingOrigin) {
          res.statusCode = 404; res.end(); return;
        }
        if (method !== "POST") {
          res.statusCode = 405; res.end(); return;
        }
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        try {
          const wallet = await loadKeypair();
          if (path.endsWith("/connect")) {
            res.end(JSON.stringify({ publicKey: wallet.publicKey.toBase58() })); return;
          }
          if (path.endsWith("/disconnect")) { res.end(JSON.stringify({ ok: true })); return; }
          const payload = await bodyJson(req);
          if (typeof payload?.transaction !== "string" || payload.transaction.length > 16_000 ||
              !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload.transaction))
            throw new Error("Invalid transaction encoding");
          const bytes = Buffer.from(payload.transaction, "base64");
          if (!bytes.length || bytes.length > 1232 || bytes.toString("base64") !== payload.transaction)
            throw new Error("Invalid transaction size");
          const transaction = Transaction.from(bytes);
          if (transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).compare(bytes) !== 0)
            throw new Error("Invalid transaction serialization");
          if (transaction.signatures.some(({ signature }) => signature !== null))
            throw new Error("Only unsigned transactions are accepted");
          const connection = new Connection(TESTNET_RPC, "confirmed");
          await validateTransaction(transaction, wallet.publicKey, connection);
          transaction.partialSign(wallet);
          const signed = transaction.serialize({ requireAllSignatures: true, verifySignatures: true });
          res.end(JSON.stringify({ transaction: signed.toString("base64") }));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Request rejected" }));
        }
      });
    },
  };
}
