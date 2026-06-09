// Generates a shields.io "endpoint" badge JSON from the v8 coverage summary.
// Run after `vitest run --coverage` (which writes coverage/coverage-summary.json
// via the json-summary reporter). The resulting coverage-badge.json is committed
// to the repo root and served to shields.io over raw.githubusercontent so the
// README badge stays in sync on both GitHub and npm.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const summaryPath = resolve(root, "coverage/coverage-summary.json");

const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as {
  total: { lines: { pct: number } };
};

const pct = Math.round(summary.total.lines.pct * 10) / 10;

function colorFor(p: number): string {
  if (p >= 90) return "brightgreen";
  if (p >= 80) return "green";
  if (p >= 70) return "yellowgreen";
  if (p >= 60) return "yellow";
  if (p >= 50) return "orange";
  return "red";
}

const badge = {
  schemaVersion: 1,
  label: "coverage",
  message: `${pct}%`,
  color: colorFor(pct),
};

writeFileSync(
  resolve(root, "coverage-badge.json"),
  JSON.stringify(badge, null, 2) + "\n",
);

console.log(`coverage-badge.json written: ${badge.message} (${badge.color})`);
