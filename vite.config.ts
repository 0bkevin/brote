import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
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
