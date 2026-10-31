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
