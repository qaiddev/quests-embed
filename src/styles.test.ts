/**
 * Tests for the CSS-variable + style helpers in styles.ts.
 *
 * buildCssVars only emits a var when the host explicitly passed a value
 * (so a theme document's :where() block can still win the cascade), and
 * derives a contrasting text color for accent/focus backgrounds.
 */

import { describe, expect, it } from "vitest";
import {
  applyCssVars,
  buildCssVars,
  getEmbedStyles,
  getPresetCss,
} from "./styles";

describe("buildCssVars", () => {
  it("emits nothing when called with no options", () => {
    expect(buildCssVars()).toEqual({});
    expect(buildCssVars({})).toEqual({});
  });

  it("emits accent var plus a derived contrasting text color", () => {
    const vars = buildCssVars({ accentColor: "#000000" });
    expect(vars["--qaid-q-accent"]).toBe("#000000");
    // Dark background -> white text
    expect(vars["--qaid-q-accent-text"]).toBe("white");
  });

  it("derives black accent text for a light accent color", () => {
    const vars = buildCssVars({ accentColor: "#ffffff" });
    expect(vars["--qaid-q-accent-text"]).toBe("black");
  });

  it("emits focus var with its own contrasting text color", () => {
    const vars = buildCssVars({ focusColor: "#ffffff" });
    expect(vars["--qaid-q-focus"]).toBe("#ffffff");
    expect(vars["--qaid-q-focus-text"]).toBe("black");
  });

  it("emits error var without a text color", () => {
    const vars = buildCssVars({ errorColor: "#ff0000" });
    expect(vars).toEqual({ "--qaid-q-error": "#ff0000" });
  });

  it("formats modalWidth and fontSize with px suffix", () => {
    const vars = buildCssVars({ modalWidth: 480, fontSize: 16 });
    expect(vars["--qaid-modal-width"]).toBe("480px");
    expect(vars["--qaid-font-size"]).toBe("16px");
  });

  it("stringifies backdropOpacity and passes fontFamily through", () => {
    const vars = buildCssVars({ backdropOpacity: 0.4, fontFamily: "Inter, sans-serif" });
    expect(vars["--qaid-backdrop-opacity"]).toBe("0.4");
    expect(vars["--qaid-font-family"]).toBe("Inter, sans-serif");
  });

  it("emits a backdropOpacity of 0 (not skipped as falsy)", () => {
    const vars = buildCssVars({ backdropOpacity: 0 });
    expect(vars["--qaid-backdrop-opacity"]).toBe("0");
  });

  it("collects every option together", () => {
    const vars = buildCssVars({
      accentColor: "#123456",
      errorColor: "#ff0000",
      focusColor: "#00ff00",
      modalWidth: 500,
      backdropOpacity: 0.5,
      fontFamily: "serif",
      fontSize: 18,
    });
    expect(Object.keys(vars).sort()).toEqual(
      [
        "--qaid-q-accent",
        "--qaid-q-accent-text",
        "--qaid-q-error",
        "--qaid-q-focus",
        "--qaid-q-focus-text",
        "--qaid-modal-width",
        "--qaid-backdrop-opacity",
        "--qaid-font-family",
        "--qaid-font-size",
      ].sort(),
    );
  });

  describe("color parsing for contrast", () => {
    it("expands 3-digit shorthand hex", () => {
      // #fff -> white bg -> black text
      expect(buildCssVars({ accentColor: "#fff" })["--qaid-q-accent-text"]).toBe("black");
      // #000 -> black bg -> white text
      expect(buildCssVars({ accentColor: "#000" })["--qaid-q-accent-text"]).toBe("white");
    });

    it("parses rgb() colors", () => {
      expect(buildCssVars({ accentColor: "rgb(255, 255, 255)" })["--qaid-q-accent-text"]).toBe(
        "black",
      );
      expect(buildCssVars({ accentColor: "rgb(0, 0, 0)" })["--qaid-q-accent-text"]).toBe("white");
    });

    it("falls back to white text for unparseable colors", () => {
      expect(buildCssVars({ accentColor: "hsl(200, 50%, 50%)" })["--qaid-q-accent-text"]).toBe(
        "white",
      );
      expect(buildCssVars({ accentColor: "rebeccapurple" })["--qaid-q-accent-text"]).toBe("white");
    });
  });
});

describe("applyCssVars", () => {
  it("sets each var as an inline custom property on the element", () => {
    const el = document.createElement("div");
    applyCssVars(el, { "--qaid-q-accent": "#fff", "--qaid-font-size": "16px" });
    expect(el.style.getPropertyValue("--qaid-q-accent")).toBe("#fff");
    expect(el.style.getPropertyValue("--qaid-font-size")).toBe("16px");
  });

  it("does nothing with an empty map", () => {
    const el = document.createElement("div");
    applyCssVars(el, {});
    expect(el.getAttribute("style")).toBeFalsy();
  });
});

describe("getEmbedStyles", () => {
  it("returns the inlined shadow stylesheet as a non-empty string", () => {
    const css = getEmbedStyles();
    expect(typeof css).toBe("string");
    expect(css.length).toBeGreaterThan(0);
  });

  it("disables motion under prefers-reduced-motion", () => {
    const css = getEmbedStyles();
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    // Neutralises animations (slide/fade + the infinite saving-dot pulse)
    // and transitions (progress-bar width) via near-zero durations.
    expect(css).toContain("animation-duration: 0.01ms !important");
    expect(css).toContain("transition-duration: 0.01ms !important");
  });

  it("keeps borders/focus/progress visible under forced-colors", () => {
    const css = getEmbedStyles();
    expect(css).toContain("@media (forced-colors: active)");
    // System-color focus outline + progress fill survive High Contrast.
    expect(css).toContain("outline: 2px solid Highlight");
    expect(css).toMatch(/\.qaid-q-progress-fill\s*\{[^}]*background:\s*Highlight/);
  });

  it("declares a :focus-visible outline on interactive controls", () => {
    const css = getEmbedStyles();
    expect(css).toContain(".qaid-q-input:focus-visible");
    expect(css).toMatch(/outline:\s*2px solid transparent/);
  });
});

describe("getPresetCss", () => {
  it("returns CSS for a known preset", () => {
    expect(typeof getPresetCss("minimal")).toBe("string");
  });

  it("returns a (no-op) CSS string for the default preset", () => {
    // The default preset is an explicit empty rule, not literally "".
    expect(typeof getPresetCss("default")).toBe("string");
  });
});
