import { describe, it, expect, vi, afterEach } from "vitest";
import { trustedScriptUrl, _resetTrustedTypes, POLICY_NAME } from "./trusted-types";

/** A stand-in for window.trustedTypes that records the policy it makes. */
function fakeTrustedTypes(opts: { refuse?: boolean } = {}) {
  const made: Array<{ name: string; rules: { createScriptURL: (u: string) => string } }> = [];
  const factory = {
    createPolicy: vi.fn((name: string, rules: { createScriptURL: (u: string) => string }) => {
      if (opts.refuse) throw new TypeError("policy not allowed by CSP");
      made.push({ name, rules });
      return { createScriptURL: (u: string) => ({ signed: rules.createScriptURL(u) }) };
    }),
  };
  vi.stubGlobal("trustedTypes", factory);
  return { factory, made };
}

afterEach(() => {
  _resetTrustedTypes();
  vi.unstubAllGlobals();
});

describe("trustedScriptUrl", () => {
  it("returns the plain string when the browser has no Trusted Types", () => {
    expect(trustedScriptUrl("https://a/x.js")).toBe("https://a/x.js");
  });

  it("signs the URL through one qaid-embed policy per page", () => {
    const { factory, made } = fakeTrustedTypes();
    const a = trustedScriptUrl("https://a/x.js") as unknown as { signed: string };
    const b = trustedScriptUrl("https://a/y.js") as unknown as { signed: string };
    expect(a.signed).toBe("https://a/x.js");
    expect(b.signed).toBe("https://a/y.js");
    expect(factory.createPolicy).toHaveBeenCalledTimes(1);
    expect(made[0].name).toBe(POLICY_NAME);
    expect(POLICY_NAME).toBe("qaid-embed");
  });

  it("the policy refuses any URL the embed did not register", () => {
    const { made } = fakeTrustedTypes();
    trustedScriptUrl("https://a/x.js");
    expect(() => made[0].rules.createScriptURL("https://evil/x.js")).toThrow(/refused/);
  });

  it("falls back to the plain string when the page's CSP refuses the policy", () => {
    fakeTrustedTypes({ refuse: true });
    expect(trustedScriptUrl("https://a/x.js")).toBe("https://a/x.js");
  });

  it("shares the policy with another copy of the embed on the page", () => {
    const { factory } = fakeTrustedTypes();
    trustedScriptUrl("https://a/x.js");
    const shared = (window as unknown as Record<string, unknown>).__qaidEmbedTrustedTypes;
    expect(shared).toBeTruthy();
    trustedScriptUrl("https://a/z.js");
    expect(factory.createPolicy).toHaveBeenCalledTimes(1);
  });

  it("keeps working when the shared state can't be stored on window", () => {
    fakeTrustedTypes();
    const define = vi.spyOn(Object, "defineProperty").mockImplementationOnce(() => {
      throw new TypeError("frozen");
    });
    expect((trustedScriptUrl("https://a/x.js") as unknown as { signed: string }).signed).toBe(
      "https://a/x.js"
    );
    define.mockRestore();
  });

  it("is a no-op outside a browser", () => {
    vi.stubGlobal("window", undefined);
    expect(trustedScriptUrl("https://a/x.js")).toBe("https://a/x.js");
    expect(() => _resetTrustedTypes()).not.toThrow();
  });
});
