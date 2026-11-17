/**
 * The embed's own icons, built as DOM nodes.
 *
 * They used to be SVG strings written with `innerHTML`. Building them with
 * `createElementNS` keeps the embed free of HTML sinks, so it runs on pages
 * that enforce Trusted Types (`require-trusted-types-for 'script'`).
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** An icon: the `<svg>` element's attributes and one `<path>`'s. */
export interface IconSpec {
  svg: Record<string, string>;
  path: Record<string, string>;
}

export const CLOSE_ICON: IconSpec = {
  svg: { width: "14", height: "14", viewBox: "0 0 14 14", "aria-hidden": "true" },
  path: {
    d: "M2 2l10 10M12 2L2 12",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    fill: "none",
  },
};

export const CHECK_ICON: IconSpec = {
  svg: { width: "24", height: "24", viewBox: "0 0 24 24", "aria-hidden": "true" },
  path: {
    d: "M5 12l4 4L19 7",
    stroke: "currentColor",
    "stroke-width": "3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  },
};

/** The chevron that says "there is more below". */
export const SCROLL_CUE_ICON: IconSpec = {
  svg: {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  },
  path: { d: "M6 9l6 6 6-6" },
};

function withAttrs<T extends Element>(el: T, attrs: Record<string, string>): T {
  for (const name in attrs) el.setAttribute(name, attrs[name]);
  return el;
}

/** Build an icon as a detached `<svg>` element. */
export function svgIcon(spec: IconSpec): SVGSVGElement {
  const svg = withAttrs(document.createElementNS(SVG_NS, "svg"), spec.svg);
  svg.appendChild(withAttrs(document.createElementNS(SVG_NS, "path"), spec.path));
  return svg;
}
