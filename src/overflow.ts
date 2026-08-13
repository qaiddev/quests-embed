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
export const COMPACT_HEIGHT = 360;

/** Ignore sub-pixel rounding when deciding whether we are at an edge. */
const EDGE_SLOP = 2;

/** Which edges of `el` have content beyond them. */
export function scrollEdgeOf(el: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): ScrollEdge {
  const overflow = el.scrollHeight - el.clientHeight;
  if (overflow <= EDGE_SLOP) return "none";
  if (el.scrollTop <= EDGE_SLOP) return "top";
  if (el.scrollTop >= overflow - EDGE_SLOP) return "bottom";
  return "middle";
}

/**
 * Reflect the scroll state onto the body as `data-qaid-scroll`, which the
 * stylesheet turns into a fade mask, and onto the cue element's hidden state.
 */
export function applyScrollState(body: HTMLElement, cue: HTMLElement | null): ScrollEdge {
  const edge = scrollEdgeOf(body);
  body.setAttribute("data-qaid-scroll", edge);
  if (cue) {
    // The cue only ever means "there is more below".
    const more = edge === "top" || edge === "middle";
    cue.hidden = !more;
  }
  return edge;
}

/** Reflect the available height onto the card as `data-qaid-fit`. */
export function applyFitState(card: HTMLElement, availableHeight: number): "compact" | "roomy" {
  const fit = availableHeight > 0 && availableHeight < COMPACT_HEIGHT ? "compact" : "roomy";
  card.setAttribute("data-qaid-fit", fit);
  return fit;
}

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
export function watchOverflow(
  body: HTMLElement,
  card: HTMLElement,
  cue: HTMLElement | null
): OverflowWatcher {
  const refresh = () => {
    applyScrollState(body, cue);
    applyFitState(card, body.clientHeight);
  };

  body.addEventListener("scroll", refresh, { passive: true });

  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(refresh);
    observer.observe(body);
  }

  refresh();

  return {
    refresh,
    destroy() {
      body.removeEventListener("scroll", refresh);
      observer?.disconnect();
    },
  };
}
