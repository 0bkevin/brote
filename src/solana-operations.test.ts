import test from "node:test";
import assert from "node:assert/strict";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  OperationJournal,
  SigningSession,
  UnconfirmedTransactionError,
  base64ToBytes,
  bytesToBase64,
  rebroadcastSignedOperation,
  reconcileOperation,
  signAndSendOperation,
  type OperationKind,
  type SignedOperation,
} from "./solana-operations";
import { encodeBase58, seedFor } from "./solana-utils";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function memoryStorage(failWrite = false) {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failWrite) throw new Error("quota");
      values.set(key, value);
    },
  };
}

function fixture(kind: OperationKind = "deposit", storage = memoryStorage()) {
  const guardian = Keypair.generate();
  const destination = Keypair.generate().publicKey;
  const provider = { signTransaction: async (transaction: Transaction) => {
    transaction.partialSign(guardian);
    return transaction;
  } };
  const session = new SigningSession();
  session.set(provider, guardian.publicKey.toBase58());
  const snapshot = session.snapshot(provider, guardian.publicKey.toBase58());
  let currentKey = guardian.publicKey.toBase58();
  const assertSession = () => session.assert(snapshot, currentKey);
  const journal = new OperationJournal(storage);
  const sent: Uint8Array[] = [];
  const rpc = {
    getLatestBlockhash: async () => ({ blockhash: "11111111111111111111111111111111", lastValidBlockHeight: 100 }),
    sendRawTransaction: async (bytes: Uint8Array) => { sent.push(bytes); return journal.read()[0].signature; },
    confirmTransaction: async () => ({ value: { err: null } }),
  };
  const transaction = new Transaction().add(kind === "withdraw"
    ? SystemProgram.transfer({
      fromPubkey: guardian.publicKey,
      basePubkey: guardian.publicKey,
      toPubkey: destination,
      lamports: 1,
      seed: "brote1-test",
      programId: SystemProgram.programId,
    })
    : SystemProgram.transfer({
      fromPubkey: guardian.publicKey,
      toPubkey: destination,
      lamports: 1,
    }));
  const submit = () => signAndSendOperation({
    transaction,
    provider,
    guardian: guardian.publicKey,
    connection: rpc,
    assertSession,
    journal,
    save: (operation: SignedOperation) => { journal.save(operation); },
    profileId: "profile-a",
    profileAddress: (kind === "withdraw" ? guardian.publicKey : destination).toBase58(),
    kind,
  });
  return { guardian, provider, session, journal, rpc, sent, submit, assertSession, setKey: (key: string) => { currentKey = key; } };
}

test("accepted send with lost response persists the original signature and retries identical bytes", async () => {
  const storage = memoryStorage();
  const fx = fixture("deposit", storage);
  const originalSend = fx.rpc.sendRawTransaction;
  fx.rpc.sendRawTransaction = async (bytes) => {
    await originalSend(bytes);
    throw new Error("response lost");
  };
  await assert.rejects(fx.submit(), UnconfirmedTransactionError);
  const pending = fx.journal.read()[0];
  assert.equal(pending.state, "pending");
  assert.deepEqual(Array.from(base64ToBytes(pending.bytes)), Array.from(fx.sent[0]));
  assert.throws(() => fx.journal.assertNoPending(), /sin resultado definitivo/);
  await rebroadcastSignedOperation(pending, {
    getBlockHeight: async () => 99,
    sendRawTransaction: async (bytes) => {
      fx.sent.push(bytes);
      return pending.signature;
    },
  }, () => {});
  assert.deepEqual(Array.from(fx.sent[1]), Array.from(fx.sent[0]));
  assert.equal(new OperationJournal(storage).read()[0].signature, pending.signature);
});

