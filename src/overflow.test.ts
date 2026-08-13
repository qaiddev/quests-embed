import { describe, it, expect, vi, afterEach } from "vitest";
import {
  COMPACT_HEIGHT,
  applyFitState,
  applyScrollState,
  scrollEdgeOf,
  watchOverflow,
} from "./overflow";

/** A scrollable box with settable metrics, since jsdom does no layout. */
function box({ scrollTop = 0, scrollHeight = 100, clientHeight = 100 } = {}) {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
  el.scrollTop = scrollTop;
  return el;
}

afterEach(() => vi.unstubAllGlobals());

describe("scrollEdgeOf", () => {
  it("reports no overflow when the content fits", () => {
    expect(scrollEdgeOf({ scrollTop: 0, scrollHeight: 100, clientHeight: 100 })).toBe("none");
  });

  it("ignores sub-pixel overflow", () => {
    expect(scrollEdgeOf({ scrollTop: 0, scrollHeight: 101, clientHeight: 100 })).toBe("none");
  });

  it("reports each edge as the box is scrolled", () => {
    const m = { scrollHeight: 300, clientHeight: 100 };
    expect(scrollEdgeOf({ ...m, scrollTop: 0 })).toBe("top");
    expect(scrollEdgeOf({ ...m, scrollTop: 100 })).toBe("middle");
    expect(scrollEdgeOf({ ...m, scrollTop: 200 })).toBe("bottom");
  });

  it("treats a near-enough bottom as the bottom", () => {
    expect(scrollEdgeOf({ scrollTop: 199, scrollHeight: 300, clientHeight: 100 })).toBe("bottom");
  });
});

describe("applyScrollState", () => {
  it("marks the body and shows the cue when there is more below", () => {
    const body = box({ scrollHeight: 300, clientHeight: 100 });
    const cue = document.createElement("div");
    cue.hidden = true;

    expect(applyScrollState(body, cue)).toBe("top");
    expect(body.getAttribute("data-qaid-scroll")).toBe("top");
    expect(cue.hidden).toBe(false);
  });

  it("hides the cue at the bottom and when nothing overflows", () => {
    const cue = document.createElement("div");

    applyScrollState(box({ scrollTop: 200, scrollHeight: 300, clientHeight: 100 }), cue);
    expect(cue.hidden).toBe(true);

    applyScrollState(box({ scrollHeight: 100, clientHeight: 100 }), cue);
    expect(cue.hidden).toBe(true);
  });

  it("keeps the cue up while scrolling through the middle", () => {
    const cue = document.createElement("div");
    applyScrollState(box({ scrollTop: 100, scrollHeight: 300, clientHeight: 100 }), cue);
    expect(cue.hidden).toBe(false);
  });

  it("tolerates having no cue element", () => {
    expect(() => applyScrollState(box(), null)).not.toThrow();
  });
});

describe("applyFitState", () => {
  it("goes compact only when height is genuinely tight", () => {
    const card = document.createElement("div");

    expect(applyFitState(card, COMPACT_HEIGHT - 1)).toBe("compact");
    expect(card.getAttribute("data-qaid-fit")).toBe("compact");

    expect(applyFitState(card, COMPACT_HEIGHT + 1)).toBe("roomy");
    expect(card.getAttribute("data-qaid-fit")).toBe("roomy");
  });

  it("stays roomy when the height is unknown", () => {
    // An unmeasured body reports 0; treating that as compact would shrink the
    // tiles on every content-sized inline embed.
    expect(applyFitState(document.createElement("div"), 0)).toBe("roomy");
  });
});

describe("watchOverflow", () => {
  it("applies both states immediately", () => {
    const body = box({ scrollHeight: 300, clientHeight: 100 });
    const card = document.createElement("div");
    const cue = document.createElement("div");

    const watcher = watchOverflow(body, card, cue);

    expect(body.getAttribute("data-qaid-scroll")).toBe("top");
    expect(card.getAttribute("data-qaid-fit")).toBe("compact");
    expect(cue.hidden).toBe(false);
    watcher.destroy();
  });

  it("updates as the body is scrolled", () => {
    const body = box({ scrollHeight: 300, clientHeight: 100 });
    const watcher = watchOverflow(body, document.createElement("div"), null);

    body.scrollTop = 200;
    body.dispatchEvent(new Event("scroll"));
    expect(body.getAttribute("data-qaid-scroll")).toBe("bottom");

    watcher.destroy();
  });

  it("re-measures on demand after a step swap", () => {
    const body = box({ scrollHeight: 100, clientHeight: 100 });
    const cue = document.createElement("div");
    const watcher = watchOverflow(body, document.createElement("div"), cue);
    expect(cue.hidden).toBe(true);

    // A taller step arrives; the box did not change, only its content.
    Object.defineProperty(body, "scrollHeight", { value: 400, configurable: true });
    watcher.refresh();

    expect(cue.hidden).toBe(false);
    watcher.destroy();
  });

  it("observes resizes when ResizeObserver exists", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let captured: (() => void) | null = null;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          captured = cb;
        }
        observe = observe;
        disconnect = disconnect;
      }
    );

    const body = box({ scrollHeight: 300, clientHeight: 100 });
    const card = document.createElement("div");
    const watcher = watchOverflow(body, card, null);

    expect(observe).toHaveBeenCalledWith(body);

    // A resize to a roomy height flips the fit state.
    Object.defineProperty(body, "clientHeight", { value: 800, configurable: true });
    captured!();
    expect(card.getAttribute("data-qaid-fit")).toBe("roomy");

    watcher.destroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it("works without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const body = box({ scrollHeight: 300, clientHeight: 100 });

    const watcher = watchOverflow(body, document.createElement("div"), null);
    expect(body.getAttribute("data-qaid-scroll")).toBe("top");
    expect(() => watcher.destroy()).not.toThrow();
  });

  it("stops listening once destroyed", () => {
    const body = box({ scrollHeight: 300, clientHeight: 100 });
    const watcher = watchOverflow(body, document.createElement("div"), null);
    watcher.destroy();

    body.scrollTop = 200;
    body.dispatchEvent(new Event("scroll"));
    // Still the value from the initial measure.
    expect(body.getAttribute("data-qaid-scroll")).toBe("top");
  });
});
