import test from "node:test";
import assert from "node:assert/strict";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  OperationJournal,
  SigningSession,
  UnconfirmedTransactionError,
  assertFinalTransactionFunds,
  base64ToBytes,
  bytesToBase64,
  estimateTransactionFee,
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
  const submit = (beforeSign?: (transaction: Transaction) => Promise<void>) => signAndSendOperation({
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
    beforeSign,
  });
  return { guardian, destination, transaction, provider, session, journal, rpc, sent, submit, assertSession, setKey: (key: string) => { currentKey = key; } };
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

test("an imported backup cannot turn an unverified operation into a terminal result", async () => {
  const fx = fixture();
  fx.rpc.sendRawTransaction = async () => { throw Error("response lost"); };
  await assert.rejects(fx.submit(), UnconfirmedTransactionError);
  const pending = fx.journal.read()[0];
  fx.journal.merge([{ ...pending, state: "failed", detail: "edited backup" }]);
  assert.equal(fx.journal.read()[0].state, "pending");
  assert.throws(() => fx.journal.assertNoPending(), /sin resultado definitivo/);

  const fresh = new OperationJournal(memoryStorage());
  fresh.merge([{ ...pending, state: "confirmed" }]);
  assert.equal(fresh.read()[0].state, "pending");
});

test("transaction fee preflight quotes the compiled message and rejects an unknown quote", async () => {
  const guardian = Keypair.generate().publicKey;
  const destination = Keypair.generate().publicKey;
  const transaction = new Transaction().add(SystemProgram.transfer({
    fromPubkey: guardian, toPubkey: destination, lamports: 1,
  }));
  let quotedMessage: Uint8Array | null = null;
  const fee = await estimateTransactionFee(transaction, guardian, {
    getLatestBlockhash: async () => ({ blockhash: "11111111111111111111111111111111", lastValidBlockHeight: 1 }),
    getFeeForMessage: async (message) => { quotedMessage = message.serialize(); return { value: 5_000 }; },
  });
  assert.equal(fee, 5_000);
  assert.ok(quotedMessage);
  assert.equal(transaction.feePayer?.toBase58(), guardian.toBase58());
  await assert.rejects(estimateTransactionFee(transaction, guardian, {
    getLatestBlockhash: async () => ({ blockhash: "11111111111111111111111111111111", lastValidBlockHeight: 1 }),
    getFeeForMessage: async () => ({ value: null }),
  }), /no pudo estimar/);
});

test("a higher fee for signing blockhash B blocks a previously affordable deposit", async () => {
  const fx = fixture();
  const blockhashA = Keypair.generate().publicKey.toBase58();
  const blockhashB = Keypair.generate().publicKey.toBase58();
  let signCount = 0;
  const originalSign = fx.provider.signTransaction;
  fx.provider.signTransaction = async (transaction) => { signCount++; return originalSign(transaction); };
  await estimateTransactionFee(fx.transaction, fx.guardian.publicKey, {
    getLatestBlockhash: async () => ({ blockhash: blockhashA, lastValidBlockHeight: 100 }),
    getFeeForMessage: async () => ({ value: 5_000 }),
  });
  fx.rpc.getLatestBlockhash = async () => ({ blockhash: blockhashB, lastValidBlockHeight: 101 });
  let quotedBlockhash: string | undefined;
  const guard = (transaction: Transaction) => assertFinalTransactionFunds(
    transaction, fx.guardian.publicKey, fx.destination, "deposit", {
      getFeeForMessage: async (message) => {
        quotedBlockhash = message.recentBlockhash;
        return { value: 5_001 };
      },
      getBalance: async () => 5_001,
      getMinimumBalanceForRentExemption: async () => 890_880,
    },
  );
  await assert.rejects(fx.submit(guard), /Saldo insuficiente para el depósito/);
  assert.equal(quotedBlockhash, blockhashB);
  assert.equal(signCount, 0);
  assert.equal(fx.sent.length, 0);
  assert.equal(fx.journal.read().length, 0);
});

