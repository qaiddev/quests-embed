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

  /** Every request the embed made, with its JSON body parsed. */
  function recordedCalls(): Array<{
    url: string;
    method: string;
    body: Record<string, unknown>;
  }> {
    return vi.mocked(fetch).mock.calls.map(([url, opts]) => ({
      url: String(url),
      method: opts?.method ?? "GET",
      body: opts?.body ? JSON.parse(opts.body as string) : {},
    }));
  }

  function submitCalls() {
    return recordedCalls().filter((c) => c.url.endsWith("/submit"));
  }

  function typeInto(shadow: ShadowRoot, value: string): void {
    const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function waitForLabel(shadow: ShadowRoot, text: string): Promise<Element> {
    return waitFor(() => {
      const l = shadow.querySelector(".qaid-q-label");
      return l?.textContent?.includes(text) ? l : null;
    });
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

    it("leaves the answer to a since-hidden follow-up out of the submit, and clears it on the server", async () => {
      const onComplete = vi.fn();
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: branching,
        container: "#mount",
        onComplete,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      // "bad" -> answer the bad-branch follow-up...
      pickOption(shadow, "bad");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitForLabel(shadow, "What went wrong");
      typeInto(shadow, "slow shipping");
      // ...then go back and switch to "good", which hides it.
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-secondary")!.click();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));
      pickOption(shadow, "good");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitForLabel(shadow, "What did you like");
      typeInto(shadow, "the colors");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));

      const submits = submitCalls();
      expect(submits).toHaveLength(1);
      expect(submits[0].body).toEqual({
        answers: { experience: "good", what_loved: "the colors" },
      });

      // The hidden answer was PATCHed while it was visible; a server that
      // keeps answers from the PATCHes needs it cleared, before the submit.
      const calls = recordedCalls();
      const clearIdx = calls.findIndex(
        (c) =>
          c.method === "PATCH" &&
          c.body.questionId === "what_went_wrong" &&
          c.body.value === null,
      );
      const submitIdx = calls.findIndex((c) => c.url.endsWith("/submit"));
      expect(clearIdx).toBeGreaterThan(-1);
      expect(clearIdx).toBeLessThan(submitIdx);

      expect(onComplete).toHaveBeenCalledWith({
        experience: "good",
        what_loved: "the colors",
      });
    });

    it("collapses a chain of follow-ups when its head is hidden", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          id: "chain",
          questions: [
            {
              id: "gate",
              type: "multiple-choice",
              label: "Any problems?",
              required: true,
              options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ],
            },
            {
              id: "detail",
              type: "text",
              label: "What happened?",
              visibleIf: { questionId: "gate", equals: "yes" },
            },
            {
              id: "more",
              type: "text",
              label: "Anything else about it?",
              visibleIf: { questionId: "detail", answered: true },
            },
          ],
        },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));

      pickOption(shadow, "yes");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitForLabel(shadow, "What happened");
      typeInto(shadow, "it broke");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitForLabel(shadow, "Anything else");
      typeInto(shadow, "twice");

      // Back to the gate and answer "no".
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-secondary")!.click();
      await waitForLabel(shadow, "What happened");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-secondary")!.click();
      await waitFor(() => shadow.querySelector(".qaid-q-options"));
      pickOption(shadow, "no");

      // "detail" is hidden, so "more" must be too: the gate is now the
      // last question and Next submits. Before the fix "detail"'s leftover
      // answer kept "more" visible and Next went there instead.
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));

      expect(submitCalls()[0].body).toEqual({ answers: { gate: "no" } });
      const cleared = recordedCalls()
        .filter((c) => c.method === "PATCH" && c.body.value === null)
        .map((c) => c.body.questionId)
        .sort();
      expect(cleared).toEqual(["detail", "more"]);
    });

    describe("the primary button follows the answers", () => {
      function primary(shadow: ShadowRoot): HTMLButtonElement {
        return shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
      }

      const yesNo: Questionnaire = {
        id: "yes-no",
        questions: [
          {
            id: "gate",
            type: "multiple-choice",
            label: "Any problems?",
            required: true,
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
          {
            id: "detail",
            type: "text",
            label: "What happened?",
            visibleIf: { questionId: "gate", equals: "yes" },
          },
        ],
      };

      it("reads Next once an answer reveals a follow-up, and Next goes there", async () => {
        embed = new QaidQuests({
          endpoint: "/api/responses",
          questionnaire: branching,
          container: "#mount",
        });
        const shadow = getShadow();
        await waitFor(() => shadow.querySelector(".qaid-q-options"));

        // Drawn with no follow-up visible, so it starts as Submit.
        const btn = primary(shadow);
        expect(btn.textContent).toBe("Submit");

        pickOption(shadow, "bad");
        // Same button, relabelled — pressing it now moves on, not submits.
        expect(primary(shadow)).toBe(btn);
        expect(btn.textContent).toBe("Next");

        btn.click();
        await waitForLabel(shadow, "What went wrong");
        expect(submitCalls()).toHaveLength(0);
      });

      it("reads Submit once an answer hides the last follow-up, and Submit submits", async () => {
        embed = new QaidQuests({
          endpoint: "/api/responses",
          questionnaire: yesNo,
          container: "#mount",
        });
        const shadow = getShadow();
        await waitFor(() => shadow.querySelector(".qaid-q-options"));

        pickOption(shadow, "yes");
        primary(shadow).click();
        await waitForLabel(shadow, "What happened");

        // Back to the gate: drawn with the follow-up visible, so Next.
        shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-secondary")!.click();
        await waitFor(() => shadow.querySelector(".qaid-q-options"));
        const btn = primary(shadow);
        expect(btn.textContent).toBe("Next");

        // "no" hides the only follow-up: the gate is now the last question.
        pickOption(shadow, "no");
        expect(primary(shadow)).toBe(btn);
        expect(btn.textContent).toBe("Submit");

        btn.click();
        await waitFor(() => shadow.querySelector(".qaid-q-done"));
        expect(submitCalls()[0].body).toEqual({ answers: { gate: "no" } });
      });

      it("uses the questionnaire's own labels when it flips", async () => {
        embed = new QaidQuests({
          endpoint: "/api/responses",
          questionnaire: { ...yesNo, nextLabel: "Onward", submitLabel: "Send it" },
          container: "#mount",
        });
        const shadow = getShadow();
        await waitFor(() => shadow.querySelector(".qaid-q-options"));

        expect(primary(shadow).textContent).toBe("Send it");
        pickOption(shadow, "yes");
        expect(primary(shadow).textContent).toBe("Onward");
        pickOption(shadow, "no");
        expect(primary(shadow).textContent).toBe("Send it");
      });

      it("relabels in place while typing: no redraw, focus and text kept", async () => {
        embed = new QaidQuests({
          endpoint: "/api/responses",
          questionnaire: {
            id: "typed-gate",
            questions: [
              { id: "note", type: "text", label: "Anything to add?" },
              {
                id: "why",
                type: "text",
                label: "Why is that?",
                visibleIf: { questionId: "note", answered: true },
              },
            ],
          },
          container: "#mount",
        });
        const shadow = getShadow();
        const step = await waitFor(() => shadow.querySelector(".qaid-q-step"));
        // Let the mount's autofocus frame run so it can't move focus later.
        await new Promise((r) => requestAnimationFrame(() => r(null)));

        const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
        input.focus();
        const btn = primary(shadow);
        expect(btn.textContent).toBe("Submit");

        typeInto(shadow, "yes, one thing");
        expect(btn.textContent).toBe("Next");
        // Nothing was redrawn: same step, same input, same button, and the
        // visitor is still in the field with their text.
        expect(shadow.querySelector(".qaid-q-step")).toBe(step);
        expect(shadow.querySelector(".qaid-q-input")).toBe(input);
        expect(primary(shadow)).toBe(btn);
        expect(shadow.activeElement).toBe(input);
        expect(input.value).toBe("yes, one thing");

        // Clearing the field hides the follow-up again.
        typeInto(shadow, "");
        expect(btn.textContent).toBe("Submit");
        expect(shadow.querySelector(".qaid-q-step")).toBe(step);
        expect(shadow.activeElement).toBe(input);
      });
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

    it("update swaps the questionnaire in place, keeping the shadow root and the response", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ id: "resp-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          questions: [
            { id: "a", type: "text", label: "A?" },
            { id: "b", type: "text", label: "B?" },
          ],
        },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      const hostBefore = document.querySelector("[data-qaid-quests]");
      const callsBefore = fetchMock.mock.calls.length;

      expect(
        embed.update({
          questions: [
            { id: "a", type: "text", label: "A, but edited?" },
            { id: "b", type: "text", label: "B?" },
          ],
        }),
      ).toBe(true);

      // Rendered synchronously — no loading frame between the two states,
      // which is the whole point of not rebuilding.
      expect(shadow.querySelector(".qaid-q-label")?.textContent).toContain(
        "A, but edited?",
      );
      // Same host, same shadow root: nothing was re-mounted...
      expect(document.querySelector("[data-qaid-quests]")).toBe(hostBefore);
      expect(getShadow()).toBe(shadow);
      // ...and no create/theme round trip was re-run.
      expect(fetchMock.mock.calls.length).toBe(callsBefore);
    });

    it("update keeps the reader's place and their answers to questions that survive", async () => {
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

      const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
      input.value = "answered";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      embed.goToStep("b");
      await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l?.textContent?.includes("B?") ? l : null;
      });

      // "c" is dropped, "b" (on screen) and "a" (answered) both survive.
      embed.update({
        questions: [
          { id: "a", type: "text", label: "A?" },
          { id: "b", type: "text", label: "B, edited?" },
        ],
      });

      expect(shadow.querySelector(".qaid-q-label")?.textContent).toContain(
        "B, edited?",
      );
      expect(shadow.querySelector(".qaid-q-step-counter")?.textContent).toBe("2 / 2");
      expect(embed.getAnswers().a).toBe("answered");
    });

    it("update drops answers whose question no longer exists", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          questions: [
            { id: "a", type: "text", label: "A?" },
            { id: "b", type: "text", label: "B?" },
          ],
        },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
      input.value = "gone soon";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      expect(embed.getAnswers().a).toBe("gone soon");

      embed.update({ questions: [{ id: "b", type: "text", label: "B?" }] });

      // Reporting an answer to a question the questionnaire no longer has
      // would submit an id the server cannot place.
      expect("a" in embed.getAnswers()).toBe(false);
    });

    it("update falls back to the first question when the current one is gone", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          questions: [
            { id: "a", type: "text", label: "A?" },
            { id: "b", type: "text", label: "B?" },
          ],
        },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      embed.goToStep("b");
      await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l?.textContent?.includes("B?") ? l : null;
      });

      embed.update({ questions: [{ id: "z", type: "text", label: "Z?" }] });

      expect(shadow.querySelector(".qaid-q-label")?.textContent).toContain("Z?");
      // The header was rebuilt too, not just the step: a one-question form
      // has no progress to track, so its chrome is gone.
      expect(shadow.querySelector(".qaid-q-step-counter")).toBeNull();
    });

    it("update does not move focus", async () => {
      const outside = document.createElement("input");
      document.body.appendChild(outside);
      try {
        embed = new QaidQuests({
          endpoint: "/api/responses",
          questionnaire: {
            questions: [
              { id: "a", type: "text", label: "A?" },
              { id: "b", type: "text", label: "B?" },
            ],
          },
          container: "#mount",
          autoFocus: false,
        });
        const shadow = getShadow();
        await waitFor(() => shadow.querySelector(".qaid-q-step"));

        // Stand in for the author typing into the editor beside the preview.
        outside.focus();
        expect(document.activeElement).toBe(outside);

        embed.update({
          questions: [
            { id: "a", type: "text", label: "A, edited?" },
            { id: "b", type: "text", label: "B?" },
          ],
        });
        await new Promise((r) => requestAnimationFrame(() => r(null)));

        // A step render normally focuses its input; an update is not the
        // reader navigating, so it must leave focus where the host put it.
        expect(document.activeElement).toBe(outside);
      } finally {
        outside.remove();
      }
    });

    it("update refuses an empty questionnaire and leaves the current one standing", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: { questions: [{ id: "a", type: "text", label: "A?" }] },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      expect(embed.update({ questions: [] })).toBe(false);
      expect(shadow.querySelector(".qaid-q-label")?.textContent).toContain("A?");
    });

    it("update refuses a questionnaire whose every question is gated off", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: { questions: [{ id: "a", type: "text", label: "A?" }] },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      // Nothing is visible, and renderStep() reads that as "the reader
      // finished" — so applying this would silently submit the form.
      expect(
        embed.update({
          questions: [
            {
              id: "gated",
              type: "text",
              label: "Gated?",
              visibleIf: { questionId: "nope", equals: "yes" },
            },
          ],
        }),
      ).toBe(false);
      expect(shadow.querySelector(".qaid-q-label")?.textContent).toContain("A?");
      expect(shadow.querySelector(".qaid-q-done")).toBeNull();
    });

    it("update refuses once the reader has completed the form", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: { questions: [{ id: "a", type: "text", label: "A?" }] },
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
      input.value = "done";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));

      // Resuming a submitted response isn't ours to decide — the host
      // rebuilds if it wants the new form here.
      expect(
        embed.update({ questions: [{ id: "b", type: "text", label: "B?" }] }),
      ).toBe(false);
      expect(shadow.querySelector(".qaid-q-done")).toBeTruthy();
    });

    it("update latches when called before init finishes, and wins over the loading questionnaire", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: { questions: [{ id: "a", type: "text", label: "Old?" }] },
        container: "#mount",
      });
      // Called BEFORE init resolves — the newer questionnaire must not be
      // clobbered by the one already in flight.
      expect(
        embed.update({ questions: [{ id: "a", type: "text", label: "New?" }] }),
      ).toBe(true);

      const shadow = getShadow();
      const label = await waitFor(() => {
        const l = shadow.querySelector(".qaid-q-label");
        return l?.textContent ? l : null;
      });
      expect(label.textContent).toContain("New?");
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

  describe("submit failures", () => {
    const single: Questionnaire = {
      id: "fail",
      questions: [{ id: "q1", type: "text", label: "One?", required: true }],
    };

    /**
     * A server whose create and submit replies are scripted in order.
     * `create` / `submit` list the outcomes of successive calls; once a
     * list runs out every further call succeeds. Everything else (the
     * PATCHes) succeeds.
     */
    function stubServer(script: {
      create?: number[];
      submit?: Array<number | "network">;
    }): void {
      const create = [...(script.create ?? [])];
      const submit = [...(script.submit ?? [])];
      let creates = 0;
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        });
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);
          if (url === "/api/responses" && init?.method === "POST") {
            creates++;
            const status = create.shift() ?? 200;
            return status === 200
              ? json({ id: `resp-${creates}` })
              : json({ error: "refused" }, status);
          }
          if (url.endsWith("/submit")) {
            const outcome = submit.shift() ?? 200;
            if (outcome === "network") throw new TypeError("Failed to fetch");
            return outcome === 200
              ? json({ ok: true })
              : json({ error: "refused" }, outcome);
          }
          return json({ ok: true });
        }),
      );
    }

    let errorSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      // The embed logs every failure; keep the test output readable.
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
      errorSpy.mockRestore();
    });

    async function answerAndSubmit(shadow: ShadowRoot): Promise<void> {
      await waitFor(() => shadow.querySelector(".qaid-q-input"));
      typeInto(shadow, "hi");
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
    }

    function retryButton(shadow: ShadowRoot): HTMLButtonElement {
      return shadow.querySelector<HTMLButtonElement>(
        ".qaid-q-submit-error .qaid-q-btn-primary",
      )!;
    }

    it("shows an error instead of Thank you when the create is refused, and Try again recovers", async () => {
      // The create at mount and the one submit retries both fail.
      stubServer({ create: [500, 500] });
      const onComplete = vi.fn();
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        onComplete,
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);

      const error = await waitFor(() =>
        shadow.querySelector(".qaid-q-submit-error"),
      );
      expect(error.textContent).toContain("Couldn't send your answers");
      expect(shadow.querySelector(".qaid-q-done")).toBeNull();
      expect(onComplete).not.toHaveBeenCalled();
      expect(submitCalls()).toHaveLength(0);
      // The answers are kept for the retry.
      expect(embed.getAnswers()).toEqual({ q1: "hi" });

      retryButton(shadow).click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));

      // Third create succeeded; the answer whose autosave was dropped is
      // PATCHed to it before the submit.
      const calls = recordedCalls();
      const patchIdx = calls.findIndex(
        (c) =>
          c.method === "PATCH" &&
          c.url === "/api/responses/resp-3" &&
          c.body.questionId === "q1" &&
          c.body.value === "hi",
      );
      const submitIdx = calls.findIndex(
        (c) => c.url === "/api/responses/resp-3/submit",
      );
      expect(patchIdx).toBeGreaterThan(-1);
      expect(submitIdx).toBeGreaterThan(patchIdx);
      expect(calls[submitIdx].body).toEqual({ answers: { q1: "hi" } });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith({ q1: "hi" });
    });

    it("retries a failed create once on submit before giving up", async () => {
      // Only the create at mount fails; submit's retry gets an id.
      stubServer({ create: [503] });
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);

      await waitFor(() => shadow.querySelector(".qaid-q-done"));
      expect(shadow.querySelector(".qaid-q-submit-error")).toBeNull();
      expect(submitCalls().map((c) => c.url)).toEqual([
        "/api/responses/resp-2/submit",
      ]);
    });

    it("shows an error when the submit is refused, keeps the answers, and sends them again on Try again", async () => {
      stubServer({ submit: [500] });
      const onComplete = vi.fn();
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        onComplete,
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);

      await waitFor(() => shadow.querySelector(".qaid-q-submit-error"));
      expect(shadow.querySelector(".qaid-q-done")).toBeNull();
      expect(onComplete).not.toHaveBeenCalled();

      retryButton(shadow).click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));

      const submits = submitCalls();
      expect(submits).toHaveLength(2);
      expect(submits[0].body).toEqual({ answers: { q1: "hi" } });
      expect(submits[1].body).toEqual({ answers: { q1: "hi" } });
      // The response created at mount is reused, not replaced.
      expect(submits[1].url).toBe("/api/responses/resp-1/submit");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("shows an error when the submit request fails on the network", async () => {
      stubServer({ submit: ["network"] });
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);

      await waitFor(() => shadow.querySelector(".qaid-q-submit-error"));
      expect(shadow.querySelector(".qaid-q-done")).toBeNull();
    });

    it("stays on the error screen when Try again fails too", async () => {
      stubServer({ submit: [502, 502] });
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);
      await waitFor(() => shadow.querySelector(".qaid-q-submit-error"));

      retryButton(shadow).click();
      await waitFor(() => (submitCalls().length === 2 ? true : null));
      // The screen is rebuilt after the second failure, with a fresh button.
      const retry = await waitFor(() => {
        const b = retryButton(shadow);
        return b && b.textContent === "Try again" ? b : null;
      });
      expect(retry.getAttribute("aria-disabled")).toBeNull();
      expect(shadow.querySelector(".qaid-q-done")).toBeNull();
    });

    it("treats a create reply without an id as a failed create", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      );
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);

      await waitFor(() => shadow.querySelector(".qaid-q-submit-error"));
      // Never posts to ".../undefined/submit".
      expect(submitCalls()).toHaveLength(0);
    });

    it("sends one submit when Submit is clicked twice", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-input"));
      typeInto(shadow, "hi");
      const submit = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
      submit.click();
      submit.click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));
      expect(submitCalls()).toHaveLength(1);
    });

    it("offers Close on the error screen in modal mode", async () => {
      stubServer({ submit: [500] });
      const onClose = vi.fn();
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        onClose,
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);
      await waitFor(() => shadow.querySelector(".qaid-q-submit-error"));

      const close = shadow.querySelector<HTMLButtonElement>(
        ".qaid-q-submit-error .qaid-q-btn-secondary",
      );
      expect(close?.textContent).toBe("Close");
      close!.click();
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(document.querySelector("[data-qaid-quests]")).toBeNull();
    });

    it("has no Close button on the error screen in inline mode", async () => {
      stubServer({ submit: [500] });
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      const shadow = getShadow();
      await answerAndSubmit(shadow);
      await waitFor(() => shadow.querySelector(".qaid-q-submit-error"));
      expect(
        shadow.querySelector(".qaid-q-submit-error .qaid-q-btn-secondary"),
      ).toBeNull();
    });
  });

  describe("theming surface", () => {
    function getRoot(): HTMLElement {
      const host = document.querySelector("[data-qaid-quests]") as HTMLElement;
      return host.shadowRoot!.querySelector(".qaid-q-root") as HTMLElement;
    }

    it("does not add a theme class when theme is omitted", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const root = getRoot();
      expect(root.classList.contains("qaid-q-theme-light")).toBe(false);
      expect(root.classList.contains("qaid-q-theme-dark")).toBe(false);
    });

    it("adds qaid-q-theme-light when theme: 'light'", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        theme: "light",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      expect(getRoot().classList.contains("qaid-q-theme-light")).toBe(true);
    });

    it("adds qaid-q-theme-dark when theme: 'dark'", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        theme: "dark",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      expect(getRoot().classList.contains("qaid-q-theme-dark")).toBe(true);
    });

    it("adds no theme class when theme: 'auto'", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        theme: "auto",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const root = getRoot();
      expect(root.classList.contains("qaid-q-theme-light")).toBe(false);
      expect(root.classList.contains("qaid-q-theme-dark")).toBe(false);
    });

    it("adds qaid-q-unstyled when unstyled: true", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        unstyled: true,
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      expect(getRoot().classList.contains("qaid-q-unstyled")).toBe(true);
    });

    it("does not add qaid-q-unstyled by default", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      expect(getRoot().classList.contains("qaid-q-unstyled")).toBe(false);
    });

    it("injects preset CSS into the shadow root for non-default presets", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        preset: "minimal",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const styleTags = Array.from(getShadow().querySelectorAll("style"));
      const hasPresetCss = styleTags.some((s) =>
        (s.textContent ?? "").includes("--qaid-q-card-radius: 0"),
      );
      expect(hasPresetCss).toBe(true);
    });

    it("injects pill preset tokens", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        preset: "pill",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const styleTags = Array.from(getShadow().querySelectorAll("style"));
      const hasPillCss = styleTags.some((s) =>
        (s.textContent ?? "").includes("--qaid-q-btn-radius: 9999px"),
      );
      expect(hasPillCss).toBe(true);
    });

    it("does not inject preset CSS for the default preset", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        preset: "default",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const styleTags = Array.from(getShadow().querySelectorAll("style"));
      // Only the base shadow stylesheet should be present (no preset block,
      // no host css). Any token-override block is the smoking gun.
      const hasOverrides = styleTags.some((s) => {
        const css = s.textContent ?? "";
        // Base stylesheet contains token *definitions*; preset CSS contains
        // overrides scoped to :where(.qaid-q-root) only.
        return (
          css.includes("--qaid-q-card-radius: 0") ||
          css.includes("--qaid-q-btn-radius: 9999px")
        );
      });
      expect(hasOverrides).toBe(false);
    });

    it("colors.accent flows through --qaid-q-accent on the root", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        colors: { accent: "#abcdef" },
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const root = getRoot();
      expect(root.style.getPropertyValue("--qaid-q-accent")).toBe("#abcdef");
    });
  });

  describe("themeUrl / themeDocument loading", () => {
    function getRoot(): HTMLElement {
      const host = document.querySelector("[data-qaid-quests]") as HTMLElement;
      return host.shadowRoot!.querySelector(".qaid-q-root") as HTMLElement;
    }

    function getThemeStyle(): HTMLStyleElement | null {
      return getShadow().querySelector(
        "style[data-qaid-q-theme]",
      ) as HTMLStyleElement | null;
    }

    /** Build a fetch stub that branches on URL substring. */
    function stubFetch(handlers: Array<[string, () => Response | Promise<Response>]>) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo) => {
          const url = typeof input === "string" ? input : (input as Request).url;
          for (const [match, fn] of handlers) {
            if (url.includes(match)) return await fn();
          }
          return new Response(JSON.stringify({ id: "resp-1" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }),
      );
    }

    it("applies a theme fetched from themeUrl: classes, tokens, css", async () => {
      stubFetch([
        [
          "/themes/abc",
          () =>
            new Response(
              JSON.stringify({
                preset: "minimal",
                mode: "dark",
                unstyled: false,
                tokens: { "--qaid-q-card-radius": "0" },
                css: ".qaid-q-card { outline: 1px solid red; }",
              }),
              { status: 200, headers: { "content-type": "application/json" } },
            ),
        ],
      ]);

      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        themeUrl: "/themes/abc",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));

      // Mode class lands.
      expect(getRoot().classList.contains("qaid-q-theme-dark")).toBe(true);

      // The merged style block carries tokens + preset CSS + theme.css.
      const style = getThemeStyle();
      expect(style).toBeTruthy();
      const css = style!.textContent ?? "";
      expect(css).toContain("--qaid-q-card-radius: 0");
      expect(css).toContain("outline: 1px solid red");
    });

    it("accepts a pre-fetched themeDocument without making a fetch", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        themeDocument: {
          preset: "pill",
          mode: "light",
          unstyled: false,
          tokens: { "--qaid-q-btn-radius": "9999px" },
          css: "",
        },
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));

      expect(getRoot().classList.contains("qaid-q-theme-light")).toBe(true);
      const css = getThemeStyle()?.textContent ?? "";
      expect(css).toContain("--qaid-q-btn-radius: 9999px");
    });

    it("explicit QuestsConfig fields beat the theme document", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        // Host says: light + no preset.
        theme: "light",
        preset: "default",
        themeDocument: {
          preset: "minimal",
          mode: "dark",
          unstyled: false,
          tokens: null,
          css: "",
        },
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));

      // Host's "light" wins over theme's "dark".
      const root = getRoot();
      expect(root.classList.contains("qaid-q-theme-light")).toBe(true);
      expect(root.classList.contains("qaid-q-theme-dark")).toBe(false);
      // Host's "default" preset wins — no preset CSS injected.
      const css = getThemeStyle()?.textContent ?? "";
      expect(css).not.toContain("--qaid-q-card-radius: 0");
    });

    it("a failing themeUrl fetch is non-fatal — form still renders", async () => {
      stubFetch([
        [
          "/themes/missing",
          () => new Response("not found", { status: 404 }),
        ],
      ]);
      // Silence the warn we expect.
      const origWarn = console.warn;
      console.warn = () => {};

      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        themeUrl: "/themes/missing",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));

      // No theme classes applied (default mode).
      const root = getRoot();
      expect(root.classList.contains("qaid-q-theme-light")).toBe(false);
      expect(root.classList.contains("qaid-q-theme-dark")).toBe(false);

      console.warn = origWarn;
    });

    it("host's css config is appended after the theme.css", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: sampleQuestionnaire,
        container: "#mount",
        themeDocument: {
          preset: "default",
          mode: "auto",
          unstyled: false,
          tokens: null,
          css: ".from-theme { color: red; }",
        },
        css: ".from-host { color: blue; }",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      const css = getThemeStyle()?.textContent ?? "";
      const themeIdx = css.indexOf(".from-theme");
      const hostIdx = css.indexOf(".from-host");
      expect(themeIdx).toBeGreaterThan(-1);
      expect(hostIdx).toBeGreaterThan(themeIdx);
    });
  });

  describe("host integration hooks", () => {
    const single: Questionnaire = {
      id: "hooks",
      title: "Hooks",
      questions: [{ id: "q1", type: "text", label: "One?", required: true }],
    };

    // The create-response POST body (the first POST to the bare endpoint,
    // not the .../submit call).
    function createBody(): Record<string, unknown> {
      const create = vi
        .mocked(fetch)
        .mock.calls.find(
          ([url, opts]) => url === "/api/responses" && opts?.method === "POST",
        );
      expect(create).toBeTruthy();
      return JSON.parse(create![1]!.body as string);
    }

    async function complete(shadow: ShadowRoot): Promise<void> {
      const input = await waitFor(() =>
        shadow.querySelector<HTMLInputElement>(".qaid-q-input"),
      );
      input.value = "hi";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitFor(() => shadow.querySelector(".qaid-q-done"));
    }

    it("sends metadata verbatim in the create-response body", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        metadata: { feedbackId: "fb-123" },
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      expect(createBody().metadata).toEqual({ feedbackId: "fb-123" });
    });

    it("omits metadata when the host didn't provide any", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      expect("metadata" in createBody()).toBe(false);
    });

    it("fires onComplete once with a copy of the answers after submit", async () => {
      const onComplete = vi.fn();
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        onComplete,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      await complete(shadow);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith({ q1: "hi" });
      // The argument is a copy — mutating it must not touch the store.
      (onComplete.mock.calls[0]![0] as Record<string, unknown>).q1 = "x";
      expect(embed!.getAnswers().q1).toBe("hi");
    });

    it("fires onClose exactly once, even across repeated destroy()", async () => {
      const onClose = vi.fn();
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        onClose,
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      embed.destroy();
      embed.destroy();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("survives a throwing onComplete handler", async () => {
      const onComplete = vi.fn(() => {
        throw new Error("boom");
      });
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        onComplete,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));
      await complete(shadow);
      // Reached the done screen despite the handler throwing.
      expect(shadow.querySelector(".qaid-q-done")).toBeTruthy();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("survives a throwing onClose handler during destroy()", async () => {
      const onClose = vi.fn(() => {
        throw new Error("boom");
      });
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: single,
        container: "#mount",
        onClose,
      });
      await waitFor(() => getShadow().querySelector(".qaid-q-step"));
      // destroy() must not throw even though onClose does.
      expect(() => embed!.destroy()).not.toThrow();
      expect(onClose).toHaveBeenCalledTimes(1);
      // Host shadow host is gone despite the throwing handler.
      expect(document.querySelector("[data-qaid-quests]")).toBeNull();
    });
  });
});
