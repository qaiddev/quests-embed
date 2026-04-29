/**
 * @qaiddev/quests-embed
 *
 * Step-by-step JSON-defined form embed.
 *
 * Usage as ES module:
 * ```ts
 * import { QaidQuests } from "@qaiddev/quests-embed";
 *
 * new QaidQuests({
 *   endpoint: "/api/responses",
 *   configUrl: "/forms/intake.json",
 *   container: "#form",
 * });
 * ```
 *
 * Usage via script tag (auto-init):
 * ```html
 * <script src="qaid-quests.umd.cjs"
 *   data-endpoint="/api/responses"
 *   data-config-url="/forms/intake.json"
 *   data-container="#form"></script>
 * ```
 *
 * Or with a JSON config tag:
 * ```html
 * <script type="application/json" data-quests-config>
 *   { "endpoint": "/api/responses", "configUrl": "/forms/intake.json" }
 * </script>
 * <script src="qaid-quests.umd.cjs"></script>
 * ```
 */

import { QaidQuests } from "./embed";
import type { QuestsConfig } from "./types";

export { QaidQuests };
export { getVisibleQuestions, evaluateRule } from "./visibility";
export type {
  QuestsConfig,
  ResolvedQuestsConfig,
  Questionnaire,
  Question,
  TextQuestion,
  CurrencyQuestion,
  RangeQuestion,
  DateQuestion,
  MultipleChoiceQuestion,
  MultipleChoiceOption,
  Answers,
  AnswerValue,
  VisibilityRule,
  CreateResponsePayload,
  CreateResponseResult,
  UpdateAnswerPayload,
  SubmitPayload,
} from "./types";

function findCssFromSelector(selector: string): string {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() ?? "";
}

function parseJsonConfig(): Partial<QuestsConfig> | null {
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

function parseDataAttributes(
  script: HTMLScriptElement,
): Partial<QuestsConfig> | null {
  const endpoint = script.getAttribute("data-endpoint");
  if (!endpoint) return null;

  const configUrl = script.getAttribute("data-config-url");
  const apiKey = script.getAttribute("data-api-key");
  const container = script.getAttribute("data-container");
  const zIndex = script.getAttribute("data-zindex");
  const positiveColor = script.getAttribute("data-positive-color");
  const negativeColor = script.getAttribute("data-negative-color");
  const markerColor = script.getAttribute("data-marker-color");
  const modalWidth = script.getAttribute("data-modal-width");
  const backdropOpacity = script.getAttribute("data-backdrop-opacity");
  const fontFamily = script.getAttribute("data-font-family");
  const fontSize = script.getAttribute("data-font-size");
  const cssSelector = script.getAttribute("data-css-selector");
  const autoAdvance = script.getAttribute("data-auto-advance");
  const saveDebounceMs = script.getAttribute("data-save-debounce-ms");
  const themeUrl = script.getAttribute("data-theme-url");
  const preset = script.getAttribute("data-preset");
  const themeMode = script.getAttribute("data-theme");
  const unstyled = script.getAttribute("data-unstyled");

  return {
    endpoint,
    configUrl: configUrl ?? undefined,
    apiKey: apiKey ?? undefined,
    container: container ?? undefined,
    zIndex: zIndex ? parseInt(zIndex, 10) : undefined,
    colors: {
      positive: positiveColor ?? undefined,
      negative: negativeColor ?? undefined,
      marker: markerColor ?? undefined,
    },
    modalWidth: modalWidth ? parseInt(modalWidth, 10) : undefined,
    backdropOpacity: backdropOpacity ? parseFloat(backdropOpacity) : undefined,
    fontFamily: fontFamily ?? undefined,
    fontSize: fontSize ? parseInt(fontSize, 10) : undefined,
    css: cssSelector ? findCssFromSelector(cssSelector) : undefined,
    autoAdvance: autoAdvance === "true" ? true : undefined,
    saveDebounceMs: saveDebounceMs ? parseInt(saveDebounceMs, 10) : undefined,
    themeUrl: themeUrl ?? undefined,
    preset: preset ? (preset as "default" | "minimal" | "pill" | "dense") : undefined,
    theme: themeMode ? (themeMode as "light" | "dark" | "auto") : undefined,
    unstyled: unstyled === "true" ? true : undefined,
  };
}

if (typeof document !== "undefined") {
  const initFromScript = (): void => {
    const script = document.currentScript as HTMLScriptElement | null;
    const jsonConfig = parseJsonConfig();
    const dataConfig = script ? parseDataAttributes(script) : null;
    const config = jsonConfig ?? dataConfig;
    if (config?.endpoint && (config.configUrl || config.questionnaire)) {
      new QaidQuests(config as QuestsConfig);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFromScript);
  } else {
    initFromScript();
  }
}
