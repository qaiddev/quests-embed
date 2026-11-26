import { afterEach, describe, expect, it, vi } from "vitest";
import { QaidQuests } from "./embed";
import { resetReportedSecretKeys } from "./secret-key-guard";

const SECRET = "QAID_SECRET_abcdefghijklmnopqrstuvwxyz0123456789ABCD";

describe("a secret key in the quests config", () => {
  let embed: QaidQuests | undefined;

  afterEach(() => {
    embed?.destroy();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetReportedSecretKeys();
  });

  it("is dropped, logged and reported, never used as the key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    document.body.innerHTML = '<div id="mount"></div>';

    embed = new QaidQuests({
      endpoint: "https://qaid.dev/api/quests/responses",
      apiKey: SECRET,
      container: "#mount",
      questionnaire: { id: "q1", title: "T", questions: [{ id: "a", type: "text", label: "Name?" }] },
    } as ConstructorParameters<typeof QaidQuests>[0]);

    expect((embed as unknown as { config: { apiKey: string } }).config.apiKey).toBe("");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("QAID_SECRET_"));
    await vi.waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => u === "https://qaid.dev/api/leaked-key")).toBe(true),
    );
    for (const [, callInit] of fetchMock.mock.calls) expect(String(callInit?.body ?? "")).not.toContain(SECRET);
  });
});
