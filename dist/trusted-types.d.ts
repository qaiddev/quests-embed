/**
 * The embed's one Trusted Types policy, `qaid-embed`.
 *
 * On a page that sets `require-trusted-types-for 'script'`, assigning a plain
 * string to `script.src` throws. The embed computes every script URL it sets
 * itself (its own stage-two file, the quests module), so it passes each one
 * through this policy, which only signs URLs the embed registered a moment
 * before. A partner allows it with `trusted-types qaid-embed`.
 *
 * The policy is created once per page and kept on `window`, because embed.js,
 * the bundle it loads, and thumbs-embed (which keeps its own copy of this
 * file) all want the same name, and a page's `trusted-types` directive
 * refuses a second policy of one name unless it says `'allow-duplicates'`.
 *
 * When the browser has no Trusted Types, or the page's directive does not
 * list `qaid-embed`, the URL comes back as a plain string. The assignment
 * then works or throws exactly as it would have; callers catch it.
 *
 * ES5-clean on purpose: embed.js, which runs on the oldest browsers we
 * support, bundles this file too.
 */
export declare var POLICY_NAME: string;
/**
 * A value for `script.src`: a TrustedScriptURL from the `qaid-embed` policy
 * when one exists, else the string itself.
 */
export declare function trustedScriptUrl(url: string): string;
/**
 * A value for an inline script's `text`: a TrustedScript from the `qaid-embed`
 * policy when one exists, else the string itself. Only embed.js's import map
 * uses it. Throws when the page's policy can't sign scripts (one an older
 * release created); the caller then takes its fallback.
 */
export declare function trustedScript(text: string): string;
/** @internal Test seam: forget the page's policy. */
export declare function _resetTrustedTypes(): void;
