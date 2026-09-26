import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The script-tag install: index.ts starts a quest from its own tag's data-*
 * attributes. A plain (not deferred) tag runs while the document is still
 * loading, so it waits for DOMContentLoaded, and by then `currentScript` is
 * null again. The tag has to be read before the wait.
 */
describe("script-tag auto-init", () => {
  afterEach(() => {
    vi.doUnmock("./embed");
    vi.resetModules();
    delete (document as unknown as Record<string, unknown>).readyState;
    delete (document as unknown as Record<string, unknown>).currentScript;
    document.head.innerHTML = "";
  });

  function tag(): HTMLScriptElement {
    const script = document.createElement("script");
    script.setAttribute("data-endpoint", "https://qaid.dev/api/quests/responses");
    script.setAttribute("data-config-url", "https://qaid.dev/api/quests/q1/definition");
    document.head.appendChild(script);
    return script;
  }

  async function load(readyState: DocumentReadyState, script: HTMLScriptElement) {
    const ctor = vi.fn();
    vi.doMock("./embed", () => ({ QaidQuests: ctor }));
    Object.defineProperty(document, "readyState", { value: readyState, configurable: true });
    Object.defineProperty(document, "currentScript", { value: script, configurable: true });
    await import("./index");
    return ctor;
  }

  it("starts a plain tag once the document has loaded, though currentScript is gone by then", async () => {
    const ctor = await load("loading", tag());
    expect(ctor).not.toHaveBeenCalled();

    // What the browser does: currentScript is null outside the tag's own run.
    Object.defineProperty(document, "currentScript", { value: null, configurable: true });
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(ctor).toHaveBeenCalledOnce();
    expect(ctor.mock.calls[0]![0]).toMatchObject({
      endpoint: "https://qaid.dev/api/quests/responses",
      configUrl: "https://qaid.dev/api/quests/q1/definition",
    });
  });

  it("starts a deferred tag at once", async () => {
    const ctor = await load("interactive", tag());
    expect(ctor).toHaveBeenCalledOnce();
  });

  it("starts from an inline data-questionnaire with no config URL", async () => {
    const script = document.createElement("script");
    script.setAttribute("data-endpoint", "https://qaid.dev/api/quests/responses");
    script.setAttribute(
      "data-questionnaire",
      JSON.stringify({ questions: [{ id: "name", type: "text", label: "Your name" }] }),
    );
    script.setAttribute("data-auto-focus", "false");
    document.head.appendChild(script);

    const ctor = await load("interactive", script);

    expect(ctor).toHaveBeenCalledOnce();
    expect(ctor.mock.calls[0]![0]).toMatchObject({
      questionnaire: { questions: [{ id: "name" }] },
      autoFocus: false,
    });
  });

  it("lets a JSON config block win over the tag's attributes", async () => {
    const block = document.createElement("script");
    block.setAttribute("type", "application/json");
    block.setAttribute("data-quests-config", "");
    block.textContent = JSON.stringify({
      endpoint: "https://qaid.dev/from-block",
      configUrl: "https://qaid.dev/block-definition",
    });
    document.head.appendChild(block);

    const ctor = await load("interactive", tag());

    expect(ctor).toHaveBeenCalledOnce();
    expect(ctor.mock.calls[0]![0]).toEqual({
      endpoint: "https://qaid.dev/from-block",
      configUrl: "https://qaid.dev/block-definition",
    });
  });
});
