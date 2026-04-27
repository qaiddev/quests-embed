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

import type {
  AnswerValue,
  Answers,
  Question,
  Questionnaire,
  VisibilityRule,
} from "./types";

export function getVisibleQuestions(
  q: Questionnaire,
  answers: Answers,
): Question[] {
  return q.questions.filter((qn) =>
    qn.visibleIf ? evaluateRule(qn.visibleIf, answers) : true,
  );
}

export function evaluateRule(
  rule: VisibilityRule,
  answers: Answers,
): boolean {
  if ("allOf" in rule) {
    // Empty allOf is vacuously true; the validator rejects empty arrays
    // at authoring time, so this branch only matters for inline /
    // unvalidated questionnaires.
    for (const r of rule.allOf) {
      if (!evaluateRule(r, answers)) return false;
    }
    return true;
  }
  if ("anyOf" in rule) {
    for (const r of rule.anyOf) {
      if (evaluateRule(r, answers)) return true;
    }
    return false;
  }

  const v = answers[rule.questionId];
  // Empty string and empty array count as "not answered" so a follow-up
  // doesn't flash visible the moment a text input is focused.
  const isAnswered =
    v !== null &&
    v !== undefined &&
    !(typeof v === "string" && v.trim() === "") &&
    !(Array.isArray(v) && v.length === 0);

  if ("answered" in rule) return rule.answered ? isAnswered : !isAnswered;

  // Value-comparison atoms against an unanswered question return false
  // — including notEquals, so a "show this when X is not Y" follow-up
  // doesn't reveal itself before X has been answered at all.
  if (!isAnswered) return false;

  if ("equals" in rule) return matchesAtomic(v, rule.equals);
  if ("notEquals" in rule) return !matchesAtomic(v, rule.notEquals);
  if ("in" in rule) return rule.in.some((x) => matchesAtomic(v, x));
  return false;
}

function matchesAtomic(
  answer: AnswerValue,
  target: string | number,
): boolean {
  // Multi-select multiple-choice answers are arrays; treat equality as
  // "target is one of the selected values."
  if (Array.isArray(answer)) return answer.some((a) => a === target);
  return answer === target;
}
