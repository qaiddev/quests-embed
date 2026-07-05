/**
 * Shared accessibility primitives for the qaid embeds.
 *
 * These helpers are intentionally framework-free and self-contained (no CSS
 * dependency) so they can be dropped into any open shadow root. They cover the
 * cross-cutting WCAG 2.2 AA infrastructure called for in the embed
 * accessibility plan: live-region announcements, focus management (trap,
 * save/restore), dialog semantics, and background isolation.
 *
 * The API is deliberately identical to @qaiddev/thumbs-embed's a11y module so
 * both embeds consume one shared surface. In quests-embed specifically:
 *   - {@link announce} is a GENERAL-PURPOSE announcer for step-change,
 *     loading, and thank-you messages. It is separate from the pre-existing
 *     per-step `.qaid-q-error` region (aria-live="polite") in embed.ts — that
 *     region stays the owner of field-validation errors. Callers should route
 *     step/status text through announce()'s polite region and only use the
 *     assertive region for load failures, so the two never clobber each other.
 */

/** Host for the live regions: either a shadow root or a plain element. */
export type AnnounceRoot = ShadowRoot | HTMLElement;

/** Options accepted by {@link announce}. */
export interface AnnounceOptions {
  /** Route the message through the assertive (role="alert") region. */
  assertive?: boolean;
}

/** Options accepted by {@link applyDialog}. */
export interface ApplyDialogOptions {
  /** id of the element that labels the dialog (wired via aria-labelledby). */
  labelledbyId?: string;
  /** id of the element that describes the dialog (wired via aria-describedby). */
  describedbyId?: string;
  /** Fallback accessible name when no labelling element exists. */
  label?: string;
}

/** Handle returned by {@link createFocusTrap}. */
export interface FocusTrap {
  /** Remove the trap's key handler and clean up any tabindex it added. */
  release(): void;
}

const LIVE_ATTR = "data-qaid-a11y-live";

const VISUALLY_HIDDEN_CSS =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;" +
  "border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);" +
  "white-space:nowrap;";

/**
 * Selector for natively focusable / author-focusable elements. Elements that
 * opt out with tabindex="-1" are excluded below in {@link getFocusable}.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "textarea",
  "select",
  "[tabindex]",
].join(",");

function ownerDoc(root: AnnounceRoot): Document {
  return root.ownerDocument || document;
}

function getLiveRegion(root: AnnounceRoot, assertive: boolean): HTMLElement {
  const kind = assertive ? "assertive" : "polite";
  const existing = root.querySelector<HTMLElement>(
    `[${LIVE_ATTR}="${kind}"]`,
  );
  if (existing) return existing;

  const doc = ownerDoc(root);
  const region = doc.createElement("div");
  region.setAttribute(LIVE_ATTR, kind);
  region.setAttribute("role", assertive ? "alert" : "status");
  region.setAttribute("aria-live", assertive ? "assertive" : "polite");
  region.setAttribute("aria-atomic", "true");
  region.style.cssText = VISUALLY_HIDDEN_CSS;
  root.appendChild(region);
  return region;
}

/**
 * Announce a message to assistive technology via a visually-hidden live region
 * mounted inside `root`. The two regions (polite role="status" and assertive
 * role="alert") are created lazily on first use and reused thereafter.
 *
 * The target region is cleared before the new text is written so that repeated
 * identical messages are re-announced rather than coalesced.
 */
export function announce(
  root: AnnounceRoot,
  message: string,
  opts: AnnounceOptions = {},
): void {
  const region = getLiveRegion(root, !!opts.assertive);
  // Clear-then-set so an identical repeat is still perceived as a change.
  region.textContent = "";
  region.textContent = message;
}

function isDisabled(el: HTMLElement): boolean {
  if (el.hasAttribute("disabled")) return true;
  const asInput = el as HTMLElement & { disabled?: boolean };
  return asInput.disabled === true;
}

