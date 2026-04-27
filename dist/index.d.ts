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
export { QaidQuests };
export { getVisibleQuestions, evaluateRule } from "./visibility";
export type { QuestsConfig, ResolvedQuestsConfig, Questionnaire, Question, TextQuestion, CurrencyQuestion, RangeQuestion, DateQuestion, MultipleChoiceQuestion, MultipleChoiceOption, Answers, AnswerValue, VisibilityRule, CreateResponsePayload, CreateResponseResult, UpdateAnswerPayload, SubmitPayload, } from "./types";
