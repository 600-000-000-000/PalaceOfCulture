import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tier 0 — the browser client. Data-driven r3f scene (InstancedMesh + LOD) goes in src/scene.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
