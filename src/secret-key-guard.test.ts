import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SECRET_KEY_MESSAGE,
  guardSecretKeys,
  leakedKeyEndpointFor,
  reportSecretKeys,
  resetReportedSecretKeys,
  scrubSecretKeys,
} from "./secret-key-guard";

const SECRET = "QAID_SECRET_abcdefghijklmnopqrstuvwxyz0123456789ABCD";
const OTHER = "QAID_SECRET_ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210zyxw";
const PUB = "QAID_PUB_abcdefghijklmnopqrstuvwx";

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Let the hash-then-fetch chain run (hashing is async and can be slow under load). */
const settle = () => vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
/** For paths that should never fetch: give the chain a moment, then look. */
const pause = () => new Promise((r) => setTimeout(r, 20));

let fetchMock: ReturnType<typeof vi.fn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetReportedSecretKeys();
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
  vi.stubGlobal("fetch", fetchMock);
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  errorSpy.mockRestore();
});

describe("scrubSecretKeys", () => {
  it("leaves a clean config untouched, same object", () => {
    const config = { endpoint: "https://qaid.dev/api/feedback", apiKey: PUB, offset: { x: 1 } };
    const result = scrubSecretKeys(config);
    expect(result.found).toEqual([]);
    expect(result.value).toBe(config);
  });

  it("finds secrets anywhere, and removes them", () => {
    const onClick = () => {};
    const el = { nodeType: 1 };
    const config = {
      apiKey: SECRET,
      quests: { apiKey: OTHER },
      metadata: [`token ${SECRET}`],
      onClick,
      el: Object.create(el),
    };
    const { value, found } = scrubSecretKeys(config);
    expect(found.sort()).toEqual([OTHER, SECRET].sort());
    expect(value.apiKey).toBe("");
    expect(value.quests.apiKey).toBe("");
    expect(value.metadata).toEqual(["token"]);
    expect(value.onClick).toBe(onClick);
    expect(value.el).toBe(config.el);
    // The caller's object is not changed.
    expect(config.apiKey).toBe(SECRET);
  });

  it("does not match the embed key, a short tail or an old qd_live_ key", () => {
    expect(scrubSecretKeys({ a: PUB, b: "QAID_SECRET_short", c: "qd_live_abcdefghijklmnopqrstuvwxyz" }).found).toEqual([]);
  });

  it("stops at the depth limit", () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: SECRET } } } } } } };
    expect(scrubSecretKeys(deep).found).toEqual([]);
  });

  it("copies objects with no prototype", () => {
    const bare = Object.assign(Object.create(null), { apiKey: SECRET });
    expect(scrubSecretKeys({ bare }).value.bare.apiKey).toBe("");
  });
});

describe("leakedKeyEndpointFor", () => {
  it("uses the endpoint's origin", () => {
    expect(leakedKeyEndpointFor("https://qaid.dev/api/feedback")).toBe("https://qaid.dev/api/leaked-key");
    expect(leakedKeyEndpointFor("https://stg.qaid.dev/api/quests/responses")).toBe(
      "https://stg.qaid.dev/api/leaked-key",
    );
  });

  it("resolves a relative endpoint against the page", () => {
    expect(leakedKeyEndpointFor("/api/feedback")).toBe(new URL("/api/leaked-key", location.href).href);
  });

  it("needs no page location for an absolute endpoint", () => {
    vi.stubGlobal("location", undefined);
    expect(leakedKeyEndpointFor("https://qaid.dev/api/feedback")).toBe("https://qaid.dev/api/leaked-key");
  });

  it("gives up without an endpoint or on a bad one", () => {
    expect(leakedKeyEndpointFor(undefined)).toBeNull();
    expect(leakedKeyEndpointFor("http://[")).toBeNull();
  });
});

describe("reportSecretKeys", () => {
  it("logs the error and posts the key's sha256, not the key", async () => {
    reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "thumbs-embed");
    await settle();

    expect(errorSpy).toHaveBeenCalledWith(SECRET_KEY_MESSAGE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://qaid.dev/api/leaked-key");
    expect(init.headers).toEqual({ "Content-Type": "text/plain" });
    const body = JSON.parse(init.body);
    expect(body).toEqual({ keyHash: await sha256(SECRET), pageUrl: location.href, source: "thumbs-embed" });
    expect(init.body).not.toContain(SECRET);
  });

  it("sends the key itself when the page cannot hash", async () => {
    vi.stubGlobal("crypto", {});
    reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "quests-embed");
    await settle();
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).key).toBe(SECRET);
  });

  it("sends the key itself when hashing throws", async () => {
    vi.stubGlobal("crypto", { subtle: { digest: () => Promise.reject(new Error("no")) } });
    reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "quests-embed");
    await settle();
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).key).toBe(SECRET);
  });

  it("reports a key once per page", async () => {
    reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "thumbs-embed");
    reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "thumbs-embed");
    await settle();
    await pause();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("logs but cannot report where there is no fetch", () => {
    vi.stubGlobal("fetch", undefined);
    expect(() => reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "thumbs-embed")).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("reports with no page URL when there is no location", async () => {
    vi.stubGlobal("location", undefined);
    reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "thumbs-embed");
    await settle();
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).pageUrl).toBeUndefined();
  });

  it("does nothing for an empty list", () => {
    reportSecretKeys([], "https://qaid.dev/api/feedback", "thumbs-embed");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still logs with no endpoint to report to", () => {
    reportSecretKeys([SECRET], undefined, "thumbs-embed");
    expect(errorSpy).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("survives a failing fetch and a throwing console", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    errorSpy.mockImplementation(() => {
      throw new Error("console gone");
    });
    expect(() => reportSecretKeys([SECRET], "https://qaid.dev/api/feedback", "thumbs-embed")).not.toThrow();
    await settle();
    await pause();
  });
});

describe("guardSecretKeys", () => {
  it("returns the scrubbed config and reports", async () => {
    const config = guardSecretKeys({ endpoint: "https://qaid.dev/api/feedback", apiKey: SECRET }, "thumbs-embed");
    expect(config.apiKey).toBe("");
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("hands back the original config if scanning throws", () => {
    const config = { endpoint: "x" } as { endpoint: string; boom?: unknown };
    Object.defineProperty(config, "boom", {
      enumerable: true,
      get() {
        throw new Error("getter");
      },
    });
    expect(guardSecretKeys(config, "thumbs-embed")).toBe(config);
  });
});
