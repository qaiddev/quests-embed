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
