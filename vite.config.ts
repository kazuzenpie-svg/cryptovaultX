import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: ["localhost", ".replit.dev", ".repl.co"],
    proxy: {
      // CoinGecko API proxy (dev only)
      "/cg": {
        target: "https://api.coingecko.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/cg/, ""),
      },
      // CoinGecko PRO API proxy (dev only)
      "/cgpro": {
        target: "https://pro-api.coingecko.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/cgpro/, ""),
      },
      // Binance API proxy (dev only)
      "/binance": {
        target: "https://api.binance.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/binance/, ""),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
