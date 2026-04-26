/**
 * CSS variable + style helpers for the questionnaire embed.
 *
 * Variable names match @qaiddev/thumbs-embed so a theme written for
 * one embed renders identically in the other:
 *   --qaid-positive, --qaid-negative, --qaid-marker
 *   --qaid-modal-width, --qaid-backdrop-opacity
 *   --qaid-font-family, --qaid-font-size
 */
export interface BuildCssVarsOptions {
    positiveColor?: string;
    negativeColor?: string;
    markerColor?: string;
    modalWidth?: number;
    backdropOpacity?: number;
    fontFamily?: string;
    fontSize?: number;
}
export declare function buildCssVars(options?: BuildCssVarsOptions): Record<string, string>;
export declare function applyCssVars(el: HTMLElement, vars: Record<string, string>): void;
/** CSS string injected into every shadow root */
export declare function getEmbedStyles(): string;
