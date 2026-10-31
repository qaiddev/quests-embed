/**
 * Requests the script-tag loader (`embed-loader.ts`) starts while the quest
 * code is still downloading, so the questions and theme are on their way, or
 * already here, by the time the code asks for them.
 *
 * The loader keeps them on `window`, keyed by the exact URL from the tag's
 * `data-config-url` / `data-theme-url`, which is the same string the embed
 * fetches. Each is taken once: a response body can only be read once.
 */

/** The window property the loader writes and the embed reads. */
export const PREFETCH_KEY = "__qaidQuestsPrefetch";

type PrefetchStore = Record<string, Promise<Response> | undefined>;

/** Fetch `url` as the embed would, or take the loader's request for it. */
export function fetchJson(url: string): Promise<Response> {
  const store = (window as unknown as Record<string, PrefetchStore | undefined>)[PREFETCH_KEY];
  const early = store?.[url];
  if (early) {
    delete store![url];
    // A failed early request is retried rather than reported.
    return early.catch(() => fetch(url, { headers: { Accept: "application/json" } }));
  }
  return fetch(url, { headers: { Accept: "application/json" } });
}
