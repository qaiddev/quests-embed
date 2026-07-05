import type { Answers, QuestsConfig } from "./types";
export declare class QaidQuests {
    private config;
    private questionnaire;
    private inlineQuestionnaire;
    private configUrl;
    private state;
    private stepIndex;
    private visibleQuestions;
    private pendingGoToStep;
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
