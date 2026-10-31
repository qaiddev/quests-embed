import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const EMBED_SRC = "https://unpkg.com/@qaiddev/quests-embed@1.9.0/dist/embed.js";
const BUNDLE_SRC = "https://unpkg.com/@qaiddev/quests-embed@1.9.0/dist/qaid-quests.umd.cjs";

function addLoaderTag(src: string, data: Record<string, string> = {}): HTMLScriptElement {
  const s = document.createElement("script");
  s.src = src;
  Object.keys(data).forEach((k) => s.setAttribute(k, data[k]));
  document.head.appendChild(s);
  return s;
}

function setCurrentScript(el: HTMLScriptElement | null): void {
  Object.defineProperty(document, "currentScript", { value: el, configurable: true });
}

function setReadyState(state: DocumentReadyState): void {
  Object.defineProperty(document, "readyState", { value: state, configurable: true });
}

const injected = () =>
  Array.from(document.querySelectorAll<HTMLScriptElement>("script")).filter((s) =>
    s.src.endsWith("qaid-quests.umd.cjs"),
  );

/** A controllable IntersectionObserver stand-in. */
class FakeObserver {
  static last: FakeObserver | null = null;
  observed: Element[] = [];
  disconnected = false;
  constructor(
    public cb: (entries: Array<{ isIntersecting: boolean }>) => void,
    public opts: { rootMargin?: string },
  ) {
    FakeObserver.last = this;
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {
    this.disconnected = true;
  }
}

async function runLoader(): Promise<void> {
  await import("./embed-loader");
}

describe("single-tag quest loader (embed-loader.ts)", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    vi.resetModules();
    FakeObserver.last = null;
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    setReadyState("complete");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setCurrentScript(null);
    setReadyState("complete");
  });

  it("loads the bundle right away when there is no container to watch", async () => {
    setCurrentScript(addLoaderTag(EMBED_SRC, { "data-endpoint": "/r", "data-config-url": "/q.json" }));
    await runLoader();
    const [entry] = injected();
    expect(entry.src).toBe(BUNDLE_SRC);
    expect(entry.getAttribute("data-endpoint")).toBe("/r");
    expect(entry.getAttribute("data-config-url")).toBe("/q.json");
    expect(entry.hasAttribute("src")).toBe(true);
  });

  it("waits for the container to near the viewport, then loads once", async () => {
    vi.stubGlobal("requestIdleCallback", vi.fn());
    document.body.innerHTML = '<div id="m"></div>';
    setCurrentScript(addLoaderTag(EMBED_SRC, { "data-endpoint": "/r", "data-container": "#m" }));
    await runLoader();
    const obs = FakeObserver.last!;
    expect(obs.observed[0]).toBe(document.getElementById("m"));
    expect(obs.opts.rootMargin).toBe("100% 0px");
    expect(injected()).toHaveLength(0);

    obs.cb([{ isIntersecting: false }]);
    expect(injected()).toHaveLength(0);
    obs.cb([{ isIntersecting: true }]);
    obs.cb([{ isIntersecting: true }]);
    expect(injected()).toHaveLength(1);
    expect(injected()[0].getAttribute("data-container")).toBe("#m");
    expect(obs.disconnected).toBe(true);
  });

  it("loads when the browser is idle after the page has loaded, if not scrolled to first", async () => {
    const ric = vi.fn();
    vi.stubGlobal("requestIdleCallback", ric);
    setReadyState("interactive");
    document.body.innerHTML = '<div id="m"></div>';
    setCurrentScript(addLoaderTag(EMBED_SRC, { "data-endpoint": "/r", "data-container": "#m" }));
    await runLoader();
    expect(ric).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("load"));
    expect(ric).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    ric.mock.calls[0][0]();
    expect(injected()).toHaveLength(1);
    // The observer firing later doesn't load it again.
    FakeObserver.last!.cb([{ isIntersecting: true }]);
    expect(injected()).toHaveLength(1);
  });

  it("falls back to a timer where requestIdleCallback is missing", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    document.body.innerHTML = '<div id="m"></div>';
    setCurrentScript(addLoaderTag(EMBED_SRC, { "data-endpoint": "/r", "data-container": "#m" }));
    await runLoader();
    expect(injected()).toHaveLength(0);
    vi.advanceTimersByTime(200);
    expect(injected()).toHaveLength(1);
  });

  it("loads right away without IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    document.body.innerHTML = '<div id="m"></div>';
    setCurrentScript(addLoaderTag(EMBED_SRC, { "data-endpoint": "/r", "data-container": "#m" }));
    await runLoader();
    expect(injected()).toHaveLength(1);
  });

  it("waits for the document to be parsed before looking for the container", async () => {
    setReadyState("loading");
    setCurrentScript(addLoaderTag(EMBED_SRC, { "data-endpoint": "/r", "data-container": "#m" }));
    await runLoader();
    expect(FakeObserver.last).toBeNull();
    document.body.innerHTML = '<div id="m"></div>';
    vi.stubGlobal("requestIdleCallback", vi.fn());
    setReadyState("interactive");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(FakeObserver.last!.observed[0]).toBe(document.getElementById("m"));
  });

  it("finds its own tag by src when currentScript is unavailable", async () => {
    setCurrentScript(null);
    addLoaderTag("https://example.com/other.js");
    addLoaderTag(EMBED_SRC, { "data-endpoint": "/r" });
    await runLoader();
    expect(injected()[0].src).toBe(BUNDLE_SRC);
  });

  it("does nothing when it can't find its own tag", async () => {
    setCurrentScript(null);
    addLoaderTag("https://example.com/other.js");
    await runLoader();
    expect(injected()).toHaveLength(0);
  });
});
