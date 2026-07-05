// @vitest-environment jsdom
/**
 * axe-core regression safety net for the quests embed.
 *
 * This file runs the axe-core rule engine against the embed's live shadow
 * DOM at every stage of the flow (first step, after advancing, on a
 * validation error, and on the thank-you screen) and asserts zero
 * violations. It is the automated backstop for the WCAG 2.2 AA remediation
 * described in docs/embed-accessibility-plan.md so a future change that
 * regresses an accessible name, role, or programmatic association fails CI.
 *
 * Environment note: this suite pins `jsdom` (see the directive above) rather
 * than the repo-default `happy-dom`, because axe-core depends on DOM APIs
 * (getComputedStyle, full attribute/role reflection, open-shadow traversal)
 * that jsdom implements faithfully.
 *
 * LAYOUT LIMITATION — color contrast: jsdom (like happy-dom) performs no
 * layout and returns empty/again default computed colors, so axe cannot
 * evaluate 1.4.3 / 1.4.11 contrast here. The `color-contrast` rule is
 * therefore disabled in these runs; contrast must be verified in a real
 * browser (or via the design-token contrast checks in the plan). Every
 * other rule — names, roles, required/invalid state, ARIA validity,
 * label associations — is fully exercised.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { QaidQuests } from "./embed";
import type { Questionnaire } from "./types";

const questionnaire: Questionnaire = {
  id: "a11y",
  title: "Customer questionnaire",
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
      required: true,
      options: [
        { value: "red", label: "Red" },
        { value: "blue", label: "Blue" },
      ],
    },
    {
      id: "satisfaction",
      type: "range",
      label: "How satisfied are you?",
      min: 0,
      max: 10,
    },
  ],
};

/**
 * Run axe against the embed host (axe traverses the open shadow root).
 * color-contrast is disabled — jsdom has no layout, so it cannot be
 * evaluated here and must be checked in a real browser.
 */
async function runAxe(host: HTMLElement): Promise<axe.Result[]> {
  const results = await axe.run(host, {
    resultTypes: ["violations"],
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  return results.violations;
}

/** Compact, readable summary of any violations for a failing assertion. */
function summarize(violations: axe.Result[]): string {
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]`)
    .join("\n");
}

describe("a11y: axe-core has zero violations across the flow", () => {
  let mount: HTMLDivElement;
  let embed: QaidQuests | null = null;

  beforeEach(() => {
    mount = document.createElement("div");
    mount.id = "mount";
    document.body.appendChild(mount);
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

  function getHost(): HTMLElement {
    const host = document.querySelector("[data-qaid-quests]") as HTMLElement;
    expect(host).toBeTruthy();
    expect(host.shadowRoot).toBeTruthy();
    return host;
  }

  function getShadow(): ShadowRoot {
    return getHost().shadowRoot!;
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

  function boot(overrides: Record<string, unknown> = {}): void {
    embed = new QaidQuests({
      endpoint: "/api/responses",
      questionnaire,
      container: "#mount",
      autoFocus: false,
      ...overrides,
    });
  }

  it("first step (required text) has no violations", async () => {
    boot();
    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));

    const violations = await runAxe(getHost());
    expect(violations, summarize(violations)).toEqual([]);
  });

  it("has no violations after advancing to the multiple-choice step", async () => {
    boot();
    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));

    const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
    input.value = "Alice";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

    // Now on the radiogroup step (Back + Next present).
    await waitFor(() => shadow.querySelector(".qaid-q-options"));
    expect(shadow.querySelector('[role="radiogroup"]')).toBeTruthy();

    const violations = await runAxe(getHost());
    expect(violations, summarize(violations)).toEqual([]);
  });

  it("a required-field validation error is programmatically associated and has no violations", async () => {
    boot();
    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));

    // Advance with the required field empty -> validation error.
    shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
    await waitFor(() => {
      const err = shadow.querySelector(".qaid-q-error");
      return err && err.textContent ? err : null;
    });

    const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
    // The error is conveyed programmatically, not by colour alone:
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedby = input.getAttribute("aria-describedby") ?? "";
    expect(describedby.split(/\s+/)).toContain("qaid-q-error-0");
    // ...and that id actually resolves to the visible error text.
    const errorEl = shadow.getElementById("qaid-q-error-0");
    expect(errorEl).toBeTruthy();
    expect(errorEl!.textContent).toBeTruthy();

    const violations = await runAxe(getHost());
    expect(violations, summarize(violations)).toEqual([]);
  });

  it("the thank-you screen has no violations", async () => {
    boot();
    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));

    // Q1: name
    const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
    input.value = "Alice";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

    // Q2: color (required) — pick one
    await waitFor(() => shadow.querySelector(".qaid-q-options"));
    shadow.querySelector<HTMLButtonElement>(".qaid-q-option")!.click();
    shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

    // Q3: range (last) — Submit
    const submit = await waitFor(() => {
      const b = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary");
      return b && b.textContent === "Submit" ? b : null;
    });
    submit.click();

    await waitFor(() => shadow.querySelector(".qaid-q-done"));

    const violations = await runAxe(getHost());
    expect(violations, summarize(violations)).toEqual([]);
  });

  it("modal (dialog) mode first step has no violations", async () => {
    // No container -> modal mode: exercises role=dialog + aria-modal +
    // focus trap + background inert, none of which may introduce violations.
    embed = new QaidQuests({
      endpoint: "/api/responses",
      questionnaire,
      autoFocus: false,
    });
    const shadow = getShadow();
    await waitFor(() => shadow.querySelector(".qaid-q-step"));
    expect(shadow.querySelector('[role="dialog"]')).toBeTruthy();

    const violations = await runAxe(getHost());
    expect(violations, summarize(violations)).toEqual([]);
  });
});
