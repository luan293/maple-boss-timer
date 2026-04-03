import type { BossConfig } from "./types";

export const WILL: BossConfig = {
    id: "will",
    name: "Will",
    totalTime: 1800,
    defaultPatternTime: 0,
    detectRedPattern: false,
    fixedPattern: {
        // Eye appears at 28:49 (1729s) for the first time (~1 min after fight start)
        firstEventAt: 1729,
        // 121s after each crack + 5s crack window = 126s between eye appearances
        intervalSeconds: 126,
    },
    difficulties: [
        {
            label: "Normal",
            hpThresholds: [],
            patternIntervals: [],
        },
        {
            label: "Hard",
            hpThresholds: [],
            patternIntervals: [],
        },
    ],
};
