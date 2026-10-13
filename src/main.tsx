import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./store";
import { SolanaProvider } from "./solana";
import App from "./App";
import Landing from "./Landing";
import { SOLANA_NETWORK } from "./solana-network";
import "./styles.css";
import "./learning.css";
import "./solana.css";
import "./gaming.css";
import "./landing.css";
import "./mobile-nav.css";
import "./mobile-compact.css";
if (import.meta.env.DEV && import.meta.env.VITE_BROTE_TEST_WALLET === "true" &&
    SOLANA_NETWORK.cluster === "testnet") {
  await import("./qa-test-wallet").then(({ installBroteTestWallet }) => installBroteTestWallet());
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname === "/app" ||
      window.location.pathname === "/app/" ? (
      <StoreProvider>
        <SolanaProvider>
          <App />
        </SolanaProvider>
      </StoreProvider>
    ) : <Landing />}
  </StrictMode>,
);