test("all three flows stop before signing when account changes during blockhash fetch", async () => {
  for (const kind of ["create", "deposit", "withdraw"] as const) {
    const fx = fixture(kind);
    const wait = deferred<{ blockhash: string; lastValidBlockHeight: number }>();
    fx.rpc.getLatestBlockhash = () => wait.promise;
    const running = fx.submit();
    fx.session.set(fx.provider, Keypair.generate().publicKey.toBase58());
    wait.resolve({ blockhash: "11111111111111111111111111111111", lastValidBlockHeight: 100 });
    await assert.rejects(running, /sesión de la billetera cambió/);
    assert.equal(fx.sent.length, 0);
    assert.equal(fx.journal.read().length, 0);
  }
});

test("all three flows stop before broadcast when account changes during wallet signing", async () => {
  for (const kind of ["create", "deposit", "withdraw"] as const) {
    const fx = fixture(kind);
    const wait = deferred<Transaction>();
    fx.provider.signTransaction = () => wait.promise;
    const running = fx.submit();
    await Promise.resolve();
    await Promise.resolve();
    fx.session.set(fx.provider, Keypair.generate().publicKey.toBase58());
    wait.resolve(new Transaction());
    await assert.rejects(running, /sesión de la billetera cambió/);
    assert.equal(fx.sent.length, 0);
  }
});

test("unmount and reconnect invalidate a prior signing snapshot", () => {
  const fx = fixture();
  fx.session.invalidate();
  assert.throws(fx.assertSession);
  fx.session.unmount();
  assert.throws(() => fx.session.snapshot(fx.provider, fx.guardian.publicKey.toBase58()));
  fx.session.mount();
  fx.session.set(fx.provider, fx.guardian.publicKey.toBase58());
  assert.throws(fx.assertSession);
});

test("failed persistence prevents broadcast", async () => {
  const fx = fixture("deposit", memoryStorage(true));
  await assert.rejects(fx.submit(), /No se pudo guardar/);
  assert.equal(fx.sent.length, 0);
});

test("unreadable or corrupt storage fails closed", () => {
  const unreadable = new OperationJournal({
    getItem: () => { throw new Error("denied"); },
    setItem: () => {},
  });
  assert.throws(() => unreadable.assertNoPending(), /bloquearon nuevas operaciones/);
  const corrupt = new OperationJournal({ getItem: () => "", setItem: () => {} });
  assert.throws(() => corrupt.assertNoPending(), /no se puede interpretar/);
});

test("session invalidation after persistence blocks broadcast and retains the signed record", async () => {
  const fx = fixture();
  const originalSave = fx.journal.save.bind(fx.journal);
  fx.journal.save = (operation) => {
    const next = originalSave(operation);
    fx.session.set(null, null);
    return next;
  };
  await assert.rejects(fx.submit(), /sesión de la billetera cambió/);
  assert.equal(fx.sent.length, 0);
  assert.equal(fx.journal.read()[0].state, "pending");
});

test("confirmation survives a later refresh failure and reload", async () => {
  const storage = memoryStorage();
  const fx = fixture("withdraw", storage);
  const receipt = await fx.submit();
  await assert.rejects(async () => { throw new Error("refresh unavailable"); });
  assert.equal(receipt.state, "confirmed");
  assert.equal(new OperationJournal(storage).read()[0].state, "confirmed");
});

test("expiry plus absent recent history remains unresolved; status or history settles it", async () => {
  const fx = fixture();
  const operation: SignedOperation = {
    signature: "signature", bytes: "AA==", blockhash: "blockhash", lastValidBlockHeight: 100,
    guardian: fx.guardian.publicKey.toBase58(), profileId: "profile-a",
    profileAddress: fx.guardian.publicKey.toBase58(), kind: "deposit", state: "pending", createdAt: Date.now(),
  };
  const rpc = {
    getSignatureStatuses: async () => ({ value: [null] }),
    getBlockHeight: async () => 101,
    getSignaturesForAddress: async () => [] as { signature: string; err: unknown }[],
  };
  assert.equal((await reconcileOperation(operation, rpc, fx.guardian.publicKey)).state, "pending");
  const processed = {
    ...rpc,
    getSignatureStatuses: async () => ({ value: [{ err: { InstructionError: [0, "Custom"] }, confirmationStatus: "processed", confirmations: 0 }] }),
  };
  assert.equal((await reconcileOperation(operation, processed, fx.guardian.publicKey)).state, "pending");
  rpc.getSignaturesForAddress = async () => [{ signature: "signature", err: null }];
  assert.equal((await reconcileOperation(operation, rpc, fx.guardian.publicKey)).state, "confirmed");
});