function isHidden(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    if (node.hasAttribute("hidden")) return true;
    const style = node.style;
    if (
      style &&
      (style.display === "none" ||
        style.visibility === "hidden" ||
        style.visibility === "collapse")
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Collect the focusable descendants of `container` in DOM order, excluding
 * disabled controls, elements opted out with tabindex="-1", and elements that
 * are hidden (via the hidden attribute or an inline display/visibility rule on
 * themselves or an ancestor up to the document root).
 */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return nodes.filter((el) => {
    if (el.getAttribute("tabindex") === "-1") return false;
    if (el instanceof HTMLInputElement && el.type === "hidden") return false;
    if (el instanceof HTMLAnchorElement && !el.getAttribute("href")) {
      return false;
    }
    if (isDisabled(el)) return false;
    if (isHidden(el)) return false;
    return true;
  });
}

/** Resolve the deepest active element, drilling through open shadow roots. */
function getDeepActiveElement(doc: Document): HTMLElement | null {
  let active: Element | null = doc.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active instanceof HTMLElement ? active : null;
}

/**
 * Trap keyboard focus inside `container`: Tab / Shift+Tab cycle between the
 * first and last focusable descendants and can never leave the container. On
 * creation focus moves to the first focusable element, or to the container
 * itself (made programmatically focusable) when it has no focusable children.
 *
 * Call {@link FocusTrap.release} to remove the handler; pair it with
 * {@link restoreFocus} to return focus to the invoking control.
 */
export function createFocusTrap(container: HTMLElement): FocusTrap {
  const doc = container.ownerDocument || document;
  let addedTabindex = false;

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") return;

    const focusable = getFocusable(container);
    if (focusable.length === 0) {
      // Nothing to move to — keep focus pinned on the container.
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = getDeepActiveElement(doc);
    const withinTrap = active ? focusable.indexOf(active) !== -1 : false;

    if (event.shiftKey) {
      if (!withinTrap || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (!withinTrap || active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener("keydown", onKeydown);

  const initial = getFocusable(container);
  if (initial.length > 0) {
    initial[0].focus();
  } else {
    if (!container.hasAttribute("tabindex")) {
      container.setAttribute("tabindex", "-1");
      addedTabindex = true;
    }
    container.focus();
  }

  return {
    release(): void {
      container.removeEventListener("keydown", onKeydown);
      if (addedTabindex) {
        container.removeAttribute("tabindex");
        addedTabindex = false;
      }
    },
  };
}

/**
 * Capture the currently focused element (drilling through shadow roots) so it
 * can be restored later with {@link restoreFocus}. Returns null when focus is
 * on nothing focusable.
 */
export function saveFocus(): HTMLElement | null {
  return getDeepActiveElement(document);
}

/**
 * Restore focus to a previously saved element. Safe to call with null or an
 * element that has since been detached (a missing/throwing focus is ignored).
 */
export function restoreFocus(el: HTMLElement | null): void {
  if (!el || typeof el.focus !== "function") return;
  try {
    el.focus();
  } catch {
    // The element may have been removed; nothing more to do.
  }
}

/**
 * Apply dialog semantics to `el`: role="dialog", aria-modal="true", and the
 * naming/description wiring described by `opts`. Prefer aria-labelledby /
 * aria-describedby pointing at visible title/subtitle elements; fall back to
 * aria-label when no visible label element exists.
 */
export function applyDialog(
  el: HTMLElement,
  opts: ApplyDialogOptions = {},
): void {
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  if (opts.labelledbyId) {
    el.setAttribute("aria-labelledby", opts.labelledbyId);
  }
  if (opts.describedbyId) {
    el.setAttribute("aria-describedby", opts.describedbyId);
  }
  if (opts.label) {
    el.setAttribute("aria-label", opts.label);
  }
}

/** Walk up to the body-level ancestor of `el`, crossing shadow boundaries. */
function topLevelAncestor(
  el: HTMLElement,
  body: HTMLElement,
): HTMLElement | null {
  let node: Node | null = el;
  while (node && node !== body) {
    const parent: Node | null = node.parentNode;
    if (parent === body) return node as HTMLElement;
    if (parent && (parent as ShadowRoot).host) {
      node = (parent as ShadowRoot).host;
      continue;
    }
    if (!parent) return null;
    node = parent;
  }
  return null;
}

/**
 * Isolate the background from assistive technology while a dialog is open by
 * marking every top-level sibling of the dialog inert (with an aria-hidden
 * fallback). `except` is the open dialog (or any element inside it); the
 * top-level element that contains it is left interactive.
 *
 * Returns a restore function that reverts every attribute this call changed,
 * leaving elements that were already inert/hidden untouched.
 */
export function setBackgroundInert(except: HTMLElement): () => void {
  const doc = except.ownerDocument || document;
  const body = doc.body;
  if (!body) return () => {};

  const keep = topLevelAncestor(except, body);
  const changed: Array<{
    el: HTMLElement;
    prevInert: boolean;
    prevAriaHidden: string | null;
  }> = [];

  Array.from(body.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    if (keep && child === keep) return;

    const prevInert = child.inert === true;
    const prevAriaHidden = child.getAttribute("aria-hidden");
    // Only record (and later revert) elements we actually change.
    if (prevInert && prevAriaHidden === "true") return;

    child.inert = true;
    child.setAttribute("aria-hidden", "true");
    changed.push({ el: child, prevInert, prevAriaHidden });
  });

  return function restore(): void {
    while (changed.length) {
      const entry = changed.pop();
      if (!entry) continue;
      entry.el.inert = entry.prevInert;
      if (entry.prevAriaHidden === null) {
        entry.el.removeAttribute("aria-hidden");
      } else {
        entry.el.setAttribute("aria-hidden", entry.prevAriaHidden);
      }
    }
  };
}
