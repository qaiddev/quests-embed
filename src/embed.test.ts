/**
 * Smoke test: boot with an inline questionnaire and verify
 * the first step renders inside a user-supplied container.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QaidQuests } from "./embed";
import type { Questionnaire } from "./types";

const sampleQuestionnaire: Questionnaire = {
  id: "smoke",
  title: "Smoke",
  questions: [
    {
      id: "name",
      type: "text",
      label: "Your name?",
      required: true,
      placeholder: "Jane",
    },
    {
      id: "color",
      type: "multiple-choice",
      label: "Favorite color?",
      options: [
        { value: "red", label: "Red" },
        { value: "blue", label: "Blue" },
      ],
    },
  ],
};

describe("QaidQuests", () => {
  let mount: HTMLDivElement;
  let embed: QaidQuests | null = null;

  beforeEach(() => {
    mount = document.createElement("div");
    mount.id = "mount";
    document.body.appendChild(mount);
    // Resolve any fetch with empty success — endpoint is exercised but not asserted here.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ id: "resp-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    embed?.destroy();
    embed = null;
    mount.remove();
    vi.unstubAllGlobals();
  });

  function getShadow(): ShadowRoot {
    const host = document.querySelector("[data-qaid-quests]") as HTMLElement;
    expect(host).toBeTruthy();
    expect(host.shadowRoot).toBeTruthy();
    return host.shadowRoot!;
  }

  async function waitFor<T>(fn: () => T | null | undefined, timeout = 1000): Promise<T> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = fn();
      if (v) return v;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error("waitFor timed out");
  }

  it("renders the first question with autofocus on the input", async () => {
    embed = new QaidQuests({
      endpoint: "/api/responses",
      questionnaire: sampleQuestionnaire,
      container: "#mount",
    });

    const root = await waitFor(() => getShadow().querySelector(".qaid-q-step"));
    const label = root.querySelector(".qaid-q-label");
    expect(label?.textContent).toContain("Your name?");

    const input = root.querySelector<HTMLInputElement>(".qaid-q-input");
    expect(input).toBeTruthy();
    expect(input?.placeholder).toBe("Jane");

    // Step counter
    const counter = getShadow().querySelector(".qaid-q-step-counter");
    expect(counter?.textContent).toBe("1 / 2");
  });

  it("validates required fields when advancing", async () => {
    embed = new QaidQuests({
      endpoint: "/api/responses",
      questionnaire: sampleQuestionnaire,
      container: "#mount",
    });

    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));

    const next = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary");
    expect(next).toBeTruthy();
    next!.click();

    await waitFor(() => {
      const err = shadow.querySelector(".qaid-q-error");
      return err && err.textContent ? err : null;
    });

    const counter = shadow.querySelector(".qaid-q-step-counter");
    expect(counter?.textContent).toBe("1 / 2");
  });

  it("advances to the next question after a valid answer + Enter", async () => {
    embed = new QaidQuests({
      endpoint: "/api/responses",
      questionnaire: sampleQuestionnaire,
      container: "#mount",
    });

    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));

    const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
    input.value = "Alice";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const next = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
    next.click();

    const options = await waitFor(() => shadow.querySelector(".qaid-q-options"));
    expect(options).toBeTruthy();
    expect(options.querySelectorAll(".qaid-q-option").length).toBe(2);

    const counter = shadow.querySelector(".qaid-q-step-counter");
    expect(counter?.textContent).toBe("2 / 2");

    const answers = embed.getAnswers();
    expect(answers.name).toBe("Alice");
  });

  describe("conditional follow-ups (visibleIf)", () => {
    const branching: Questionnaire = {
      id: "branch",
      questions: [
        {
          id: "experience",
          type: "multiple-choice",
          label: "How was it?",
          required: true,
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
          label: "What did you like most?",
          visibleIf: { questionId: "experience", equals: "good" },
        },
      ],
    };

    function pickOption(shadow: ShadowRoot, value: string): void {
      const options = shadow.querySelectorAll<HTMLButtonElement>(".qaid-q-option");
      for (const opt of options) {
        if (opt.dataset.value === value) {
          opt.click();
          return;
        }
      }
      throw new Error(`Option ${value} not found`);
    }

    it("starts with only the first question visible until the gate is answered", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      // Both follow-ups gated; visible total is 1.
      const counter = shadow.querySelector(".qaid-q-step-counter");
      expect(counter?.textContent).toBe("1 / 1");
    });

    it("reveals the bad-branch follow-up when the gate matches", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      pickOption(shadow, "bad");
      const next = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
      next.click();

      const label = await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l && l.textContent?.includes("What went wrong") ? l : null;
      });
      expect(label.textContent).toContain("What went wrong?");

      const counter = shadow.querySelector(".qaid-q-step-counter");
      expect(counter?.textContent).toBe("2 / 2");
    });

    it("reveals the good-branch follow-up when the gate matches the other value", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      pickOption(shadow, "good");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

      const label = await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l && l.textContent?.includes("What did you like") ? l : null;
      });
      expect(label.textContent).toContain("What did you like most?");
    });

    it("re-routes the branch when the user goes back and changes the gate", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      // Answer "bad", advance.
      pickOption(shadow, "bad");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l && l.textContent?.includes("What went wrong") ? l : null;
      });

      // Go back, change to "good".
      const back = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-secondary")!;
      back.click();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));
      pickOption(shadow, "good");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

      const label = await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l && l.textContent?.includes("What did you like") ? l : null;
      });
      expect(label.textContent).toContain("What did you like most?");
    });

    it("submits successfully when the visible last question is reached", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      pickOption(shadow, "good");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      const input = await waitFor(() =>
        shadow.querySelector<HTMLInputElement>(".qaid-q-input"),
      );
      input.value = "the colors";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      // The follow-up is the last visible question — Next should submit.
      const submit = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
      expect(submit.textContent).toBe("Submit");
      submit.click();

      await waitFor(() => shadow.querySelector(".qaid-q-done"));
      expect(embed!.getAnswers().what_loved).toBe("the colors");
    });

    it("goToStep jumps to the named visible question", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          questions: [
            { id: "a", type: "text", label: "A?" },
            { id: "b", type: "text", label: "B?" },
            { id: "c", type: "text", label: "C?" },
          ],
        },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      expect(embed.goToStep("c")).toBe(true);
      const label = await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l && l.textContent?.includes("C?") ? l : null;
      });
      expect(label.textContent).toContain("C?");
    });

    it("goToStep returns false for a question hidden by an unmet predicate", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      // Neither follow-up is visible until the gate is answered.
      expect(embed.goToStep("what_went_wrong")).toBe(false);
      expect(embed.goToStep("what_loved")).toBe(false);
    });

    it("goToStep latches the request when called before init finishes", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          questions: [
            { id: "a", type: "text", label: "A?" },
            { id: "b", type: "text", label: "B?" },
            { id: "c", type: "text", label: "C?" },
          ],
        },
        container: "#mount",
      });
      // Call BEFORE the embed has finished init.
      embed.goToStep("b");

      const shadow = getShadow();
      const label = await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l && l.textContent?.includes("B?") ? l : null;
      });
      expect(label.textContent).toContain("B?");
    });

    it("does not throw when an inline questionnaire references an unknown questionId", async () => {
      const malformed: Questionnaire = {
        questions: [
          { id: "first", type: "text", label: "Anything?" },
          {
            id: "follow",
            type: "text",
            label: "Follow-up",
            visibleIf: { questionId: "ghost", equals: "x" },
          },
        ],
      };
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: malformed,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      // The unknown reference resolves to "not answered" → false → hidden.
      const counter = shadow.querySelector(".qaid-q-step-counter");
      expect(counter?.textContent).toBe("1 / 1");
    });
  });
});
