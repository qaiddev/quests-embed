/**
 * CSS variable + style helpers for the questionnaire embed.
 *
 * Color vars are intentionally NAMESPACED away from @qaiddev/thumbs-embed
 * so a host that uses both embeds can theme them independently:
 *
 *   Quests own:   --qaid-q-accent, --qaid-q-error, --qaid-q-focus
 *   Shared:       --qaid-modal-width, --qaid-backdrop-opacity,
 *                 --qaid-font-family, --qaid-font-size
 *
 * The legacy thumbs names (--qaid-positive / --qaid-negative /
 * --qaid-marker) are NOT applied here anymore.
 */
import { type PresetName } from "./themes";
export interface BuildCssVarsOptions {
    /** Primary CTA / progress fill / selected option ring */
    accentColor?: string;
    /** Validation error text */
    errorColor?: string;
    /** Focus ring */
    focusColor?: string;
    modalWidth?: number;
    backdropOpacity?: number;
    fontFamily?: string;
    fontSize?: number;
}
export declare function buildCssVars(options?: BuildCssVarsOptions): Record<string, string>;
export declare function applyCssVars(el: HTMLElement, vars: Record<string, string>): void;
/** CSS string injected into every shadow root */
export declare function getEmbedStyles(): string;
/** CSS for a built-in theme preset, or "" for unknown names. */
export declare function getPresetCss(name: PresetName): string;
export type { PresetName };
