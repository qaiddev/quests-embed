/**
 * Reading config from the page for the script-tag install: the JSON config
 * block and the embed's own `data-*` attributes.
 *
 * Kept out of `index.ts` so it can be tested: `index.ts` runs auto-init as a
 * side effect of being imported and is excluded from coverage. Not re-exported
 * from `index.ts`, so none of this is public API.
 */
import type { QuestsConfig } from "./types";
/**
 * Config from `<script type="application/json" data-quests-config>`.
 * When present and valid it wins outright; the attributes are not read.
 */
export declare function parseJsonConfig(): Partial<QuestsConfig> | null;
/**
 * Config from the embed's own `data-*` attributes. Every option that can be
 * written as text has one; only the `onComplete` / `onClose` callbacks need
 * code.
 */
export declare function parseDataAttributes(script: HTMLScriptElement): Partial<QuestsConfig> | null;
