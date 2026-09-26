import { afterEach, describe, expect, it, vi } from "vitest";
import { randomId } from "./embed";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses crypto.randomUUID when the page is a secure context", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });
    expect(randomId()).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("falls back to getRandomValues on a plain http:// page, where randomUUID is missing", () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(0xff));
    vi.stubGlobal("crypto", { getRandomValues });
    const id = randomId();
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(id).toMatch(UUID_V4);
  });

  it("falls back to Math.random when there is no crypto at all", () => {
    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(randomId()).toBe("00000000-0000-4000-8000-000000000000");
  });
});
