/**
 * Input renderers for each question type.
 *
 * Each renderer returns a small object with an element to mount, a
 * focus helper, a synchronous current-value reader, and a validator.
 *
 * Per-keystroke autosave is wired by the embed: the renderer just
 * calls back into onChange whenever its underlying value changes.
 * Renderers also call onSubmit when the user presses Enter (or
 * onAutoAdvance after a discrete selection that should auto-advance).
 */
import type { AnswerValue, Question } from "./types";
export interface QuestionInput {
    element: HTMLElement;
    focus(): void;
    getValue(): AnswerValue;
    isValid(): boolean;
}
export interface QuestionInputOptions {
    question: Question;
    initialValue: AnswerValue;
    /** Called any time the value changes (every keystroke for text). */
    onChange: (value: AnswerValue) => void;
    /** Called when the user presses Enter to advance. */
    onSubmit: () => void;
    /**
     * Called after a discrete selection that should auto-advance
     * (e.g. picking a single-choice option when autoAdvance is on).
     */
    onAutoAdvance: () => void;
    /** Whether the embed is configured to auto-advance after discrete selections */
    autoAdvance: boolean;
}
export declare function createInput(options: QuestionInputOptions): QuestionInput;
