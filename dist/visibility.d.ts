/**
 * Pure helpers for evaluating per-question visibility predicates.
 *
 * `getVisibleQuestions` filters a questionnaire's flat question array down
 * to those whose `visibleIf` predicate currently evaluates to true. A
 * question with no `visibleIf` is always visible.
 *
 * Predicates are evaluated against the answers map (the same shape the
 * embed maintains internally and posts on submit). They never throw — a
 * predicate referencing an unknown questionId resolves as if that
 * question is unanswered.
 */
import type { Answers, Question, Questionnaire, VisibilityRule } from "./types";
export declare function getVisibleQuestions(q: Questionnaire, answers: Answers): Question[];
export declare function evaluateRule(rule: VisibilityRule, answers: Answers): boolean;
