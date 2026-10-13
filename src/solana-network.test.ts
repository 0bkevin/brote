import test from "node:test";
import assert from "node:assert/strict";
import { SOLANA_NETWORK, configuredRpcUrl, networkHref, resolveSolanaNetwork, resolveSolanaNetworkFromSearch } from "./solana-network";
import { SOLANA_OPERATIONS_KEY } from "./solana-operations";

test("mainnet remains the default and keeps its existing operation journal", () => {
  const network = resolveSolanaNetwork(undefined);
  assert.equal(SOLANA_NETWORK.cluster, "mainnet");
  assert.equal(resolveSolanaNetwork("mainnet").cluster, "mainnet");
  assert.equal(resolveSolanaNetworkFromSearch("?mode=crypto").cluster, "mainnet");
  assert.equal(resolveSolanaNetworkFromSearch("?network=mainnet").cluster, "mainnet");
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
  assert.equal(resolveSolanaNetworkFromSearch("?mode=crypto&network=testnet").cluster, "testnet");
});

test("unknown and ambiguous URL network selections fail closed", () => {
  for (const value of ["", "devnet", "mainnet-beta", "TESTNET", " testnet ", "production"])
    assert.throws(() => resolveSolanaNetwork(value), /Red Solana inválida/);
  for (const search of ["?network=", "?network=devnet", "?network=mainnet&network=testnet"])
    assert.throws(() => resolveSolanaNetworkFromSearch(search), /Red Solana inválida/);
});

test("switch URLs preserve the current view and fragment across a full navigation", () => {
  assert.equal(
    networkHref("https://example.com/app/?mode=crypto&view=learn&network=mainnet#balance", "testnet"),
    "/app/?mode=crypto&view=learn&network=testnet#balance",
  );
  assert.equal(networkHref("https://example.com/app?view=learn", "mainnet"), "/app?view=learn&mode=crypto&network=mainnet");
});

test("RPC overrides cannot bleed between selected networks", () => {
  const mainnet = resolveSolanaNetwork("mainnet");
  const testnet = resolveSolanaNetwork("testnet");
  assert.equal(configuredRpcUrl(mainnet, "https://mainnet.example", "https://testnet.example"), "https://mainnet.example");
  assert.equal(configuredRpcUrl(testnet, "https://mainnet.example", "https://testnet.example"), "https://testnet.example");
  assert.equal(configuredRpcUrl(testnet, "https://mainnet.example"), undefined);
});