test("out-of-order checks cannot downgrade a confirmed or failed signature", async () => {
  const confirmed = fixture();
  const receipt = await confirmed.submit();
  confirmed.journal.save({ ...receipt, state: "pending", detail: "older RPC result" });
  assert.equal(confirmed.journal.read()[0].state, "confirmed");

  const failed = fixture();
  failed.rpc.sendRawTransaction = async () => { throw Error("response lost"); };
  await assert.rejects(failed.submit(), UnconfirmedTransactionError);
  const pending = failed.journal.read()[0];
  failed.journal.save({ ...pending, state: "failed" });
  failed.journal.save({ ...pending, state: "pending" });
  assert.equal(failed.journal.read()[0].state, "failed");
});

test("one signature cannot change its immutable transaction identity", async () => {
  const fx = fixture();
  const receipt = await fx.submit();
  assert.throws(() => fx.journal.save({ ...receipt, profileId: "another-profile" }), /otra operación/);
  assert.throws(() => fx.journal.save({ ...receipt, kind: "withdraw" }), /formato válido/);
  assert.equal(fx.journal.read()[0].profileId, "profile-a");
});

test("pending signatures survive terminal-history pruning", async () => {
  const shared = new OperationJournal(memoryStorage());
  const pendingFx = fixture();
  pendingFx.rpc.sendRawTransaction = async () => { throw Error("response lost"); };
  await assert.rejects(pendingFx.submit(), UnconfirmedTransactionError);
  const pending = pendingFx.journal.read()[0];
  shared.save(pending);
  for (let index = 0; index < 32; index++) {
    const fx = fixture();
    shared.save(await fx.submit());
  }
  assert.equal(shared.read().filter((record) => record.state === "pending").length, 1);
  assert.equal(shared.read().filter((record) => record.state !== "pending").length, 30);
});

test("the journal accepts actual create and withdraw transactions with the derived profile account", async () => {
  const guardian = Keypair.generate();
  const seed = await seedFor("profile-a");
  const profile = await PublicKey.createWithSeed(guardian.publicKey, seed, SystemProgram.programId);
  const destination = Keypair.generate().publicKey;
  const instructions = [
    { kind: "create" as const, instruction: SystemProgram.createAccountWithSeed({
      fromPubkey: guardian.publicKey, basePubkey: guardian.publicKey,
      newAccountPubkey: profile, seed, lamports: 1, space: 0,
      programId: SystemProgram.programId,
    }) },
    { kind: "withdraw" as const, instruction: SystemProgram.transfer({
      fromPubkey: profile, basePubkey: guardian.publicKey, toPubkey: destination,
      lamports: 1, seed, programId: SystemProgram.programId,
    }) },
  ];
  for (const { kind, instruction } of instructions) {
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = guardian.publicKey;
    transaction.recentBlockhash = "11111111111111111111111111111111";
    transaction.sign(guardian);
    const record: SignedOperation = {
      signature: encodeBase58(transaction.signature!),
      bytes: bytesToBase64(transaction.serialize()),
      blockhash: transaction.recentBlockhash,
      lastValidBlockHeight: 100,
      guardian: guardian.publicKey.toBase58(), profileId: "profile-a",
      profileAddress: profile.toBase58(), kind, state: "pending", createdAt: Date.now(),
    };
    const journal = new OperationJournal(memoryStorage());
    journal.save(record);
    assert.equal(journal.read()[0].kind, kind);
  }
});
