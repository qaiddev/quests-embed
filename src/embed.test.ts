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
});
