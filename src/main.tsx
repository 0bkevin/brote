import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./store";
import { SolanaProvider } from "./solana";
import App from "./App";
import Landing from "./Landing";
import "./styles.css";
import "./learning.css";
import "./solana.css";
import "./gaming.css";
import "./landing.css";
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
