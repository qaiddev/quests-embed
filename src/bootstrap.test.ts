/**
 * The script-tag install reads config from the JSON config block or, failing
 * that, from the tag's own data-* attributes. Every option that can be written
 * as text has an attribute; only the onComplete / onClose callbacks need code.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseDataAttributes, parseJsonConfig } from "./bootstrap";
import type { QuestsConfig } from "./types";

function scriptWith(attrs: Record<string, string>): HTMLScriptElement {
  const script = document.createElement("script");
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  document.body.appendChild(script);
  return script;
}

function jsonConfigBlock(body: string): void {
  const script = document.createElement("script");
  script.setAttribute("type", "application/json");
  script.setAttribute("data-quests-config", "");
  script.textContent = body;
  document.body.appendChild(script);
}

function themeStyle(css: string): void {
  const style = document.createElement("style");
  style.id = "theme-css";
  style.textContent = css;
  document.body.appendChild(style);
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

const ENDPOINT = { "data-endpoint": "/api/responses" };

describe("parseDataAttributes", () => {
  it("returns null without an endpoint", () => {
    expect(parseDataAttributes(scriptWith({ "data-config-url": "/q.json" }))).toBeNull();
  });

  it("leaves every option unset when only the endpoint is given", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = parseDataAttributes(scriptWith(ENDPOINT))!;

    expect(config.endpoint).toBe("/api/responses");
    for (const [key, value] of Object.entries(config)) {
      if (key === "endpoint" || key === "colors") continue;
      expect(value, key).toBeUndefined();
    }
    expect(Object.values(config.colors!).every((v) => v === undefined)).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it("maps the attributes that already existed", () => {
    const config = parseDataAttributes(
      scriptWith({
        ...ENDPOINT,
        "data-config-url": "/q.json",
        "data-api-key": "qd_test",
        "data-container": "#form",
        "data-zindex": "9001",
        "data-positive-color": "#0f0",
        "data-negative-color": "#f00",
        "data-marker-color": "#00f",
        "data-modal-width": "520",
        "data-backdrop-opacity": "0.75",
        "data-font-family": "Inter",
        "data-font-size": "18",
        "data-auto-advance": "true",
        "data-save-debounce-ms": "250",
        "data-theme-url": "https://qaid.dev/t.json",
        "data-preset": "pill",
        "data-theme": "dark",
        "data-unstyled": "true",
      }),
    );

    expect(config).toMatchObject({
      configUrl: "/q.json",
      apiKey: "qd_test",
      container: "#form",
      zIndex: 9001,
      colors: { positive: "#0f0", negative: "#f00", marker: "#00f" },
      modalWidth: 520,
      backdropOpacity: 0.75,
      fontFamily: "Inter",
      fontSize: 18,
      autoAdvance: true,
      saveDebounceMs: 250,
      themeUrl: "https://qaid.dev/t.json",
      preset: "pill",
      theme: "dark",
      unstyled: true,
    });
  });

  const questionnaire = {
    title: "Intake",
    questions: [{ id: "name", type: "text", label: "Your name" }],
  };
  const themeDocument = { preset: "minimal", tokens: { "--qaid-q-card-radius": "0" } };

  const added: Array<[string, string, Partial<QuestsConfig>]> = [
    ["data-questionnaire", JSON.stringify(questionnaire), { questionnaire } as Partial<QuestsConfig>],
    ["data-accent-color", "#10b981", { colors: { accent: "#10b981" } }],
    ["data-error-color", "rgb(255, 0, 0)", { colors: { error: "rgb(255, 0, 0)" } }],
    ["data-focus-color", "#6366f1", { colors: { focus: "#6366f1" } }],
    ["data-css", ".qaid-q-card { border: 0; }", { css: ".qaid-q-card { border: 0; }" }],
    ["data-auto-focus", "false", { autoFocus: false }],
    ["data-auto-focus", "true", { autoFocus: true }],
    ["data-animate", "false", { animate: false }],
    ["data-animate", "true", { animate: true }],
    ["data-progress-position", "bottom", { progressPosition: "bottom" }],
    ["data-progress-position", "top", { progressPosition: "top" }],
    ["data-theme-document", JSON.stringify(themeDocument), { themeDocument } as Partial<QuestsConfig>],
    ["data-metadata", '{"feedbackId":"clx1","plan":"pro"}', { metadata: { feedbackId: "clx1", plan: "pro" } }],
  ];

  it.each(added)("%s=%s", (attr, value, expected) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = parseDataAttributes(scriptWith({ ...ENDPOINT, [attr]: value }));

    expect(config).toMatchObject(expected);
    expect(warn).not.toHaveBeenCalled();
  });

  const invalid: Array<[string, string, keyof QuestsConfig]> = [
    ["data-auto-focus", "yes", "autoFocus"],
    ["data-auto-focus", "", "autoFocus"],
    ["data-animate", "0", "animate"],
    ["data-progress-position", "middle", "progressPosition"],
    ["data-progress-position", "", "progressPosition"],
    ["data-questionnaire", "{ not json", "questionnaire"],
    ["data-questionnaire", '{"title":"No questions"}', "questionnaire"],
    ["data-questionnaire", '{"questions":"name"}', "questionnaire"],
    ["data-questionnaire", "[]", "questionnaire"],
    ["data-theme-document", "not json", "themeDocument"],
    ["data-theme-document", '"minimal"', "themeDocument"],
    ["data-theme-document", "null", "themeDocument"],
    ["data-metadata", '["clx1"]', "metadata"],
    ["data-metadata", "42", "metadata"],
    ["data-metadata", "", "metadata"],
  ];

  it.each(invalid)(
    "ignores %s=%j with one warning naming the attribute",
    (attr, value, key) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config = parseDataAttributes(scriptWith({ ...ENDPOINT, [attr]: value }));

      expect(config?.[key]).toBeUndefined();
      expect(warn).toHaveBeenCalledOnce();
      expect(String(warn.mock.calls[0]![0])).toContain(attr);
    },
  );

  it("sends new and legacy colour keys through side by side", () => {
    const config = parseDataAttributes(
      scriptWith({ ...ENDPOINT, "data-accent-color": "#111", "data-positive-color": "#222" }),
    );
    // The embed resolves accent ?? positive; the parser keeps both.
    expect(config?.colors).toMatchObject({ accent: "#111", positive: "#222" });
  });

  it("takes css from the element named by data-css-selector", () => {
    themeStyle("  .from-selector {}  ");
    const config = parseDataAttributes(
      scriptWith({ ...ENDPOINT, "data-css-selector": "#theme-css" }),
    );
    expect(config?.css).toBe(".from-selector {}");
  });

  it("yields empty css when the selector matches nothing", () => {
    const config = parseDataAttributes(
      scriptWith({ ...ENDPOINT, "data-css-selector": "#missing" }),
    );
    expect(config?.css).toBe("");
  });

  it("prefers data-css over data-css-selector, as the JSON block prefers css", () => {
    themeStyle(".from-selector {}");
    const config = parseDataAttributes(
      scriptWith({ ...ENDPOINT, "data-css": ".inline {}", "data-css-selector": "#theme-css" }),
    );
    expect(config?.css).toBe(".inline {}");
  });

  it("falls back to data-css-selector when data-css is empty", () => {
    themeStyle(".from-selector {}");
    const config = parseDataAttributes(
      scriptWith({ ...ENDPOINT, "data-css": "", "data-css-selector": "#theme-css" }),
    );
    expect(config?.css).toBe(".from-selector {}");
  });
});

describe("parseJsonConfig", () => {
  it("returns null when there is no block", () => {
    expect(parseJsonConfig()).toBeNull();
  });

  it("returns null for an empty block", () => {
    jsonConfigBlock("   ");
    expect(parseJsonConfig()).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    jsonConfigBlock("{ not json");
    expect(parseJsonConfig()).toBeNull();
  });

  it("reads the block and resolves cssSelector into css", () => {
    themeStyle(".from-selector {}");
    jsonConfigBlock(
      JSON.stringify({ endpoint: "/api/responses", configUrl: "/q.json", cssSelector: "#theme-css" }),
    );

    const config = parseJsonConfig() as Record<string, unknown>;
    expect(config).toMatchObject({ endpoint: "/api/responses", css: ".from-selector {}" });
    expect(config.cssSelector).toBeUndefined();
  });

  it("keeps an explicit css over cssSelector", () => {
    themeStyle(".from-selector {}");
    jsonConfigBlock(
      JSON.stringify({ endpoint: "/e", css: ".explicit {}", cssSelector: "#theme-css" }),
    );
    expect(parseJsonConfig()?.css).toBe(".explicit {}");
  });
});
