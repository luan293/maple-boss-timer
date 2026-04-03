/**
 * Defines the interfaces for messages sent and received by the worker.
 */
export interface IRecvMessage {
    /**
     * The time remaining until the boss spawns or attacks.
     */
    time: number | null;
    /**
     * The coordinates of the timer on the screen.
     */
    timeRect: number[] | null;
    /**
     * The current health of the boss.
     */
    hp: number | null;
    /**
     * The coordinates of the health bar on the screen.
     */
    hpRect: number[] | null;
    /**
     * The current pattern of the boss.
     */
    pattern: number;
    /**
     * The coordinates of the pattern on the screen.
     */
    patternRect: number[][] | null;
}

export interface ISendMessage {
    /**
     * Whether or not FMA is expected to happen in 10 seconds.
     */
    fmaSoon: boolean;
    /**
     * The frame buffer of the screen.
     */
    frameBuffer: ArrayBuffer;
    /**
     * The width of the frame.
     */
    frameWidth: number;
    /**
     * The height of the frame.
     */
    frameHeight: number;
    /**
     * The coordinates of the timer on the screen.
     */
    timeRect: number[] | null;
    /**
     * The coordinates of the health bar on the screen.
     */
    hpRect: number[] | null;
    /**
     * Whether to run red-pixel flood-fill to detect the hourglass mechanic.
     * Set to false for bosses that do not use this mechanic.
     */
    detectRedPattern: boolean;
}