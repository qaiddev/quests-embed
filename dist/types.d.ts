/**
 * Questionnaire schema — defines the form itself.
 * Loaded from JSON, either inline or remote.
 */
/**
 * Predicate that gates a question's visibility based on prior answers.
 * Predicates may only reference questions that appear EARLIER in the
 * `questions` array; forward references are rejected at validation time.
 *
 * Composition: `allOf` / `anyOf` accept arrays of nested rules.
 * Atom forms target a single prior question via `questionId`.
 */
export type VisibilityRule = {
    allOf: VisibilityRule[];
} | {
    anyOf: VisibilityRule[];
} | {
    questionId: string;
    equals: string | number;
} | {
    questionId: string;
    notEquals: string | number;
} | {
    questionId: string;
    in: Array<string | number>;
} | {
    questionId: string;
    answered: boolean;
};
/** Common fields on every question */
interface QuestionBase {
    /** Stable id used as the answer key */
    id: string;
    /** Question label shown above the input */
    label: string;
    /** Optional helper text shown below the label */
    description?: string;
    /** Whether an answer is required to advance */
    required?: boolean;
    /** Predicate gating visibility; absent means always visible. */
    visibleIf?: VisibilityRule;
}
export interface TextQuestion extends QuestionBase {
    type: "text";
    /** Input placeholder */
    placeholder?: string;
    /** Use a multi-line textarea */
    multiline?: boolean;
    /** Max length */
    maxLength?: number;
    /** Min length (only enforced when required) */
    minLength?: number;
    /** Native input type for short fields ("text" | "email" | "tel" | "url"). Default "text" */
    inputType?: "text" | "email" | "tel" | "url";
}
export interface CurrencyQuestion extends QuestionBase {
    type: "currency";
    /** ISO currency code, e.g. "USD". Default "USD" */
    currency?: string;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Locale for number formatting. Default browser locale */
    locale?: string;
    placeholder?: string;
}
export interface RangeQuestion extends QuestionBase {
    type: "range";
    min: number;
    max: number;
    /** Step size. Default 1 */
    step?: number;
    /** Initial value when no answer yet. Default min */
    defaultValue?: number;
    /** Suffix shown next to the value (e.g. "/10", "%") */
    unit?: string;
}
export interface DateQuestion extends QuestionBase {
    type: "date";
    /** ISO date string for min */
    min?: string;
    /** ISO date string for max */
    max?: string;
}
export interface MultipleChoiceOption {
    value: string;
    label: string;
    /** Optional description shown below the option label */
    description?: string;
    /** Optional image URL. Rendered as a 1:1 thumbnail next to or above
     *  the label, depending on the question's `imageAlignment`. */
    image?: string;
}
export interface MultipleChoiceQuestion extends QuestionBase {
    type: "multiple-choice";
    options: MultipleChoiceOption[];
    /** Allow selecting multiple options. Answer becomes string[]. Default false */
    multiple?: boolean;
    /**
     * Layout for option images (only meaningful when at least one option
     * has `image` set).
     * - "horizontal" (default): image to the left of the label
     * - "vertical": image above the label, centered
     */
    imageAlignment?: "horizontal" | "vertical";
}
export type Question = TextQuestion | CurrencyQuestion | RangeQuestion | DateQuestion | MultipleChoiceQuestion;
/** Map of answers keyed by question id */
export type AnswerValue = string | number | string[] | null;
export type Answers = Record<string, AnswerValue>;
/** Top-level questionnaire definition (the JSON loaded from configUrl) */
export interface Questionnaire {
    /** Stable identifier for this questionnaire */
    id?: string;
    /** Title shown at the top of the form */
    title?: string;
    /** Optional description shown under the title */
    description?: string;
    /** Hide the title row entirely, even if `title` is set */
    hideTitle?: boolean;
    /** Hide the progress bar + step counter entirely */
    hideProgress?: boolean;
    /**
     * Where to render the step counter and progress bar. Same semantics
     * as `QuestsConfig.progressPosition`. Set on the schema so authors
     * can choose the layout from the dashboard without changing the
     * embed config on the host page. Config-level `progressPosition`
     * still wins when both are set.
     */
    progressPosition?: "top" | "bottom";
    /** Text shown when the form is finished. Default "Thank you!" */
    thankYouTitle?: string;
    /** Subtitle shown when the form is finished */
    thankYouMessage?: string;
    /** Submit button label on the last step. Default "Submit" */
    submitLabel?: string;
    /** Next button label. Default "Next" */
    nextLabel?: string;
    /** Back button label. Default "Back" */
    backLabel?: string;
    questions: Question[];
}
/**
 * Configuration for the QaidQuests embed.
 * Mirrors the theming surface of @qaiddev/thumbs-embed so themes
 * (CSS variable values + injected CSS) work in both embeds.
 */
