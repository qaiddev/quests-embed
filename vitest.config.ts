import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.test.ts"],
    css: {
      include: [/.*/],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
      // Ratcheted 2026-10-03. Measured: 100 / 100 / 100 / 100
      // (lines/branches/functions/statements); was 85 / 80 / 88 / 84.
      // Each threshold sits one point below what is measured, floored at 95.
      // Unreachable defensive guards carry a `v8 ignore` hint saying why.
      thresholds: {
        lines: 99,
        branches: 99,
        functions: 99,
        statements: 99,
      },
    },
  },
});
