import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "QaidQuests",
      fileName: "qaid-quests",
      formats: ["umd", "es"],
    },
    rollupOptions: {
      external: [],
      output: {
        exports: "named",
      },
    },
    minify: "esbuild",
    sourcemap: true,
  },
});
