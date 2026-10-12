import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./store";
import { SolanaProvider } from "./solana";
import App from "./App";
import "./styles.css";
import "./learning.css";
import "./solana.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <SolanaProvider>
        <App />
      </SolanaProvider>
    </StoreProvider>
  </StrictMode>,
);
