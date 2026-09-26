/**
 * Reading config from the page for the script-tag install: the JSON config
 * block and the embed's own `data-*` attributes.
 *
 * Kept out of `index.ts` so it can be tested: `index.ts` runs auto-init as a
 * side effect of being imported and is excluded from coverage. Not re-exported
 * from `index.ts`, so none of this is public API.
 */

import type { Questionnaire, QuestsConfig, ResolvedQuestTheme } from "./types";

function findCssFromSelector(selector: string): string {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() ?? "";
}

/**
 * Config from `<script type="application/json" data-quests-config>`.
 * When present and valid it wins outright; the attributes are not read.
 */
export function parseJsonConfig(): Partial<QuestsConfig> | null {
  const tag = document.querySelector(
    'script[type="application/json"][data-quests-config]',
  );
  if (!tag) return null;
  const raw = tag.textContent?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<QuestsConfig> & {
      cssSelector?: string;
    };
    if (parsed.cssSelector && !parsed.css) {
      parsed.css = findCssFromSelector(parsed.cssSelector);
      delete parsed.cssSelector;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Say, once per attribute, that a value was ignored. The embed never throws
 * over a bad attribute: it keeps its default and tells the developer why.
 */
function warnIgnored(attr: string, value: string, expected: string): void {
  console.warn(
    `[quests-embed] Ignoring ${attr}="${value}": expected ${expected}.`,
  );
}

/** `"true"` / `"false"`, for options whose default is not simply off. */
function parseBoolean(attr: string, raw: string | null): boolean | undefined {
  if (raw === null) return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  warnIgnored(attr, raw, '"true" or "false"');
  return undefined;
}

function parseChoice<T extends string>(
  attr: string,
  raw: string | null,
  allowed: readonly T[],
): T | undefined {
  if (raw === null) return undefined;
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  warnIgnored(attr, raw, allowed.map((v) => `"${v}"`).join(" or "));
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A JSON object, checked by `valid`. Malformed JSON, an array, a primitive or
 * a failed check rejects the value.
 */
function parseJsonObject<T>(
  attr: string,
  raw: string | null,
  expected: string,
  valid: (value: Record<string, unknown>) => boolean = () => true,
): T | undefined {
  if (raw === null) return undefined;
  let value: unknown = null;
  try {
    value = JSON.parse(raw);
  } catch {
    value = null;
  }
  if (isPlainObject(value) && valid(value)) return value as T;
  warnIgnored(attr, raw, expected);
  return undefined;
}

/**
 * Config from the embed's own `data-*` attributes. Every option that can be
 * written as text has one; only the `onComplete` / `onClose` callbacks need
 * code.
 */
export function parseDataAttributes(
  script: HTMLScriptElement,
): Partial<QuestsConfig> | null {
  const endpoint = script.getAttribute("data-endpoint");
  if (!endpoint) return null;

  const configUrl = script.getAttribute("data-config-url");
  const apiKey = script.getAttribute("data-api-key");
  const container = script.getAttribute("data-container");
  const zIndex = script.getAttribute("data-zindex");
  const accentColor = script.getAttribute("data-accent-color");
  const errorColor = script.getAttribute("data-error-color");
  const focusColor = script.getAttribute("data-focus-color");
  const positiveColor = script.getAttribute("data-positive-color");
  const negativeColor = script.getAttribute("data-negative-color");
  const markerColor = script.getAttribute("data-marker-color");
  const modalWidth = script.getAttribute("data-modal-width");
  const backdropOpacity = script.getAttribute("data-backdrop-opacity");
  const fontFamily = script.getAttribute("data-font-family");
  const fontSize = script.getAttribute("data-font-size");
  const css = script.getAttribute("data-css");
  const cssSelector = script.getAttribute("data-css-selector");
  const autoAdvance = script.getAttribute("data-auto-advance");
  const saveDebounceMs = script.getAttribute("data-save-debounce-ms");
  const themeUrl = script.getAttribute("data-theme-url");
  const preset = script.getAttribute("data-preset");
  const themeMode = script.getAttribute("data-theme");
  const unstyled = script.getAttribute("data-unstyled");
  const autoFocus = parseBoolean(
    "data-auto-focus",
    script.getAttribute("data-auto-focus"),
  );
  const animate = parseBoolean(
    "data-animate",
    script.getAttribute("data-animate"),
  );
  const progressPosition = parseChoice(
    "data-progress-position",
    script.getAttribute("data-progress-position"),
    ["top", "bottom"] as const,
  );
  const questionnaire = parseJsonObject<Questionnaire>(
    "data-questionnaire",
    script.getAttribute("data-questionnaire"),
    'a JSON questionnaire with a "questions" array',
    (q) => Array.isArray(q.questions),
  );
  const themeDocument = parseJsonObject<ResolvedQuestTheme>(
    "data-theme-document",
    script.getAttribute("data-theme-document"),
    "a JSON theme object",
  );
  const metadata = parseJsonObject<Record<string, unknown>>(
    "data-metadata",
    script.getAttribute("data-metadata"),
    "a JSON object",
  );

  return {
    endpoint,
    configUrl: configUrl ?? undefined,
    questionnaire,
    apiKey: apiKey ?? undefined,
    container: container ?? undefined,
    zIndex: zIndex ? parseInt(zIndex, 10) : undefined,
    colors: {
      accent: accentColor ?? undefined,
      error: errorColor ?? undefined,
      focus: focusColor ?? undefined,
      positive: positiveColor ?? undefined,
      negative: negativeColor ?? undefined,
      marker: markerColor ?? undefined,
    },
    modalWidth: modalWidth ? parseInt(modalWidth, 10) : undefined,
    backdropOpacity: backdropOpacity ? parseFloat(backdropOpacity) : undefined,
    fontFamily: fontFamily ?? undefined,
    fontSize: fontSize ? parseInt(fontSize, 10) : undefined,
    // Inline CSS wins over a selector, as `css` wins over `cssSelector` in
    // the JSON block.
    css: css || (cssSelector ? findCssFromSelector(cssSelector) : undefined),
    autoAdvance: autoAdvance === "true" ? true : undefined,
    saveDebounceMs: saveDebounceMs ? parseInt(saveDebounceMs, 10) : undefined,
    autoFocus,
    animate,
    progressPosition,
    themeUrl: themeUrl ?? undefined,
    themeDocument,
    preset: preset ? (preset as "default" | "minimal" | "pill" | "dense") : undefined,
    theme: themeMode ? (themeMode as "light" | "dark" | "auto") : undefined,
    unstyled: unstyled === "true" ? true : undefined,
    metadata,
  };
}
