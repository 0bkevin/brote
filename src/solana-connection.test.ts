import test from "node:test";
import assert from "node:assert/strict";
import {
  ConnectionRequests,
  LatestRequest,
  mergeVerifiedReads,
  retryReadOnVerifiedFallback,
  verifyMainnetConnection,
} from "./solana-connection";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test("latest wallet request wins in both approval orders and ignores old-provider events", async () => {
  for (const reverse of [false, true]) {
    const requests = new ConnectionRequests<object>();
    const phantom = {};
    const solflare = {};
    const first = deferred<object>();
    const second = deferred<object>();
    const firstId = requests.begin();
    const firstApproval = first.promise.then((provider) => requests.accept(firstId, provider));
    const secondId = requests.begin();
    const secondApproval = second.promise.then((provider) => requests.accept(secondId, provider));
    if (reverse) {
      second.resolve(solflare);
      assert.equal(await secondApproval, true);
      first.resolve(phantom);
      assert.equal(await firstApproval, false);
    } else {
      first.resolve(phantom);
      assert.equal(await firstApproval, false);
      second.resolve(solflare);
      assert.equal(await secondApproval, true);
    }
    assert.equal(requests.acceptsEvent(phantom), false);
    assert.equal(requests.acceptsEvent(solflare), true);
    const duplicate = requests.begin();
    assert.equal(requests.acceptsEvent(solflare), false);
    requests.cancel();
    assert.equal(requests.accept(duplicate, solflare), false);
  }
});

test("complementary verified RPC failures retain known accounts, balances and history", async () => {
  const primary: Parameters<typeof mergeVerifiedReads>[0] = {
    failedReads: 2,
    balance: { value: null, error: "429" },
    profiles: [{ walletId: "sofia", exists: true, balanceLamports: 900,
      activity: [{ signature: "known", changeLamports: 50 }], historyError: undefined }],
  };
  const fallback: Parameters<typeof mergeVerifiedReads>[0] = {
    failedReads: 1,
    balance: { value: 100, error: null },
    profiles: [{ walletId: "sofia", exists: null, balanceLamports: null,
      activity: [], historyError: undefined, error: "timeout" }],
  };
  const selected = await retryReadOnVerifiedFallback({
    primary: "official", primaryUrl: "official", officialUrl: "official", configured: false,
    verifyFallback: async () => "fallback",
    read: async connection => connection === "official" ? primary : fallback,
    mergeResults: mergeVerifiedReads,
  });
  assert.equal(selected.result.balance.value, 100);
  assert.equal(selected.result.profiles[0].balanceLamports, 900);
  assert.equal(selected.result.profiles[0].exists, true);
  assert.equal(selected.result.profiles[0].activity[0].changeLamports, 50);
  assert.equal(selected.result.profiles[0].error, undefined);
});

test("disconnect cancels a pending approval and duplicate same-provider approvals", () => {
  const requests = new ConnectionRequests<object>();
  const provider = {};
  const first = requests.begin();
  const second = requests.begin();
  assert.equal(requests.accept(first, provider), false);
  assert.equal(requests.accept(second, provider), true);
  assert.equal(requests.acceptsEvent(provider, first), false);
  assert.equal(requests.acceptsEvent(provider, second), true);
  const third = requests.begin();
  requests.cancel();
  assert.equal(requests.accept(third, provider), false);
  assert.equal(requests.acceptsEvent(provider), false);
});

test("an official read failure retries once through a freshly verified public fallback", async () => {
  const official = {
    url: "official",
    getGenesisHash: async () => "mainnet",
    getLatestBlockhash: async () => ({ blockhash: "official" }),
  };
  const fallback = {
    url: "fallback",
    getGenesisHash: async () => "mainnet",
    getLatestBlockhash: async () => ({ blockhash: "fallback" }),
  };
  await verifyMainnetConnection(official, "mainnet");
  let checks = 0;
  const reads: string[] = [];
  const selected = await retryReadOnVerifiedFallback({
    primary: official,
    primaryUrl: "official",
    officialUrl: "official",
    configured: false,
    verifyFallback: async () => {
      checks++;
      return verifyMainnetConnection(fallback, "mainnet");
    },
    read: async (connection) => {
      reads.push(connection.url);
      return connection === official
        ? { failedReads: 2, balance: null, account: null, errors: ["429", "timeout"] }
        : { failedReads: 0, balance: 42, account: 11, errors: [] };
    },
  });
  assert.equal(checks, 1);
  assert.deepEqual(reads, ["official", "fallback"]);
  assert.equal(selected.connection, fallback);
  assert.equal(selected.result.balance, 42);
  assert.equal(selected.usedFallback, true);
});

test("wrong-genesis fallback and configured RPC preserve partial unknown reads", async () => {
  const official = { url: "official" };
  const partial = { failedReads: 1, balance: null, account: 9, historyError: "timeout" };
  let checks = 0;
  const wrongGenesis = await retryReadOnVerifiedFallback({
    primary: official,
    primaryUrl: "official",
    officialUrl: "official",
    configured: false,
    verifyFallback: async () => {
      checks++;
      return verifyMainnetConnection({
        url: "fallback",
        getGenesisHash: async () => "wrong-genesis",
        getLatestBlockhash: async () => { throw new Error("must not read blockhash"); },
      }, "mainnet");
    },
    read: async () => partial,
  });
  assert.equal(wrongGenesis.connection, official);
  assert.equal(wrongGenesis.result.balance, null);
  assert.equal(wrongGenesis.result.account, 9);
  assert.match(wrongGenesis.fallbackError ?? "", /clúster no es Solana mainnet/);

  const configured = await retryReadOnVerifiedFallback({
    primary: official,
    primaryUrl: "custom",
    officialUrl: "official",
    configured: true,
    verifyFallback: async () => { checks++; return { url: "fallback" }; },
    read: async () => partial,
  });
  assert.equal(configured.connection, official);
  assert.equal(configured.result.historyError, "timeout");
  assert.equal(checks, 1);
});

test("only the newest automatic or manual refresh completion clears loading", async () => {
  const requests = new LatestRequest();
  let loading = false;
  const old = deferred<void>();
  const current = deferred<void>();
  const start = (work: Promise<void>) => {
    const id = requests.begin();
    loading = true;
    return work.finally(() => { if (requests.isCurrent(id)) loading = false; });
  };
  const first = start(old.promise);
  const second = start(current.promise);
  old.resolve();
  await first;
  assert.equal(loading, true);
  current.resolve();
  await second;
  assert.equal(loading, false);
});
