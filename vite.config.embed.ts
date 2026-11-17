import { defineConfig } from "vite";
import { resolve } from "path";
import { createHash } from "crypto";
import { readFileSync } from "fs";

// Single-tag loader (dist/embed.js): holds the UMD bundle back until the quest
// is near the viewport or the page is idle. It must run on every browser, so
// it's a classic IIFE targeting es2015. Runs after the main build with
// emptyOutDir:false so it adds to dist/ rather than wiping it.
//
// The UMD bundle's sha384 is baked in here, so a customer's `integrity` on
// embed.js covers the bundle too: embed.js sets it as the injected tag's
// `integrity`. This build must run after the main build (see package.json).
function sri(file: string): string {
  const bytes = readFileSync(resolve(__dirname, file));
  return `sha384-${createHash("sha384").update(bytes).digest("base64")}`;
}

export default defineConfig({
  define: {
    __QAID_UMD_INTEGRITY__: JSON.stringify(sri("dist/qaid-quests.umd.cjs")),
  },
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
