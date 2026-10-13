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

/** Build selection is deliberately strict: an unknown value must never send mainnet transactions. */
export function resolveSolanaNetwork(value: string | undefined): SolanaNetwork {
  if (value === undefined || value === "" || value === "mainnet") return MAINNET;
  if (value === "testnet") return TESTNET;
  throw new Error(`VITE_SOLANA_NETWORK inválido: ${value}. Usa mainnet o testnet.`);
}

export const SOLANA_NETWORK = resolveSolanaNetwork(import.meta.env?.VITE_SOLANA_NETWORK);
