/**
 * Focused a11y behaviour unit tests.
 *
 * These complement the axe-core sweep (a11y.axe.test.ts) by asserting the
 * SPECIFIC wiring the remediation added, at a finer grain than a rule engine
 * checks: aria-required / aria-invalid / aria-describedby association,
 * progressbar role + value updates and step announcements, modal dialog
 * semantics + focus trap (and their absence in inline mode), and thank-you
 * focus + announcement. Runs under the repo-default happy-dom.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QaidQuests } from "./embed";
import { createInput, type QuestionInput, type QuestionInputOptions } from "./inputs";
import type { Question, Questionnaire } from "./types";

// --------------------------------------------------------------------
// inputs.ts — required / invalid wiring at the renderer level
// --------------------------------------------------------------------

function makeInput(question: Question): QuestionInput {
  const opts: QuestionInputOptions = {
    question,
    initialValue: null,
    onChange: () => {},
    onSubmit: () => {},
    onAutoAdvance: () => {},
    autoAdvance: false,
  };
  return createInput(opts);
}

/** The focusable control an input exposes (element itself, or its inner input). */
function control(input: QuestionInput): HTMLElement {
  if (input.element.matches("input, textarea")) return input.element;
  const inner = input.element.querySelector<HTMLElement>("input, textarea");
  return inner ?? input.element;
}

describe("inputs: aria-required signalling on the control", () => {
  it("sets aria-required on a required text input", () => {
    const input = makeInput({ id: "t", type: "text", label: "Name", required: true });
    expect(control(input).getAttribute("aria-required")).toBe("true");
  });

  it("omits aria-required on an optional text input", () => {
    const input = makeInput({ id: "t", type: "text", label: "Name" });
    expect(control(input).hasAttribute("aria-required")).toBe(false);
  });

  it("sets aria-required on a required currency input", () => {
    const input = makeInput({ id: "c", type: "currency", label: "Amount", required: true });
    expect(control(input).getAttribute("aria-required")).toBe("true");
  });

  it("sets aria-required on a required date input", () => {
    const input = makeInput({ id: "d", type: "date", label: "When", required: true });
    expect(control(input).getAttribute("aria-required")).toBe("true");
  });

  it("sets aria-required on the required multiple-choice group wrapper", () => {
    const input = makeInput({
      id: "m",
      type: "multiple-choice",
      label: "Pick",
      required: true,
      options: [{ value: "a", label: "A" }],
    });
    expect(input.element.getAttribute("role")).toBe("radiogroup");
    expect(input.element.getAttribute("aria-required")).toBe("true");
  });

  it("exempts the range control from aria-required", () => {
    const input = makeInput({ id: "r", type: "range", label: "Level", min: 0, max: 10 });
    expect(control(input).hasAttribute("aria-required")).toBe(false);
  });
});

describe("inputs: setInvalid / clearInvalid association", () => {
  it("setInvalid sets aria-invalid and links the error id via aria-describedby", () => {
    const input = makeInput({ id: "t", type: "text", label: "Name", required: true });
    const el = control(input);
    input.setInvalid("err-1");
    expect(el.getAttribute("aria-invalid")).toBe("true");
    expect((el.getAttribute("aria-describedby") ?? "").split(/\s+/)).toContain("err-1");
  });

  it("clearInvalid removes aria-invalid and unlinks the error id", () => {
    const input = makeInput({ id: "t", type: "text", label: "Name", required: true });
    const el = control(input);
    input.setInvalid("err-1");
    input.clearInvalid();
    expect(el.hasAttribute("aria-invalid")).toBe(false);
    expect(el.getAttribute("aria-describedby") ?? "").not.toContain("err-1");
  });

  it("preserves pre-existing aria-describedby tokens when toggling invalid", () => {
    const input = makeInput({ id: "t", type: "text", label: "Name", required: true });
    const el = control(input);
    el.setAttribute("aria-describedby", "desc-1");
    input.setInvalid("err-1");
    expect(el.getAttribute("aria-describedby")).toBe("desc-1 err-1");
    input.clearInvalid();
    // Only the error token is removed; the original description survives.
    expect(el.getAttribute("aria-describedby")).toBe("desc-1");
  });

  it("wires invalid state onto the group wrapper for multiple-choice", () => {
    const input = makeInput({
      id: "m",
      type: "multiple-choice",
      label: "Pick",
      required: true,
      options: [{ value: "a", label: "A" }],
    });
    input.setInvalid("err-9");
    expect(input.element.getAttribute("aria-invalid")).toBe("true");
    expect(input.element.getAttribute("aria-describedby")).toContain("err-9");
  });
});

// --------------------------------------------------------------------
// embed.ts — integration-level a11y behaviour
// --------------------------------------------------------------------

const threeStep: Questionnaire = {
  id: "beh",
  title: "Customer questionnaire",
  questions: [
    { id: "name", type: "text", label: "Your name?", required: true },
    {
      id: "color",
      type: "multiple-choice",
      label: "Favorite color?",
      options: [
        { value: "red", label: "Red" },
        { value: "blue", label: "Blue" },
      ],
    },
    { id: "note", type: "text", label: "Anything else?" },
  ],
};

