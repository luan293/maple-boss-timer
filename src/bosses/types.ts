export interface BossDifficulty {
    label: string;
    /**
     * HP thresholds (descending) marking phase transitions.
     * e.g. [61, 31] → phase 0 when hp>=61, phase 1 when 31<=hp<61, phase 2 when hp<31
     * Length must be patternIntervals.length - 1
     */
    hpThresholds: number[];
    /** Seconds between pattern triggers, one entry per phase. */
    patternIntervals: number[];
}

export interface BossConfig {
    id: string;
    name: string;
    /** Total fight duration in seconds. */
    totalTime: number;
    /**
     * Initial patternTime estimate (game timer value in seconds) used before
     * the first pattern is detected. Usually close to totalTime.
     */
    defaultPatternTime: number;
    /** Whether to run red-pixel flood-fill to detect the hourglass mechanic. */
    detectRedPattern: boolean;
    difficulties: BossDifficulty[];
}
