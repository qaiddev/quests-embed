/**
 * Keeping a step readable inside whatever box the host gives us.
 *
 * The card body is the scroll container. Two things were missing: it never
 * adapted its own content to the height available (option tiles have width
 * rules only, so a short container just clipped them), and when content did
 * overflow there was no sign of it at all — the step simply looked cut off.
 *
 * This module owns both. It is DOM-only and free of embed state so it can be
 * driven directly in tests.
 */
/** Where the scroll position currently sits. */
export type ScrollEdge = "none" | "top" | "middle" | "bottom";
/**
 * Below this many pixels of available height, a step switches to its compact
 * layout: smaller image tiles, tighter gaps. Chosen so the common 2-3 option
 * step fits without scrolling in a ~360px tall container.
 */
export declare const COMPACT_HEIGHT = 360;
/** Which edges of `el` have content beyond them. */
export declare function scrollEdgeOf(el: {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
}): ScrollEdge;
/**
 * Reflect the scroll state onto the body as `data-qaid-scroll`, which the
 * stylesheet turns into a fade mask, and onto the cue element's hidden state.
 */
export declare function applyScrollState(body: HTMLElement, cue: HTMLElement | null): ScrollEdge;
/** Reflect the available height onto the card as `data-qaid-fit`. */
export declare function applyFitState(card: HTMLElement, availableHeight: number): "compact" | "roomy";
export interface OverflowWatcher {
    /** Re-measure now — call after rendering a step. */
    refresh(): void;
    /** Detach every listener and observer. */
    destroy(): void;
}
/**
 * Watch `body` for scrolling and resizing, keeping the scroll and fit state
 * attributes current.
 *
 * A ResizeObserver rather than a CSS container query on height: a container
 * query needs `container-type: size`, which requires a definite height on both
 * axes, and this card is deliberately content-sized when the host does not
 * constrain it. Declaring it would collapse the body to nothing in exactly the
 * inline case the embed supports.
 */
export declare function watchOverflow(body: HTMLElement, card: HTMLElement, cue: HTMLElement | null): OverflowWatcher;
