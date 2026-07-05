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
/**
 * Announce a message to assistive technology via a visually-hidden live region
 * mounted inside `root`. The two regions (polite role="status" and assertive
 * role="alert") are created lazily on first use and reused thereafter.
 *
 * The target region is cleared before the new text is written so that repeated
 * identical messages are re-announced rather than coalesced.
 */
export declare function announce(root: AnnounceRoot, message: string, opts?: AnnounceOptions): void;
/**
 * Collect the focusable descendants of `container` in DOM order, excluding
 * disabled controls, elements opted out with tabindex="-1", and elements that
 * are hidden (via the hidden attribute or an inline display/visibility rule on
 * themselves or an ancestor up to the document root).
 */
export declare function getFocusable(container: HTMLElement): HTMLElement[];
/**
 * Trap keyboard focus inside `container`: Tab / Shift+Tab cycle between the
 * first and last focusable descendants and can never leave the container. On
 * creation focus moves to the first focusable element, or to the container
 * itself (made programmatically focusable) when it has no focusable children.
 *
 * Call {@link FocusTrap.release} to remove the handler; pair it with
 * {@link restoreFocus} to return focus to the invoking control.
 */
export declare function createFocusTrap(container: HTMLElement): FocusTrap;
/**
 * Capture the currently focused element (drilling through shadow roots) so it
 * can be restored later with {@link restoreFocus}. Returns null when focus is
 * on nothing focusable.
 */
export declare function saveFocus(): HTMLElement | null;
/**
 * Restore focus to a previously saved element. Safe to call with null or an
 * element that has since been detached (a missing/throwing focus is ignored).
 */
export declare function restoreFocus(el: HTMLElement | null): void;
/**
 * Apply dialog semantics to `el`: role="dialog", aria-modal="true", and the
 * naming/description wiring described by `opts`. Prefer aria-labelledby /
 * aria-describedby pointing at visible title/subtitle elements; fall back to
 * aria-label when no visible label element exists.
 */
export declare function applyDialog(el: HTMLElement, opts?: ApplyDialogOptions): void;
/**
 * Isolate the background from assistive technology while a dialog is open by
 * marking every top-level sibling of the dialog inert (with an aria-hidden
 * fallback). `except` is the open dialog (or any element inside it); the
 * top-level element that contains it is left interactive.
 *
 * Returns a restore function that reverts every attribute this call changed,
 * leaving elements that were already inert/hidden untouched.
 */
export declare function setBackgroundInert(except: HTMLElement): () => void;
