/**
 * Built-in theme presets. Each preset is a CSS string of token
 * overrides (Tier 3) and is injected into the shadow root after the
 * base stylesheet but before the host's `css` config string — so a
 * host always wins.
 */

import defaultCss from "./default.css?inline";
import minimalCss from "./minimal.css?inline";
import pillCss from "./pill.css?inline";
import denseCss from "./dense.css?inline";

export type PresetName = "default" | "minimal" | "pill" | "dense";

const PRESETS: Record<PresetName, string> = {
  default: defaultCss,
  minimal: minimalCss,
  pill: pillCss,
  dense: denseCss,
};

export function getPresetCss(name: PresetName): string {
  return PRESETS[name] ?? "";
}
