import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  // Relative asset base — required for the Capacitor (device-only) build, where the
  // app is served from a file-style scheme and absolute "/..." asset URLs break.
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    proxy: { "/api": "http://localhost:8788" },
    // dev/preview: fastify'd tunnels (trycloudflare.com, *.pages.dev) send a foreign Host header
    allowedHosts: true,
  },
});