describe("embed: a11y behaviour", () => {
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
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  function getShadow(): ShadowRoot {
    const host = document.querySelector("[data-qaid-quests]") as HTMLElement;
    expect(host?.shadowRoot).toBeTruthy();
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

  function bootInline(): void {
    embed = new QaidQuests({
      endpoint: "/api/responses",
      questionnaire: threeStep,
      container: "#mount",
      autoFocus: false,
    });
  }

  describe("invalid state on failed advance", () => {
    it("marks the field aria-invalid and associates the error text on a failed Next", async () => {
      bootInline();
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      await waitFor(() => {
        const err = shadow.querySelector(".qaid-q-error");
        return err && err.textContent ? err : null;
      });

      const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
      expect(input.getAttribute("aria-invalid")).toBe("true");
      const describedby = input.getAttribute("aria-describedby") ?? "";
      expect(describedby.split(/\s+/)).toContain("qaid-q-error-0");
      // The referenced id resolves to a real element carrying the error text.
      const errEl = shadow.getElementById("qaid-q-error-0");
      expect(errEl?.textContent).toBeTruthy();
    });

    it("clears aria-invalid and the error text once the user starts typing", async () => {
      bootInline();
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      const input = await waitFor(() => {
        const i = shadow.querySelector<HTMLInputElement>(".qaid-q-input");
        return i && i.getAttribute("aria-invalid") === "true" ? i : null;
      });

      input.value = "Alice";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(input.hasAttribute("aria-invalid")).toBe(false);
      expect(shadow.querySelector(".qaid-q-error")?.textContent ?? "").toBe("");
    });
  });

  describe("progress + step-change semantics", () => {
    it("exposes role=progressbar with aria-valuenow that tracks the step", async () => {
      bootInline();
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      const progress = shadow.querySelector<HTMLElement>(".qaid-q-progress")!;
      expect(progress.getAttribute("role")).toBe("progressbar");
      expect(progress.getAttribute("aria-label")).toBe("Progress");
      expect(progress.getAttribute("aria-valuemin")).toBe("0");
      expect(progress.getAttribute("aria-valuemax")).toBe("3");
      expect(progress.getAttribute("aria-valuenow")).toBe("1");

      // Advance and confirm the value moves.
      const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
      input.value = "Alice";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

      await waitFor(() =>
        shadow.querySelector(".qaid-q-progress")?.getAttribute("aria-valuenow") === "2"
          ? true
          : null,
      );
      expect(progress.getAttribute("aria-valuenow")).toBe("2");
    });

    it("announces 'Step X of Y' through the polite live region on each step", async () => {
      bootInline();
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      const polite = () =>
        shadow.querySelector<HTMLElement>('[data-qaid-a11y-live="polite"]');
      await waitFor(() =>
        polite()?.textContent === "Step 1 of 3" ? true : null,
      );
      expect(polite()!.textContent).toBe("Step 1 of 3");

      const input = shadow.querySelector<HTMLInputElement>(".qaid-q-input")!;
      input.value = "Alice";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();

      await waitFor(() =>
        polite()?.textContent === "Step 2 of 3" ? true : null,
      );
      expect(polite()!.textContent).toBe("Step 2 of 3");
    });
  });

  describe("modal dialog semantics vs inline", () => {
    it("modal mode applies role=dialog, aria-modal, and an accessible name", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: threeStep,
        autoFocus: false,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      const card = shadow.querySelector<HTMLElement>(".qaid-q-card")!;
      expect(card.getAttribute("role")).toBe("dialog");
      expect(card.getAttribute("aria-modal")).toBe("true");
      // Named via the visible title.
      const labelledby = card.getAttribute("aria-labelledby");
      expect(labelledby).toBeTruthy();
      expect(shadow.getElementById(labelledby!)?.textContent).toContain(
        "Customer questionnaire",
      );
    });

    it("modal mode traps Tab within the card (wraps last -> first)", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: threeStep,
        autoFocus: false,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      const first = shadow.querySelector<HTMLButtonElement>(".qaid-q-close")!;
      const next = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
      next.focus();
      const ev = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });
      next.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(shadow.activeElement).toBe(first);
    });

    it("modal mode marks background siblings inert; releases on destroy", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: threeStep,
        autoFocus: false,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      // The pre-existing mount div is a background sibling and must be inert.
      expect(mount.inert).toBe(true);
      embed.destroy();
      embed = null;
      expect(mount.inert).toBe(false);
    });

    it("inline mode is a plain region: no dialog role, no trap", async () => {
      bootInline();
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      const card = shadow.querySelector<HTMLElement>(".qaid-q-card")!;
      expect(card.hasAttribute("role")).toBe(false);
      expect(card.hasAttribute("aria-modal")).toBe(false);

      // No focus trap: a Tab keydown is not intercepted.
      const next = shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!;
      next.focus();
      const ev = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });
      next.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false);
      // Background page content is never inerted in inline mode.
      expect(mount.inert).toBe(false);
    });
  });

  describe("thank-you screen focus + announcement", () => {
    it("moves focus to the thank-you heading and announces the confirmation", async () => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: {
          id: "one",
          title: "Quick",
          thankYouTitle: "All done!",
          thankYouMessage: "We appreciate it.",
          questions: [{ id: "note", type: "text", label: "A note?" }],
        },
        container: "#mount",
        autoFocus: false,
      });
      const shadow = getShadow();
      await waitFor(() => shadow.querySelector(".qaid-q-step"));

      // Single optional question -> Submit straight away.
      shadow.querySelector<HTMLButtonElement>(".qaid-q-btn-primary")!.click();
      const title = await waitFor(() =>
        shadow.querySelector<HTMLElement>(".qaid-q-done-title"),
      );

      expect(title.getAttribute("tabindex")).toBe("-1");
      await waitFor(() => (shadow.activeElement === title ? true : null));
      expect(shadow.activeElement).toBe(title);

      const polite = shadow.querySelector<HTMLElement>(
        '[data-qaid-a11y-live="polite"]',
      );
      expect(polite?.textContent).toContain("All done!");
      expect(polite?.textContent).toContain("We appreciate it.");
    });
  });
});
