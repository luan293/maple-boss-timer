import type { BossConfig } from "./types";

export const HILLA: BossConfig = {
    id: "hilla",
    name: "True Hilla",
    totalTime: 1800,
    defaultPatternTime: 1784,
    detectRedPattern: true,
    difficulties: [
        {
            label: "Normal",
            hpThresholds: [51],
            patternIntervals: [180, 150],
        },
        {
            label: "Hard",
            hpThresholds: [61, 31],
            patternIntervals: [150, 125, 100],
        },
    ],
};
