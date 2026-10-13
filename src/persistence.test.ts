import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, createWalletState } from "./domain";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  DurableStore, STORAGE_KEY, WRITER_LOCK, decodeStored, mergeBackupOperations, operationsForBackup, parseBackup, serializeBackup,
  storageKeysForCluster,
  startWriterLease, type LockRequest,
} from "./persistence";
import { OperationJournal, SOLANA_OPERATIONS_KEY, bytesToBase64, type SignedOperation } from "./solana-operations";
import { encodeBase58, seedFor } from "./solana-utils";
import { resolveSolanaNetwork } from "./solana-network";

class MemoryStorage {
  data = new Map<string, string>();
  failWrite = false;
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrite) throw Error("quota");
    this.data.set(key, value);
  }
}

const addressA = "11111111111111111111111111111111";
const addressB = "Vote111111111111111111111111111111111111111";

test("a failed write leaves the durable state and profile IDs unchanged", () => {
  const storage = new MemoryStorage();
  const store = new DurableStore(storage);
  storage.failWrite = true;
  const result = createWalletState(store.snapshot.state, {
    name: "Luz", relationship: "Hija", kind: "child", avatar: "fox", color: "mint",
  });
  assert.throws(() => store.replace(result.state), /guardar/);
  assert.equal(store.snapshot.state.wallets.length, 3);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.throws(() => store.assertDurableWallet(result.wallet.id), /Guarda/);
});

test("a damaged record is retained byte for byte until explicit replacement", () => {
  const storage = new MemoryStorage();
  const damaged = '{"wallets":[{"id":"custom-recover-me"}],';
  storage.setItem(STORAGE_KEY, damaged);
  const store = new DurableStore(storage);
  assert.equal(store.snapshot.corruptRaw, damaged);
  assert.equal(decodeStored(damaged).corruptRaw, damaged);
  assert.throws(() => store.replace(createInitialState()), /reemplaza/);
  assert.equal(storage.getItem(STORAGE_KEY), damaged);
  store.replaceCorruptWithSeed();
  assert.notEqual(storage.getItem(STORAGE_KEY), damaged);
});

test("stale tabs cannot overwrite a new profile even if they bypass the lease", () => {
  const storage = new MemoryStorage();
  const first = new DurableStore(storage);
  const stale = new DurableStore(storage);
  const result = createWalletState(first.snapshot.state, {
    name: "Luz", relationship: "Hija", kind: "child", avatar: "fox", color: "mint",
  });
  first.replace(result.state);
  assert.throws(() => stale.replace({ ...stale.snapshot.state, transactions: [] }), /otra pestaña/);
  assert.throws(() => stale.replace(createInitialState()), /otra pestaña/);
  assert.ok(new DurableStore(storage).snapshot.state.wallets.some((w) => w.id === result.wallet.id));
  stale.refresh();
  assert.ok(stale.snapshot.state.wallets.some((w) => w.id === result.wallet.id));
});

test("verified guardian bases and a legacy recovery hint survive export and restore", () => {
  const state = {
    ...createInitialState(),
    guardianBases: [
      { walletId: "sofia", address: addressA },
      { walletId: "sofia", address: addressB },
    ],
  };
  const restored = parseBackup(serializeBackup(state));
  assert.deepEqual(restored.state.guardianBases, state.guardianBases);
  const legacy = JSON.stringify({
    format: "brote-backup", version: 1, exportedAt: new Date().toISOString(),
    guardianAddress: addressA, state: createInitialState(),
  });
  const imported = parseBackup(legacy);
  assert.equal(imported.state.legacyGuardianAddress, addressA);
  assert.equal(imported.state.guardianBases, undefined);
});

test("backups declare their network and reject cross-network or untagged testnet restores", () => {
  const state = createInitialState();
  const mainnet = serializeBackup(state);
  const testnet = serializeBackup(state, undefined, [], "testnet");
  assert.equal(parseBackup(mainnet).solanaNetwork, "mainnet");
  assert.equal(parseBackup(testnet, "testnet").solanaNetwork, "testnet");
  assert.throws(() => parseBackup(mainnet, "testnet"), /otra red Solana/);
  assert.throws(() => parseBackup(testnet), /otra red Solana/);
  const legacy = JSON.stringify({
    format: "brote-backup", version: 1, exportedAt: new Date().toISOString(),
    guardianAddress: null, state,
  });
  assert.equal(parseBackup(legacy).solanaNetwork, undefined);
  assert.throws(() => parseBackup(legacy, "testnet"), /otra red Solana/);
  assert.throws(() => parseBackup(JSON.stringify({ ...JSON.parse(mainnet), solanaNetwork: "devnet" })), /compatible/);
});

