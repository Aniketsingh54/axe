import {
  init_esm
} from "../chunk-BN2S3UNS.mjs";

// trigger.config.ts
init_esm();
var config = {
  project: "proj_axqjoteczafganfbovnf",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1e3,
      maxTimeoutInMs: 1e4,
      factor: 2,
      randomize: true
    }
  },
  dirs: ["./src/trigger"],
  build: {}
};
var resolveEnvVars = void 0;
export {
  config,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
