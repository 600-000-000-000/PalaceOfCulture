import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tier 0 — the browser client. Data-driven r3f scene (InstancedMesh + LOD) goes in src/scene.
// `/api` proxies to the Tier-2 server (apps/server) so the browser calls it same-origin (no CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8787" },
  },
});
