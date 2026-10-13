import test from "node:test";
import assert from "node:assert/strict";
import { SOLANA_NETWORK, resolveSolanaNetwork } from "./solana-network";
import { SOLANA_OPERATIONS_KEY } from "./solana-operations";

test("mainnet remains the default and keeps its existing operation journal", () => {
  const network = resolveSolanaNetwork(undefined);
  assert.equal(SOLANA_NETWORK.cluster, "mainnet");
  assert.equal(resolveSolanaNetwork("").cluster, "mainnet");
  assert.equal(resolveSolanaNetwork("mainnet").cluster, "mainnet");
  assert.equal(network.rpcUrl, "https://api.mainnet.solana.com");
  assert.equal(network.genesis, "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d");
  assert.equal(network.operationsKey, SOLANA_OPERATIONS_KEY);
});

test("explicit testnet selects its official RPC, verified genesis, and separate journal", () => {
  const network = resolveSolanaNetwork("testnet");
  assert.equal(network.label, "Solana testnet");
  assert.equal(network.rpcUrl, "https://api.testnet.solana.com");
  assert.equal(network.genesis, "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY");
  assert.notEqual(network.operationsKey, SOLANA_OPERATIONS_KEY);
});

test("unknown network settings fail closed", () => {
  for (const value of ["devnet", "mainnet-beta", "TESTNET", " testnet ", "production"])
    assert.throws(() => resolveSolanaNetwork(value), /VITE_SOLANA_NETWORK inválido/);
});
