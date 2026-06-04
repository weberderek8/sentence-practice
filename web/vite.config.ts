import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the browser talks only to the Vite dev server, which proxies /api to
// the gateway. The gateway host/port comes from env (set by docker-compose.dev),
// defaulting to localhost for running Vite outside Docker.
const gatewayTarget = process.env.GATEWAY_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.VITE_DEV_PORT ?? 5173),
    proxy: {
      "/api": {
        target: gatewayTarget,
        changeOrigin: true,
      },
    },
  },
});
