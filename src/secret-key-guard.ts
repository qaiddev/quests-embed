/**
 * Catch a platform API secret (`QAID_SECRET_…`) put in this embed's config.
 *
 * That key reads and changes a whole project, and a page's config is public.
 * When one turns up, the embed:
 * 1. drops it from the config, so it is never sent with feedback,
 * 2. logs an error in the console saying what to do,
 * 3. reports it to qaid, which revokes it and emails the project owner.
 *
 * The report carries the key's sha256, not the key, where the page can hash
 * (`crypto.subtle` needs https). On plain http it sends the key itself: it is
 * already public on that page, and it goes only to qaid, which issued it.
 *
 * Keep this file the same in thumbs-embed and quests-embed.
 */

/** A platform API secret: `QAID_SECRET_` and 40 base62 characters. */
const SECRET_PATTERN = /QAID_SECRET_[0-9A-Za-z]{16,}/g;

/** How deep into the config to look. Configs are shallow; this bounds a cycle. */
const MAX_DEPTH = 6;

/** Keys already reported from this page, so a re-mount does not report again. */
const reported = new Set<string>();

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * A copy of `value` with every secret removed, and the secrets found. Only
 * plain objects, arrays and strings are copied; anything else (an element, a
 * callback) is passed through as is.
 */
export function scrubSecretKeys<T>(value: T): { value: T; found: string[] } {
  const found = new Set<string>();

  const walk = (node: unknown, depth: number): unknown => {
    if (typeof node === "string") {
      const matches = node.match(SECRET_PATTERN);
      if (!matches) return node;
      for (const m of matches) found.add(m);
      return node.replace(SECRET_PATTERN, "").trim();
    }
    if (depth >= MAX_DEPTH) return node;
    if (Array.isArray(node)) return node.map((item) => walk(item, depth + 1));
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) out[k] = walk(v, depth + 1);
      return out;
    }
    return node;
  };

  const scrubbed = walk(value, 0) as T;
  return found.size === 0 ? { value, found: [] } : { value: scrubbed, found: [...found] };
}

/** Where qaid takes the report: `/api/leaked-key` on the endpoint's origin. */
export function leakedKeyEndpointFor(endpoint: string | undefined): string | null {
  if (!endpoint) return null;
  try {
    const base = typeof location !== "undefined" ? location.href : undefined;
    return new URL("/api/leaked-key", new URL(endpoint, base)).href;
  } catch {
    return null;
  }
}

async function sha256Hex(text: string): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return null;
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

export const SECRET_KEY_MESSAGE =
  "[qaid] A secret platform API key (QAID_SECRET_…) is in this embed's config. " +
  "Anyone who opens this page can read it, and it can read and change your project's data. " +
  "The embed ignored it, and qaid revoked it and emailed the project owner. " +
  "Make a new platform key, keep it on your server, and use the embed key (QAID_PUB_…) here.";

/** Log the problem and report each secret once per page. Never throws. */
export function reportSecretKeys(found: string[], endpoint: string | undefined, source: string): void {
  if (found.length === 0) return;
  try {
    console.error(SECRET_KEY_MESSAGE);
  } catch {
    /* a console that throws is not our problem */
  }
  const url = leakedKeyEndpointFor(endpoint);
  if (!url || typeof fetch !== "function") return;
  const pageUrl = typeof location !== "undefined" ? location.href : undefined;

  for (const secret of found) {
    if (reported.has(secret)) continue;
    reported.add(secret);
    void sha256Hex(secret)
      .then((keyHash) => {
        const body = JSON.stringify(keyHash ? { keyHash, pageUrl, source } : { key: secret, pageUrl, source });
        return fetch(url, {
          method: "POST",
          // text/plain keeps this a simple request: no preflight.
          headers: { "Content-Type": "text/plain" },
          body,
          keepalive: true,
          credentials: "omit",
        });
      })
      .catch(() => {
        /* reporting is best effort */
      });
  }
}

/**
 * Run at the top of the embed's constructor: returns the config to use, with
 * any secret taken out, and reports what it found.
 */
export function guardSecretKeys<T extends { endpoint?: string }>(config: T, source: string): T {
  try {
    const { value, found } = scrubSecretKeys(config);
    reportSecretKeys(found, config.endpoint, source);
    return value;
  } catch {
    return config;
  }
}

/** Test hook: forget what this page already reported. */
export function resetReportedSecretKeys(): void {
  reported.clear();
}
