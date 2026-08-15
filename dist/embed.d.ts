import type { Answers, Questionnaire, QuestsConfig } from "./types";
export declare class QaidQuests {
    private config;
    private questionnaire;
    private inlineQuestionnaire;
    private configUrl;
    private state;
    private stepIndex;
    private visibleQuestions;
    private pendingGoToStep;
    private pendingUpdate;
    private suppressStepFocus;
    private hasRenderedStep;
    private answers;
    private responseId;
    private visitorId;
    private pendingSaveTimer;
    private pendingSaveQuestionId;
    private pendingSaveValue;
    private inflightSaves;
    private shadowHost;
    private shadowRoot;
    private isUserContainer;
    private rootEl;
    private cardEl;
    private titleEl;
    private stepCounterEl;
    private progressEl;
    private progressFillEl;
    private bodyEl;
    private scrollCueEl;
    private overflow;
    private footerEl;
    private savingEl;
    private backdropEl;
    private currentInput;
    private boundKeyDown;
    private savedOpener;
    private focusTrap;
    private inertRestore;
    private cssVars;
    private hostThemeOverrides;
    private hostInlineVars;
    private themeUrl;
    private themeDocument;
    private hostCss;
    private metadata;
    private onCompleteCb;
    private onCloseCb;
    private closed;
    constructor(config: QuestsConfig);
    private init;
    private loadTheme;
    /**
     * Merge a fetched theme document into the live config, then inject
     * the resulting CSS layers + class toggles into the shadow root.
     *
     * Precedence (highest first):
     *   1. Host's explicit `QuestsConfig` fields (preset/theme/unstyled/css)
     *   2. Theme document fields (preset/mode/unstyled/tokens/css)
     *   3. Embed defaults
     *
     * CSS layer order (later wins for same-specificity rules):
     *   base stylesheet → theme.tokens block → preset CSS → theme.css → host css
     */
    private applyResolvedTheme;
    private loadQuestionnaire;
    private mountShell;
    private renderLoading;
    private renderError;
    private effectiveProgressPosition;
    private renderHeader;
    private renderStep;
    private renderDone;
    private advance;
    private back;
    private recomputeVisible;
    private handleAnswerChange;
    private flushPendingSave;
    private saveAnswer;
    private doSave;
    private createResponse;
    private submit;
    private jsonHeaders;
    private showSaving;
    private handleKeyDown;
    /**
     * Modal mode only: trap Tab within the card and mark the rest of the
     * page inert while the dialog is open. Runs once (guarded) after the
     * first step renders. Inline mode keeps normal page tab flow and is
     * never trapped or isolated.
     */
    private setupModalA11y;
    private close;
    /** Destroy the embed and clean up all resources */
    destroy(): void;
    /** Read-only snapshot of current answers */
    getAnswers(): Answers;
    /**
     * Id of the question currently rendered, or `null` if the embed
     * isn't on a question (still loading, on the thank-you screen, or
     * unmounted). Useful for editor previews that want to restore the
     * user's place after a forced re-mount.
     */
    getCurrentQuestionId(): string | null;
    /**
     * Swap in a new questionnaire without tearing the embed down.
     *
     * Built for editor previews, where the alternative — `destroy()` plus a
     * fresh construction on every edit — re-mounts the shadow root, repaints
     * the loading state, and re-runs both the theme fetch and the create
     * call. Because that path awaits the network it always paints a blank
     * frame first, which is what makes a live preview strobe while the author
     * types. This re-renders the header and the current step and nothing
     * else, synchronously: the shadow root, the resolved theme, the response
     * id and the answers so far all survive.
     *
     * Answers are kept for questions that still exist and dropped for ones
     * that don't, so `getAnswers()` never reports an id the questionnaire has
     * no question for. The reader's place is kept the same way: if the
     * question on screen is still present and visible, the embed stays on it,
     * otherwise the step index is clamped into range.
     *
     * Returns whether the update was applied. It is refused, leaving the
     * embed exactly as it was, when the questionnaire has no questions, or
     * once the reader has completed the form — resuming a submitted response
     * is not something this can decide on the host's behalf, so a host that
     * wants the new form there should rebuild. Called before the embed has
     * finished initializing, the update is latched and applied as soon as it
     * is ready (and reported as applied), the same way `goToStep` is.
     */
    update(questionnaire: Questionnaire): boolean;
    /**
     * Jump to the visible question with the given id. Returns true if
     * the question is currently visible (and the embed navigated to
     * it), false if it's hidden by an unmet `visibleIf` predicate or
     * unknown. If the embed is still initializing, the request is
     * latched and applied as soon as the questionnaire is ready.
     *
     * Intended for editor previews and other host-driven step control.
     */
    goToStep(questionId: string): boolean;
}
