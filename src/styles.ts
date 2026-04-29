/**
 * CSS variable + style helpers for the questionnaire embed.
 *
 * Color vars are intentionally NAMESPACED away from @qaiddev/thumbs-embed
 * so a host that uses both embeds can theme them independently:
 *
 *   Quests own:   --qaid-q-accent, --qaid-q-error, --qaid-q-focus
 *   Shared:       --qaid-modal-width, --qaid-backdrop-opacity,
 *                 --qaid-font-family, --qaid-font-size
 *
 * The legacy thumbs names (--qaid-positive / --qaid-negative /
 * --qaid-marker) are NOT applied here anymore.
 */

import shadowStyles from "./styles-shadow.css?inline";
import { getPresetCss as getPresetCssImpl, type PresetName } from "./themes";

export interface BuildCssVarsOptions {
  /** Primary CTA / progress fill / selected option ring */
  accentColor?: string;
  /** Validation error text */
  errorColor?: string;
  /** Focus ring */
  focusColor?: string;
  modalWidth?: number;
  backdropOpacity?: number;
  fontFamily?: string;
  fontSize?: number;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const num = parseInt(fullHex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  return null;
}

function getContrastTextColor(bgColor: string): string {
  const rgb = parseColor(bgColor);
  if (!rgb) return "white";
  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.4 ? "black" : "white";
}

export function buildCssVars(
  options: BuildCssVarsOptions = {},
): Record<string, string> {
  // Only emit a var when the host explicitly passed a value. The
  // stylesheet's `var(--token, <fallback>)` already handles unset
  // values, and a theme document loaded via `themeUrl` writes its
  // own `:where(.qaid-q-root)` block — inlining defaults here would
  // beat that block on the cascade and silently override the theme.
  const out: Record<string, string> = {};
  if (options.accentColor !== undefined) {
    out["--qaid-q-accent"] = options.accentColor;
    out["--qaid-q-accent-text"] = getContrastTextColor(options.accentColor);
  }
  if (options.errorColor !== undefined) {
    out["--qaid-q-error"] = options.errorColor;
  }
  if (options.focusColor !== undefined) {
    out["--qaid-q-focus"] = options.focusColor;
    out["--qaid-q-focus-text"] = getContrastTextColor(options.focusColor);
  }
  if (options.modalWidth !== undefined) {
    out["--qaid-modal-width"] = `${options.modalWidth}px`;
  }
  if (options.backdropOpacity !== undefined) {
    out["--qaid-backdrop-opacity"] = String(options.backdropOpacity);
  }
  if (options.fontFamily !== undefined) {
    out["--qaid-font-family"] = options.fontFamily;
  }
  if (options.fontSize !== undefined) {
    out["--qaid-font-size"] = `${options.fontSize}px`;
  }
  return out;
}

export function applyCssVars(el: HTMLElement, vars: Record<string, string>): void {
  for (const [name, value] of Object.entries(vars)) {
    el.style.setProperty(name, value);
  }
}

/** CSS string injected into every shadow root */
export function getEmbedStyles(): string {
  return shadowStyles;
}

/** CSS for a built-in theme preset, or "" for unknown names. */
export function getPresetCss(name: PresetName): string {
  return getPresetCssImpl(name);
}

export type { PresetName };
