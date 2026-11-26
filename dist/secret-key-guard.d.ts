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
/**
 * A copy of `value` with every secret removed, and the secrets found. Only
 * plain objects, arrays and strings are copied; anything else (an element, a
 * callback) is passed through as is.
 */
export declare function scrubSecretKeys<T>(value: T): {
    value: T;
    found: string[];
};
/** Where qaid takes the report: `/api/leaked-key` on the endpoint's origin. */
export declare function leakedKeyEndpointFor(endpoint: string | undefined): string | null;
export declare const SECRET_KEY_MESSAGE: string;
/** Log the problem and report each secret once per page. Never throws. */
export declare function reportSecretKeys(found: string[], endpoint: string | undefined, source: string): void;
/**
 * Run at the top of the embed's constructor: returns the config to use, with
 * any secret taken out, and reports what it found.
 */
export declare function guardSecretKeys<T extends {
    endpoint?: string;
}>(config: T, source: string): T;
/** Test hook: forget what this page already reported. */
export declare function resetReportedSecretKeys(): void;
