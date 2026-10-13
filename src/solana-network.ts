import { SOLANA_OPERATIONS_KEY } from "./solana-operations";

export type SolanaCluster = "mainnet" | "testnet";

export type SolanaNetwork = {
  cluster: SolanaCluster;
  label: "Solana mainnet" | "Solana testnet";
  rpcUrl: string;
  genesis: string;
  operationsKey: string;
};

const MAINNET: SolanaNetwork = {
  cluster: "mainnet",
  label: "Solana mainnet",
  rpcUrl: "https://api.mainnet.solana.com",
  genesis: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
  operationsKey: SOLANA_OPERATIONS_KEY,
};

const TESTNET: SolanaNetwork = {
  cluster: "testnet",
  label: "Solana testnet",
  rpcUrl: "https://api.testnet.solana.com",
  genesis: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
  operationsKey: "brote:solana:testnet:operations:v1",
};

/** Only a valid explicit URL choice can override the mainnet default. */
export function resolveSolanaNetwork(value: string | undefined): SolanaNetwork {
  if (value === undefined || value === "mainnet") return MAINNET;
  if (value === "testnet") return TESTNET;
  throw new Error(`Red Solana inválida: ${value}. Usa mainnet o testnet.`);
}

export function resolveSolanaNetworkFromSearch(search: string): SolanaNetwork {
  const values = new URLSearchParams(search).getAll("network");
  if (values.length > 1) throw new Error("Red Solana inválida: selección duplicada.");
  return resolveSolanaNetwork(values[0]);
}

export function networkHref(currentUrl: string, cluster: SolanaCluster): string {
  const url = new URL(currentUrl);
  url.searchParams.set("mode", "crypto");
  url.searchParams.set("network", cluster);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function configuredRpcUrl(network: SolanaNetwork, mainnetUrl?: string, testnetUrl?: string): string | undefined {
  return (network.cluster === "mainnet" ? mainnetUrl : testnetUrl)?.trim() || undefined;
}

export const SOLANA_NETWORK = resolveSolanaNetworkFromSearch(
  typeof window === "undefined" ? "" : window.location.search,
);
