import { defineConfig } from "vite";
import { resolve } from "path";

// Single-tag loader (dist/embed.js): holds the UMD bundle back until the quest
// is near the viewport or the page is idle. It must run on every browser, so
// it's a classic IIFE targeting es2015. Runs after the main build with
// emptyOutDir:false so it adds to dist/ rather than wiping it.
export default defineConfig({
  build: {
    emptyOutDir: false,
    target: "es2015",
    minify: "esbuild",
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/embed-loader.ts"),
      name: "QaidQuestsLoader",
      fileName: () => "embed.js",
      formats: ["iife"],
    },
  },
});