export interface QuestsConfig {
    /** Required: API endpoint URL for storing answers */
    endpoint: string;
    /** API key for authenticating with the service */
    apiKey?: string;
    /** Inline questionnaire definition (takes precedence over configUrl) */
    questionnaire?: Questionnaire;
    /** URL to fetch the questionnaire JSON from */
    configUrl?: string;
    /** CSS selector for user-provided container. If absent, opens as a modal */
    container?: string;
    /** z-index for modal-mode embed. Default: 50 */
    zIndex?: number;
    /** Custom theme colors — same names as thumbs-embed for reuse */
    colors?: {
        /** Primary accent (used for progress / focus / submit) */
        positive?: string;
        /** Error / destructive */
        negative?: string;
        /** Selection / highlight */
        marker?: string;
    };
    /** Modal width in pixels. Default: 480 */
    modalWidth?: number;
    /** Backdrop opacity (0-1). Default: 0.4 */
    backdropOpacity?: number;
    /** Font family. Default: system-ui, -apple-system, sans-serif */
    fontFamily?: string;
    /** Base font size in pixels. Default: 16 */
    fontSize?: number;
    /** Custom CSS injected into the shadow root for theming */
    css?: string;
    /** When true, advances automatically on selection for multiple-choice (single) and range. Default: false */
    autoAdvance?: boolean;
    /** Debounce in ms for autosave on text/currency. Default: 500 */
    saveDebounceMs?: number;
    /** Auto-focus the input on each step. Default: true. Set false in preview/embedded contexts that shouldn't steal focus. */
    autoFocus?: boolean;
    /**
     * Where to render the step counter ("1 / 5") and progress bar.
     * - "top" (default): inline at the top of the card, above the question
     * - "bottom": inline in the footer next to the Next button — useful
     *   for compact / above-the-fold layouts where you want the question
     *   to sit as high as possible.
     */
    progressPosition?: "top" | "bottom";
}
export interface ResolvedQuestsConfig {
    endpoint: string;
    apiKey: string;
    container: string;
    zIndex: number;
    colors: {
        positive: string;
        negative: string;
        marker: string;
    };
    modalWidth: number;
    backdropOpacity: number;
    fontFamily: string;
    fontSize: number;
    css: string;
    autoAdvance: boolean;
    saveDebounceMs: number;
    autoFocus: boolean;
    /**
     * Resolved progress position. `undefined` means "no config-level
     * override" — the embed falls back to `Questionnaire.progressPosition`
     * (then "top") when rendering.
     */
    progressPosition: "top" | "bottom" | undefined;
}
/** Initial payload sent to create the response */
export interface CreateResponsePayload {
    apiKey?: string;
    questId?: string;
    pageUrl: string;
    visitorId: string;
    userAgent?: string;
}
export interface CreateResponseResult {
    /** Server-assigned id used for subsequent answer updates */
    id: string | number;
}
/** Sent when an answer changes */
export interface UpdateAnswerPayload {
    questionId: string;
    value: AnswerValue;
}
/** Sent when the form is submitted */
export interface SubmitPayload {
    answers: Answers;
}
export {};