test("profile data and writer locks have distinct keys on testnet", () => {
  const mainnet = storageKeysForCluster("mainnet");
  const testnet = storageKeysForCluster("testnet");
  assert.deepEqual(mainnet, { storage: "brote-demo-v1", writerLock: "brote-demo-v1-writer" });
  assert.equal(STORAGE_KEY, mainnet.storage);
  assert.equal(WRITER_LOCK, mainnet.writerLock);
  assert.notEqual(testnet.storage, mainnet.storage);
  assert.notEqual(testnet.writerLock, mainnet.writerLock);
});

test("a generated large compact backup can be imported", () => {
  const state = createInitialState();
  const template = state.transactions[0];
  state.transactions = Array.from({ length: 26_000 }, (_, i) => ({
    ...template, id: `generated-${i}`, title: `Movimiento ${i} ${"ñ".repeat(90)}`,
  }));
  const json = serializeBackup(state);
  assert.ok(new Blob([json]).size > 5_000_000);
  assert.equal(parseBackup(json).state.transactions.length, 26_000);
});

test("the second tab waits read-only and acquires the lease after release", async () => {
  let occupied = true;
  let queued: ((lock: Lock | null) => Promise<void>) | undefined;
  const fakeRequest: LockRequest = async (_name, options, callback) => {
    if (options.ifAvailable) {
      await callback(occupied ? null : ({} as Lock));
    } else {
      queued = callback;
    }
  };
  const events: string[] = [];
  const stop = startWriterLease(
    fakeRequest, () => events.push("writer"), () => events.push("reader"),
    () => events.push("error"),
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["reader"]);
  assert.ok(queued);
  occupied = false;
  const acquired = queued!({} as Lock);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["reader", "writer"]);
  stop();
  await acquired;
});

async function signedBackupFixture() {
  const guardian = Keypair.generate();
  const profileId = "sofia";
  const profileAddress = await PublicKey.createWithSeed(
    guardian.publicKey, await seedFor(profileId), SystemProgram.programId,
  );
  const transaction = new Transaction().add(SystemProgram.transfer({
    fromPubkey: guardian.publicKey, toPubkey: profileAddress, lamports: 1,
  }));
  transaction.feePayer = guardian.publicKey;
  transaction.recentBlockhash = "11111111111111111111111111111111";
  transaction.sign(guardian);
  const operation: SignedOperation = {
    signature: encodeBase58(transaction.signature!),
    bytes: bytesToBase64(transaction.serialize()),
    blockhash: transaction.recentBlockhash,
    lastValidBlockHeight: 100,
    guardian: guardian.publicKey.toBase58(),
    profileId, profileAddress: profileAddress.toBase58(),
    kind: "deposit", state: "pending", createdAt: Date.now(),
  };
  const state = { ...createInitialState(), guardianBases: [
    { walletId: profileId, address: guardian.publicKey.toBase58() },
  ] };
  return { operation, state };
}

test("a current backup carries pending signed bytes and blocks a new signature after import", async () => {
  const { operation, state } = await signedBackupFixture();
  const original = new MemoryStorage();
  new OperationJournal(original).save(operation);
  const backup = parseBackup(serializeBackup(state, undefined, new OperationJournal(original).read()));
  const fresh = new MemoryStorage();
  await mergeBackupOperations(fresh, backup);
  assert.deepEqual(new OperationJournal(fresh).read(), [operation]);
  assert.throws(() => new OperationJournal(fresh).assertNoPending(), /sin resultado definitivo/);
});

test("testnet restore reads and writes only the testnet operation journal", async () => {
  const { operation, state } = await signedBackupFixture();
  const { operation: unrelatedMainnetOperation } = await signedBackupFixture();
  const storage = new MemoryStorage();
  const testnet = resolveSolanaNetwork("testnet");
  new OperationJournal(storage).save(unrelatedMainnetOperation);
  const mainnetBefore = storage.getItem(SOLANA_OPERATIONS_KEY);
  const backup = parseBackup(serializeBackup(state, undefined, [operation], "testnet"), "testnet");
  await mergeBackupOperations(storage, backup, () => {}, testnet);
  assert.deepEqual(new OperationJournal(storage, testnet.operationsKey).read(), [operation]);
  assert.equal(storage.getItem(SOLANA_OPERATIONS_KEY), mainnetBefore);
  await assert.rejects(mergeBackupOperations(storage, backup), /otra red Solana/);
});

