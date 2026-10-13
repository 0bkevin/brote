import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error Local Vite middleware is an ESM helper without a TS declaration.
import { broteTestWalletPlugin } from "./scripts/test-wallet-server.mjs";
export default defineConfig({
  plugins: [react(), broteTestWalletPlugin()],
  server: { host: "127.0.0.1" },
  resolve: { alias: { buffer: "buffer/" } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          solana: ["@solana/web3.js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
