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

/**
 * Describes a purely time-based mechanic where events occur on a fixed schedule
 * derived from the fight timer, independent of boss HP.
 */
export interface FixedPattern {
    /** Game timer value (seconds) when the first event occurs. e.g. 1729 = 28:49 */
    firstEventAt: number;
    /**
     * Seconds between consecutive events (eye-to-eye).
     * = secondsBetweenCrackAndNextEye + warningWindowSeconds
     */
    intervalSeconds: number;
}

export interface BossConfig {
    id: string;
    name: string;
    /** Total fight duration in seconds. */
    totalTime: number;
    /**
     * Initial patternTime estimate (game timer value in seconds) used before
     * the first pattern is detected. Only used when fixedPattern is absent.
     */
    defaultPatternTime: number;
    /** Whether to run red-pixel flood-fill to detect the hourglass mechanic. */
    detectRedPattern: boolean;
    /**
     * If set, the boss uses a fixed time schedule instead of HP-based detection.
     * When present, hpThresholds/patternIntervals in difficulties are ignored.
     */
    fixedPattern?: FixedPattern;
    difficulties: BossDifficulty[];
}
