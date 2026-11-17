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

interface ScriptUrlPolicy {
  createScriptURL(url: string): unknown;
  /** Absent on a policy an older embed release created on this page. */
  createScript?: (text: string) => unknown;
}

interface SharedPolicy {
  policy: ScriptUrlPolicy | null;
  allowed: Record<string, boolean>;
  /** Inline script texts (embed.js's import map) registered a moment before. */
  allowedScripts?: Record<string, boolean>;
}

interface TrustedTypesFactory {
  createPolicy(
    name: string,
    rules: {
      createScriptURL: (url: string) => string;
      createScript: (text: string) => string;
    }
  ): ScriptUrlPolicy;
}

export var POLICY_NAME = "qaid-embed";
var KEY = "__qaidEmbedTrustedTypes";

function shared(): SharedPolicy | null {
  if (typeof window === "undefined") return null;
  var w = window as unknown as Record<string, unknown>;
  var tt = w.trustedTypes as TrustedTypesFactory | undefined;
  if (!tt || typeof tt.createPolicy !== "function") return null;
  var existing = w[KEY] as SharedPolicy | undefined;
  if (existing) return existing;

  var allowed: Record<string, boolean> = Object.create(null);
  var allowedScripts: Record<string, boolean> = Object.create(null);
  var policy: ScriptUrlPolicy | null = null;
  try {
    policy = tt.createPolicy(POLICY_NAME, {
      createScriptURL: function (url: string): string {
        if (allowed[url] === true) return url;
        throw new TypeError("qaid-embed: refused script URL " + url);
      },
      createScript: function (text: string): string {
        if (allowedScripts[text] === true) return text;
        throw new TypeError("qaid-embed: refused inline script");
      },
    });
  } catch (e) {
    // The page's trusted-types directive does not list qaid-embed.
    policy = null;
  }
  var state: SharedPolicy = { policy: policy, allowed: allowed, allowedScripts: allowedScripts };
  try {
    Object.defineProperty(w, KEY, { value: state, configurable: true });
  } catch (e) {
    /* frozen window: keep it local */
  }
  return state;
}

/**
 * A value for `script.src`: a TrustedScriptURL from the `qaid-embed` policy
 * when one exists, else the string itself.
 */
export function trustedScriptUrl(url: string): string {
  var s = shared();
  if (!s || !s.policy) return url;
  s.allowed[url] = true;
  return s.policy.createScriptURL(url) as string;
}

/**
 * A value for an inline script's `text`: a TrustedScript from the `qaid-embed`
 * policy when one exists, else the string itself. Only embed.js's import map
 * uses it. Throws when the page's policy can't sign scripts (one an older
 * release created); the caller then takes its fallback.
 */
export function trustedScript(text: string): string {
  var s = shared();
  if (!s || !s.policy) return text;
  if (!s.allowedScripts || typeof s.policy.createScript !== "function") {
    throw new TypeError("qaid-embed: this page's policy cannot sign scripts");
  }
  s.allowedScripts[text] = true;
  return s.policy.createScript(text) as string;
}

/** @internal Test seam: forget the page's policy. */
export function _resetTrustedTypes(): void {
  if (typeof window === "undefined") return;
  try {
    delete (window as unknown as Record<string, unknown>)[KEY];
  } catch (e) {
    /* nothing to forget */
  }
}
