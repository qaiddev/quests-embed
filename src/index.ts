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
import { parseDataAttributes, parseJsonConfig } from "./bootstrap";
import type { QuestsConfig } from "./types";

export { QaidQuests };
export {
  getVisibleQuestions,
  getVisibleAnswers,
  evaluateRule,
} from "./visibility";
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

if (typeof document !== "undefined") {
  // Read now, while this tag is running: `currentScript` is null again by the
  // time DOMContentLoaded fires, so a plain (not deferred) tag that waited for
  // it found no data-* attributes and never started.
  const ownScript = document.currentScript as HTMLScriptElement | null;
  const initFromScript = (): void => {
    const script = ownScript;
    // The JSON block wins. The attributes are only read without one, so a
    // bad attribute beside a block doesn't warn about a value never used.
    const config =
      parseJsonConfig() ?? (script ? parseDataAttributes(script) : null);
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
