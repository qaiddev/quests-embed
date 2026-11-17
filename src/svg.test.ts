import { describe, it, expect } from "vitest";
import { svgIcon, CLOSE_ICON, CHECK_ICON, SCROLL_CUE_ICON } from "./svg";

describe("svgIcon", () => {
  it.each([
    ["close", CLOSE_ICON],
    ["check", CHECK_ICON],
    ["scroll cue", SCROLL_CUE_ICON],
  ])("builds the %s icon as real SVG nodes", (_name, spec) => {
    const svg = svgIcon(spec);
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.localName).toBe("svg");
    for (const [k, v] of Object.entries(spec.svg)) expect(svg.getAttribute(k)).toBe(v);
    const path = svg.firstElementChild!;
    expect(path.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(path.localName).toBe("path");
    for (const [k, v] of Object.entries(spec.path)) expect(path.getAttribute(k)).toBe(v);
  });

  it("keeps viewBox's case, which an SVG needs to scale", () => {
    expect(svgIcon(CHECK_ICON).hasAttribute("viewBox")).toBe(true);
  });
});