test("the final quoted message bytes equal the message signed for blockhash B", async () => {
  const fx = fixture();
  const blockhashB = Keypair.generate().publicKey.toBase58();
  fx.rpc.getLatestBlockhash = async () => ({ blockhash: blockhashB, lastValidBlockHeight: 101 });
  let quoted: Uint8Array | undefined;
  let signed: Uint8Array | undefined;
  const originalSign = fx.provider.signTransaction;
  fx.provider.signTransaction = async (transaction) => {
    signed = transaction.serializeMessage();
    return originalSign(transaction);
  };
  const receipt = await fx.submit((transaction) => assertFinalTransactionFunds(
    transaction, fx.guardian.publicKey, fx.destination, "deposit", {
      getFeeForMessage: async (message) => {
        quoted = message.serialize();
        return { value: 5_001 };
      },
      getBalance: async () => 895_882,
      getMinimumBalanceForRentExemption: async () => 890_880,
    },
  ));
  assert.equal(receipt.state, "confirmed");
  assert.equal(receipt.blockhash, blockhashB);
  assert.ok(quoted && signed);
  assert.deepEqual(Array.from(quoted), Array.from(signed));
});

test("an unknown fee for signing blockhash B fails before wallet signing", async () => {
  const fx = fixture();
  let signCount = 0;
  fx.provider.signTransaction = async (transaction) => { signCount++; return transaction; };
  await assert.rejects(fx.submit((transaction) => assertFinalTransactionFunds(
    transaction, fx.guardian.publicKey, fx.destination, "deposit", {
      getFeeForMessage: async () => ({ value: null }),
      getBalance: async () => { throw new Error("balance must not be read"); },
      getMinimumBalanceForRentExemption: async () => { throw new Error("rent must not be read"); },
    },
  )), /no pudo estimar/);
  assert.equal(signCount, 0);
  assert.equal(fx.sent.length, 0);
});

test("session changes during final fee, balance, or rent fetch block signing and broadcast", async () => {
  for (const stage of ["fee", "balance", "rent"] as const) {
    const fx = fixture();
    const started = deferred<void>();
    const release = deferred<void>();
    let signCount = 0;
    fx.provider.signTransaction = async (transaction) => { signCount++; return transaction; };
    const running = fx.submit((transaction) => assertFinalTransactionFunds(
      transaction, fx.guardian.publicKey, fx.destination, "deposit", {
        getFeeForMessage: async () => {
          if (stage === "fee") { started.resolve(); await release.promise; }
          return { value: 5_000 };
        },
        getBalance: async () => {
          if (stage === "balance") { started.resolve(); await release.promise; }
          return 895_881;
        },
        getMinimumBalanceForRentExemption: async () => {
          if (stage === "rent") { started.resolve(); await release.promise; }
          return 890_880;
        },
      },
    ));
    await started.promise;
    fx.session.invalidate();
    release.resolve();
    await assert.rejects(running, /sesión de la billetera cambió/);
    assert.equal(signCount, 0);
    assert.equal(fx.sent.length, 0);
    assert.equal(fx.journal.read().length, 0);
  }
});

test("the final guard charges creation funding plus fee, but only the guardian fee on withdrawal", async () => {
  const guardian = Keypair.generate().publicKey;
  const seed = "brote1-final-guard";
  const profile = await PublicKey.createWithSeed(guardian, seed, SystemProgram.programId);
  const destination = Keypair.generate().publicKey;
  const rent = 650_240;
  const blockhash = Keypair.generate().publicKey.toBase58();
  const create = new Transaction({ feePayer: guardian, recentBlockhash: blockhash }).add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: guardian, basePubkey: guardian, newAccountPubkey: profile,
      seed, lamports: rent, space: 0, programId: SystemProgram.programId,
    }),
  );
  const withdraw = new Transaction({ feePayer: guardian, recentBlockhash: blockhash }).add(
    SystemProgram.transfer({
      fromPubkey: profile, basePubkey: guardian, toPubkey: destination,
      lamports: rent, seed, programId: SystemProgram.programId,
    }),
  );
  const rpc = (balance: number) => ({
    getFeeForMessage: async () => ({ value: 5_000 }),
    getBalance: async () => balance,
    getMinimumBalanceForRentExemption: async () => rent,
  });
  await assert.rejects(assertFinalTransactionFunds(create, guardian, profile, "create", rpc(rent + 4_999)), /Saldo insuficiente/);
  await assertFinalTransactionFunds(create, guardian, profile, "create", rpc(rent + 5_000));
  await assertFinalTransactionFunds(withdraw, guardian, profile, "withdraw", rpc(5_000));
  await assert.rejects(assertFinalTransactionFunds(withdraw, guardian, profile, "withdraw", rpc(4_999)), /comisión de red/);
  create.add(SystemProgram.transfer({ fromPubkey: guardian, toPubkey: destination, lamports: 1 }));
  await assert.rejects(assertFinalTransactionFunds(create, guardian, profile, "create", rpc(rent + 10_000)), /transacción cambió/);
});

