import { HILLA } from "./hilla";
import { WILL } from "./will";
import type { BossConfig } from "./types";

export type { BossConfig };

/**
 * All supported bosses. Add new bosses here — the UI boss selector
 * is populated automatically from this list.
 */
export const BOSSES: BossConfig[] = [
    HILLA,
    WILL,
    // Add more bosses below, e.g.:
    // KALOS,
    // SEREN,
];
