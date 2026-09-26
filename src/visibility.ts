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
  // Answers of the questions resolved visible so far. Null-prototype so a
  // questionId like "constructor" can't read an inherited property.
  const seen: Answers = Object.create(null);
  const visible: Question[] = [];
  for (const qn of q.questions) {
    if (qn.visibleIf && !evaluateRule(qn.visibleIf, seen)) continue;
    visible.push(qn);
    if (Object.prototype.hasOwnProperty.call(answers, qn.id)) {
      seen[qn.id] = answers[qn.id];
    }
  }
  return visible;
}

/**
 * The subset of `answers` that belongs to currently visible questions —
 * what the embed submits. An answer given to a question that was later
 * hidden (the visitor went back and changed the gating answer) is left
 * out, as are answers keyed by ids the questionnaire has no question for.
 */
export function getVisibleAnswers(
  q: Questionnaire,
  answers: Answers,
): Answers {
  const out: Answers = {};
  for (const qn of getVisibleQuestions(q, answers)) {
    if (Object.prototype.hasOwnProperty.call(answers, qn.id)) {
      out[qn.id] = answers[qn.id];
    }
  }
  return out;
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