test("an older backup cannot clear an existing pending signature", async () => {
  const { operation, state } = await signedBackupFixture();
  const storage = new MemoryStorage();
  new OperationJournal(storage).save(operation);
  const oldBackup = parseBackup(JSON.stringify({
    format: "brote-backup", version: 1, exportedAt: new Date().toISOString(),
    guardianAddress: null, state,
  }));
  await mergeBackupOperations(storage, oldBackup);
  assert.equal(new OperationJournal(storage).read()[0].signature, operation.signature);
  assert.throws(() => new OperationJournal(storage).assertNoPending());
});

test("restoring cannot orphan a local pending profile or write after cancellation", async () => {
  const { operation, state } = await signedBackupFixture();
  const storage = new MemoryStorage();
  new OperationJournal(storage).save(operation);
  const prior = storage.getItem(SOLANA_OPERATIONS_KEY);
  const missing = { ...state, wallets: state.wallets.filter(wallet => wallet.id !== operation.profileId),
    transactions: state.transactions.filter(tx => tx.walletId !== operation.profileId), guardianBases: [] };
  await assert.rejects(mergeBackupOperations(storage, parseBackup(serializeBackup(missing))), /conservar los perfiles/);
  await assert.rejects(mergeBackupOperations(storage, parseBackup(serializeBackup(state, undefined, [operation])),
    () => { throw Error("Restauración cancelada."); }), /cancelada/);
  assert.equal(storage.getItem(SOLANA_OPERATIONS_KEY), prior);
});

test("a valid backup explicitly restores damaged or empty profile storage", () => {
  for (const raw of ["", '{"wallets":[{"id":"recover-me"}],']) {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    const durable = new DurableStore(storage);
    const state = parseBackup(serializeBackup(createInitialState())).state;
    durable.replace(state, true);
    assert.equal(durable.snapshot.corruptRaw, null);
    assert.ok(durable.snapshot.raw);
  }
});

test("reset plus a new guardian excludes obsolete terminal records but never drops pending signatures", async () => {
  const { operation, state } = await signedBackupFixture();
  const next = { ...createInitialState(), guardianBases: [{ walletId: operation.profileId, address: addressB }] };
  const completed = { ...operation, state: "confirmed" as const };
  assert.deepEqual(operationsForBackup(next, [completed]), []);
  assert.ok(parseBackup(serializeBackup(next, undefined, operationsForBackup(next, [completed]))));
  assert.deepEqual(operationsForBackup(next, [operation]), [operation]);
  assert.throws(() => serializeBackup(next, undefined, operationsForBackup(next, [operation])), /no coincide/);
  assert.deepEqual(operationsForBackup(state, [completed]), [completed]);
});

test("a failed journal write aborts restore before profile state is replaced", async () => {
  const { operation, state } = await signedBackupFixture();
  const storage = new MemoryStorage();
  const durable = new DurableStore(storage);
  durable.replace(createInitialState());
  const prior = storage.getItem(STORAGE_KEY);
  storage.failWrite = true;
  await assert.rejects(
    mergeBackupOperations(storage, parseBackup(serializeBackup(state, undefined, [operation]))),
    /No se pudo guardar/,
  );
  assert.equal(storage.getItem(STORAGE_KEY), prior);
  assert.equal(new OperationJournal(storage).read().length, 0);
});

test("backup import rejects tampered signatures, bytes, and profile account metadata", async () => {
  const { operation, state } = await signedBackupFixture();
  const base = parseBackup(serializeBackup(state, undefined, [operation]));
  assert.throws(() => parseBackup(JSON.stringify({
    ...base, signedOperations: [{ ...operation, signature: "arbitrary" }],
  })), /compatible/);
  assert.throws(() => parseBackup(JSON.stringify({
    ...base, signedOperations: [{ ...operation, bytes: "AA==" }],
  })), /compatible/);
  const wrongAccount = {
    ...base,
    signedOperations: [{ ...operation, profileAddress: Keypair.generate().publicKey.toBase58() }],
  };
  assert.throws(() => parseBackup(JSON.stringify(wrongAccount)), /compatible/);
  const otherProfile = { ...base,
    state: { ...base.state, guardianBases: [
      ...base.state.guardianBases!,
      { walletId: "mateo", address: operation.guardian },
    ] },
    signedOperations: [{ ...operation, profileId: "mateo" }],
  };
  await assert.rejects(
    mergeBackupOperations(new MemoryStorage(), parseBackup(JSON.stringify(otherProfile))),
    /no corresponde a la cuenta/,
  );
});
