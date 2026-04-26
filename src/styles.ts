/**
 * CSS variable + style helpers for the questionnaire embed.
 *
 * Variable names match @qaiddev/thumbs-embed so a theme written for
 * one embed renders identically in the other:
 *   --qaid-positive, --qaid-negative, --qaid-marker
 *   --qaid-modal-width, --qaid-backdrop-opacity
 *   --qaid-font-family, --qaid-font-size
 */

import shadowStyles from "./styles-shadow.css?inline";

export interface BuildCssVarsOptions {
  positiveColor?: string;
  negativeColor?: string;
  markerColor?: string;
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

export function buildCssVars(options: BuildCssVarsOptions = {}): Record<string, string> {
  const {
    positiveColor = "#10b981",
    negativeColor = "#ef4444",
    markerColor = "#6366f1",
    modalWidth = 480,
    backdropOpacity = 0.4,
    fontFamily = "system-ui, -apple-system, sans-serif",
    fontSize = 16,
  } = options;

  return {
    "--qaid-positive": positiveColor,
    "--qaid-positive-text": getContrastTextColor(positiveColor),
    "--qaid-negative": negativeColor,
    "--qaid-marker": markerColor,
    "--qaid-marker-text": getContrastTextColor(markerColor),
    "--qaid-modal-width": `${modalWidth}px`,
    "--qaid-backdrop-opacity": String(backdropOpacity),
    "--qaid-font-family": fontFamily,
    "--qaid-font-size": `${fontSize}px`,
  };
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
