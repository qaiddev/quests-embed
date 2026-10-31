/**
 * Single-tag embed loader (`dist/embed.js`).
 *
 * A tiny classic `<script>` that holds back the quest code (the UMD bundle,
 * `qaid-quests.umd.cjs`) until it is needed, so a quest further down the page
 * costs the page nothing while it loads. The bundle is injected when the first
 * of these happens:
 *
 *   - the quest's container comes within a screen's height of the viewport;
 *   - the page has finished loading and the browser is idle, so the quest is
 *     ready before the visitor scrolls to it;
 *   - right away, when there is no container to watch (the modal install) or
 *     the browser has no IntersectionObserver.
 *
 * When it injects the bundle it also starts fetching the quest's questions
 * (`data-config-url`) and theme (`data-theme-url`), so they download beside
 * the code instead of after it. The bundle picks the requests up from
 * `window.__qaidQuestsPrefetch` (see prefetch.ts).
 *
 * The injected bundle initializes itself from the `data-*` attributes copied
 * across from this tag (or from a `<script type="application/json">` config
 * block already on the page), exactly as if the page had loaded it directly.
 *
 * Usage:
 *   <div id="quest-mount"></div>
 *   <script src="https://unpkg.com/@qaiddev/quests-embed/dist/embed.js" defer
 *           data-endpoint="/api/responses" data-config-url="/forms/intake.json"
 *           data-container="#quest-mount"></script>
 *
 * IMPORTANT: this file must stay ES5-clean and dependency-free, like the
 * thumbs-embed loader it mirrors: it is the first thing to run on every
 * browser. Written with var/function on purpose.
 */

(function () {
  if (typeof document === "undefined") return;

  // Locate this script tag: prefer document.currentScript (valid for a plain
  // classic script), else find the last <script> whose src looks like embed.js.
  function findSelf(): HTMLScriptElement | null {
    var cur = document.currentScript as HTMLScriptElement | null;
    if (cur && cur.src) return cur;
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("quests-embed") !== -1 && /\/embed(\.min)?\.js(\?|#|$)/.test(src)) {
        return scripts[i];
      }
    }
    return null;
  }

  var self = findSelf();
  if (!self || !self.src) return;
  var tag = self;

  // Base = the directory that holds embed.js, e.g.
  // "https://unpkg.com/@qaiddev/quests-embed@1.9.0/dist/", so the bundle comes
  // from the same (CDN-versioned) place.
  var base = tag.src.substring(0, tag.src.lastIndexOf("/") + 1);

  var loaded = false;
  function load(): void {
    if (loaded) return;
    loaded = true;
    var entry = document.createElement("script");
    // Carry the config across so the bundle's auto-init sees it.
    var attrs = tag.attributes;
    for (var j = 0; j < attrs.length; j++) {
      var a = attrs[j];
      if (a.name.indexOf("data-") === 0) entry.setAttribute(a.name, a.value);
    }
    entry.src = base + "qaid-quests.umd.cjs";
    (document.head || document.documentElement).appendChild(entry);
    prefetch(tag.getAttribute("data-config-url"));
    prefetch(tag.getAttribute("data-theme-url"));
  }

  // Must match PREFETCH_KEY and the request in prefetch.ts.
  function prefetch(url: string | null): void {
    if (!url || typeof fetch !== "function") return;
    var w = window as unknown as Record<string, Record<string, Promise<Response> | undefined> | undefined>;
    var store = w.__qaidQuestsPrefetch || (w.__qaidQuestsPrefetch = {});
    if (store[url]) return;
    var request = fetch(url, { headers: { Accept: "application/json" } });
    // The embed handles a failure (it retries); this only stops a request
    // nobody picks up from reporting an unhandled rejection.
    request.catch(function () {});
    store[url] = request;
  }

  function whenIdleAfterLoad(): void {
    function idle(): void {
      var w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(load, { timeout: 3000 });
      else setTimeout(load, 200);
    }
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle);
  }

  function start(): void {
    var selector = tag.getAttribute("data-container");
    var container = selector ? document.querySelector(selector) : null;
    if (!container || typeof IntersectionObserver === "undefined") {
      load();
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        for (var k = 0; k < entries.length; k++) {
          if (entries[k].isIntersecting) {
            observer.disconnect();
            load();
            return;
          }
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(container);
    whenIdleAfterLoad();
  }

  // The container may come after the tag in the page, so look once it's parsed.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
