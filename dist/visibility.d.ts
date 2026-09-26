/**
 * Pure helpers for evaluating per-question visibility predicates.
 *
 * `getVisibleQuestions` filters a questionnaire's flat question array down
 * to those whose `visibleIf` predicate currently evaluates to true. A
 * question with no `visibleIf` is always visible.
 *
 * Visibility resolves in question order. A predicate only sees the
 * answers of questions that are themselves visible at that point, so a
 * hidden question reads as unanswered — even if the visitor answered it
 * before it was hidden — and a chain of follow-ups collapses behind it.
 * The same rule makes a reference to a LATER question (which the
 * dashboard validator rejects anyway) read as unanswered.
 *
 * Predicates never throw — a predicate referencing an unknown
 * questionId resolves as if that question is unanswered.
 */
import type { Answers, Question, Questionnaire, VisibilityRule } from "./types";
export declare function getVisibleQuestions(q: Questionnaire, answers: Answers): Question[];
/**
 * The subset of `answers` that belongs to currently visible questions —
 * what the embed submits. An answer given to a question that was later
 * hidden (the visitor went back and changed the gating answer) is left
 * out, as are answers keyed by ids the questionnaire has no question for.
 */
export declare function getVisibleAnswers(q: Questionnaire, answers: Answers): Answers;
export declare function evaluateRule(rule: VisibilityRule, answers: Answers): boolean;
