import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// The Svelte plugin compiles `.svelte.js` runes modules so `core/store.svelte.js`
// is testable outside a browser. jsdom gives us localStorage.
export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: { conditions: ["browser"] },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.js"],
  },
});
