/**
 * The embed's own icons, built as DOM nodes.
 *
 * They used to be SVG strings written with `innerHTML`. Building them with
 * `createElementNS` keeps the embed free of HTML sinks, so it runs on pages
 * that enforce Trusted Types (`require-trusted-types-for 'script'`).
 */
/** An icon: the `<svg>` element's attributes and one `<path>`'s. */
export interface IconSpec {
    svg: Record<string, string>;
    path: Record<string, string>;
}
export declare const CLOSE_ICON: IconSpec;
export declare const CHECK_ICON: IconSpec;
/** The chevron that says "there is more below". */
export declare const SCROLL_CUE_ICON: IconSpec;
/** Build an icon as a detached `<svg>` element. */
export declare function svgIcon(spec: IconSpec): SVGSVGElement;