test("guardian deposit remainder must be zero or meet the RPC rent minimum at both stages", async () => {
  const fx = fixture("deposit");
  const rent = 890_880;
  const fee = 5_000;
  const rpc = (balance: number, minimum = rent) => ({
    getFeeForMessage: async () => ({ value: fee }),
    getBalance: async () => balance,
    getMinimumBalanceForRentExemption: async (space: number, commitment: string) => {
      assert.equal(space, 0);
      assert.equal(commitment, "confirmed");
      return minimum;
    },
  });
  fx.transaction.feePayer = fx.guardian.publicKey;
  fx.transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
  await assert.rejects(assertFinalTransactionFunds(
    fx.transaction, fx.guardian.publicKey, fx.destination, "deposit", rpc(rent + fee),
  ), /saldo mínimo exento de renta/);
  await assertFinalTransactionFunds(
    fx.transaction, fx.guardian.publicKey, fx.destination, "deposit", rpc(rent + fee + 1),
  );
  const drain = new Transaction({
    feePayer: fx.guardian.publicKey, recentBlockhash: Keypair.generate().publicKey.toBase58(),
  }).add(SystemProgram.transfer({
    fromPubkey: fx.guardian.publicKey, toPubkey: fx.destination, lamports: rent,
  }));
  await assertFinalTransactionFunds(drain, fx.guardian.publicKey, fx.destination, "deposit", rpc(rent + fee));
  await assert.rejects(assertFinalTransactionFunds(
    fx.transaction, fx.guardian.publicKey, fx.destination, "deposit", rpc(fee + 1),
  ), /saldo mínimo exento de renta/);
  await assert.rejects(assertFinalTransactionFunds(
    fx.transaction, fx.guardian.publicKey, fx.destination, "deposit", rpc(rent + fee + 1, Number.NaN),
  ), /RPC devolvió un saldo mínimo/);
});

test("withdrawal checks the fee-only guardian balance and any credit to the guardian", async () => {
  const guardian = Keypair.generate().publicKey;
  const seed = "brote1-rent-boundary";
  const profile = await PublicKey.createWithSeed(guardian, seed, SystemProgram.programId);
  const destination = Keypair.generate().publicKey;
  const rent = 890_880;
  const fee = 5_000;
  const transaction = (toPubkey: PublicKey, lamports: number) =>
    new Transaction({ feePayer: guardian, recentBlockhash: Keypair.generate().publicKey.toBase58() }).add(
      SystemProgram.transfer({ fromPubkey: profile, basePubkey: guardian, toPubkey,
        lamports, seed, programId: SystemProgram.programId }),
    );
  const rpc = (balance: number) => ({
    getFeeForMessage: async () => ({ value: fee }),
    getBalance: async () => balance,
    getMinimumBalanceForRentExemption: async () => rent,
  });
  await assertFinalTransactionFunds(transaction(destination, 1), guardian, profile, "withdraw", rpc(fee));
  await assertFinalTransactionFunds(transaction(destination, 1), guardian, profile, "withdraw", rpc(rent + fee));
  await assert.rejects(assertFinalTransactionFunds(
    transaction(destination, 1), guardian, profile, "withdraw", rpc(rent + fee - 1),
  ), /saldo mínimo exento de renta/);
  // The incoming transfer can restore the final balance, but cannot repair an invalid fee stage.
  await assert.rejects(assertFinalTransactionFunds(
    transaction(guardian, 1), guardian, profile, "withdraw", rpc(rent + fee - 1),
  ), /saldo mínimo exento de renta/);
  await assert.rejects(assertFinalTransactionFunds(
    transaction(guardian, 1), guardian, profile, "withdraw", rpc(fee),
  ), /saldo mínimo exento de renta/);
  await assertFinalTransactionFunds(transaction(guardian, rent), guardian, profile, "withdraw", rpc(fee));
});

test("a rent-invalid final deposit is rejected before the wallet signs", async () => {
  const fx = fixture("deposit");
  let signCount = 0;
  const originalSign = fx.provider.signTransaction;
  fx.provider.signTransaction = async (transaction) => { signCount++; return originalSign(transaction); };
  await assert.rejects(fx.submit((transaction) => assertFinalTransactionFunds(
    transaction, fx.guardian.publicKey, fx.destination, "deposit", {
      getFeeForMessage: async () => ({ value: 5_000 }),
      getBalance: async () => 895_880,
      getMinimumBalanceForRentExemption: async () => 890_880,
    },
  )), /saldo mínimo exento de renta/);
  assert.equal(signCount, 0);
  assert.equal(fx.sent.length, 0);
  assert.equal(fx.journal.read().length, 0);
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
