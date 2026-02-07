import type { TriggerConfig } from "@trigger.dev/sdk/v3";
import { ffmpeg } from "@trigger.dev/build/extensions/core";

export const config: TriggerConfig = {
    project: "proj_axqjoteczafganfbovnf",
    logLevel: "log",
    maxDuration: 300,
    retries: {
        enabledInDev: true,
        default: {
            maxAttempts: 3,
            minTimeoutInMs: 1000,
            maxTimeoutInMs: 10000,
            factor: 2,
            randomize: true,
        },
    },
    dirs: ["./src/trigger"],
    build: {
        extensions: [ffmpeg()],
    },
};
