import { describe, expect, it } from "vitest";
import { evaluateRule, getVisibleQuestions } from "./visibility";
import type { Questionnaire } from "./types";

describe("evaluateRule", () => {
  it("equals matches when answer equals target", () => {
    expect(
      evaluateRule(
        { questionId: "exp", equals: "bad" },
        { exp: "bad" },
      ),
    ).toBe(true);
    expect(
      evaluateRule(
        { questionId: "exp", equals: "bad" },
        { exp: "good" },
      ),
    ).toBe(false);
  });

  it("equals against unanswered question returns false", () => {
    expect(
      evaluateRule({ questionId: "exp", equals: "bad" }, {}),
    ).toBe(false);
    expect(
      evaluateRule({ questionId: "exp", equals: "bad" }, { exp: null }),
    ).toBe(false);
    expect(
      evaluateRule({ questionId: "exp", equals: "bad" }, { exp: "" }),
    ).toBe(false);
  });

  it("notEquals returns false against unanswered (does not preempt the gating answer)", () => {
    expect(
      evaluateRule({ questionId: "exp", notEquals: "good" }, {}),
    ).toBe(false);
    expect(
      evaluateRule(
        { questionId: "exp", notEquals: "good" },
        { exp: "bad" },
      ),
    ).toBe(true);
  });

  it("in matches if answer is one of the targets", () => {
    expect(
      evaluateRule(
        { questionId: "exp", in: ["bad", "terrible"] },
        { exp: "terrible" },
      ),
    ).toBe(true);
    expect(
      evaluateRule(
        { questionId: "exp", in: ["bad", "terrible"] },
        { exp: "good" },
      ),
    ).toBe(false);
  });

  it("multi-select equality matches if target is one of the selected", () => {
    expect(
      evaluateRule(
        { questionId: "tags", equals: "blue" },
        { tags: ["red", "blue"] },
      ),
    ).toBe(true);
    expect(
      evaluateRule(
        { questionId: "tags", equals: "green" },
        { tags: ["red", "blue"] },
      ),
    ).toBe(false);
  });

  it("answered: true is true only for non-empty answers", () => {
    expect(
      evaluateRule({ questionId: "x", answered: true }, { x: "hi" }),
    ).toBe(true);
    expect(
      evaluateRule({ questionId: "x", answered: true }, { x: 0 }),
    ).toBe(true);
    expect(
      evaluateRule({ questionId: "x", answered: true }, { x: "" }),
    ).toBe(false);
    expect(
      evaluateRule({ questionId: "x", answered: true }, { x: [] }),
    ).toBe(false);
    expect(evaluateRule({ questionId: "x", answered: true }, {})).toBe(false);
  });

  it("answered: false inverts", () => {
    expect(evaluateRule({ questionId: "x", answered: false }, {})).toBe(true);
    expect(
      evaluateRule({ questionId: "x", answered: false }, { x: "hi" }),
    ).toBe(false);
  });

  it("allOf short-circuits on the first false child", () => {
    expect(
      evaluateRule(
        {
          allOf: [
            { questionId: "a", equals: "1" },
            { questionId: "b", equals: "2" },
          ],
        },
        { a: "1", b: "2" },
      ),
    ).toBe(true);
    expect(
      evaluateRule(
        {
          allOf: [
            { questionId: "a", equals: "1" },
            { questionId: "b", equals: "2" },
          ],
        },
        { a: "1", b: "3" },
      ),
    ).toBe(false);
  });

  it("anyOf short-circuits on the first true child", () => {
    expect(
      evaluateRule(
        {
          anyOf: [
            { questionId: "a", equals: "yes" },
            { questionId: "b", equals: "yes" },
          ],
        },
        { a: "no", b: "yes" },
      ),
    ).toBe(true);
    expect(
      evaluateRule(
        {
          anyOf: [
            { questionId: "a", equals: "yes" },
            { questionId: "b", equals: "yes" },
          ],
        },
        { a: "no", b: "no" },
      ),
    ).toBe(false);
  });

  it("nested allOf / anyOf compose", () => {
    const rule = {
      anyOf: [
        {
          allOf: [
            { questionId: "x", equals: "1" },
            { questionId: "y", equals: "2" },
          ],
        },
        { questionId: "z", equals: "ok" },
      ],
    } as const;
    expect(evaluateRule(rule, { x: "1", y: "2", z: "no" })).toBe(true);
    expect(evaluateRule(rule, { x: "1", y: "wrong", z: "ok" })).toBe(true);
    expect(evaluateRule(rule, { x: "1", y: "wrong", z: "no" })).toBe(false);
  });

  it("references to unknown questionIds resolve as not-answered", () => {
    expect(
      evaluateRule({ questionId: "ghost", equals: "x" }, {}),
    ).toBe(false);
    // Doesn't throw or loop:
    expect(
      evaluateRule({ questionId: "ghost", answered: false }, {}),
    ).toBe(true);
  });
});

describe("getVisibleQuestions", () => {
  const questionnaire: Questionnaire = {
    questions: [
      {
        id: "experience",
        type: "multiple-choice",
        label: "How was it?",
        options: [
          { value: "good", label: "Good" },
          { value: "bad", label: "Bad" },
        ],
      },
      {
        id: "what_went_wrong",
        type: "text",
        label: "What went wrong?",
        visibleIf: { questionId: "experience", equals: "bad" },
      },
      {
        id: "what_loved",
        type: "text",
        label: "What did you like?",
        visibleIf: { questionId: "experience", equals: "good" },
      },
    ],
  };

  it("filters out gated questions before the gating answer is set", () => {
    const visible = getVisibleQuestions(questionnaire, {});
    expect(visible.map((q) => q.id)).toEqual(["experience"]);
  });

  it("reveals only the matching branch", () => {
    expect(
      getVisibleQuestions(questionnaire, { experience: "bad" }).map((q) => q.id),
    ).toEqual(["experience", "what_went_wrong"]);
    expect(
      getVisibleQuestions(questionnaire, { experience: "good" }).map((q) => q.id),
    ).toEqual(["experience", "what_loved"]);
  });

  it("preserves source order across the filter", () => {
    const visible = getVisibleQuestions(questionnaire, { experience: "bad" });
    expect(visible[0].id).toBe("experience");
    expect(visible[1].id).toBe("what_went_wrong");
  });
});
