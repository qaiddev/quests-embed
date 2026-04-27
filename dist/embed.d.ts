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
    private cssVars;
    constructor(config: QuestsConfig);
    private init;
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
    private close;
    /** Destroy the embed and clean up all resources */
    destroy(): void;
    /** Read-only snapshot of current answers */
    getAnswers(): Answers;
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
