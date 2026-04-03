import { HILLA } from "./hilla";
import type { BossConfig } from "./types";

export type { BossConfig };

/**
 * All supported bosses. Add new bosses here — the UI boss selector
 * is populated automatically from this list.
 */
export const BOSSES: BossConfig[] = [
    HILLA,
    // Add more bosses below, e.g.:
    // KALOS,
    // SEREN,
];
