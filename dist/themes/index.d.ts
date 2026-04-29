/**
 * Built-in theme presets. Each preset is a CSS string of token
 * overrides (Tier 3) and is injected into the shadow root after the
 * base stylesheet but before the host's `css` config string — so a
 * host always wins.
 */
export type PresetName = "default" | "minimal" | "pill" | "dense";
export declare function getPresetCss(name: PresetName): string;
