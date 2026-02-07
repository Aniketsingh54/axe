import {
  tasks
} from "../../../chunk-7KDATMD2.mjs";
import {
  init_esm
} from "../../../chunk-BN2S3UNS.mjs";

// src/trigger/client.ts
init_esm();
var triggerClient = {
  trigger: async (taskId, payload) => {
    return await tasks.trigger(taskId, payload);
  },
  triggerAndWait: async (taskId, payload) => {
    const run = await tasks.triggerAndPoll(taskId, payload);
    if (run.status === "COMPLETED") {
      console.log(`[triggerAndWait] Task ${taskId} completed. Output:`, JSON.stringify(run.output, null, 2));
      return run.output;
    } else {
      console.error(`[triggerAndWait] Task ${taskId} failed:`, JSON.stringify(run, null, 2));
      const errorMsg = run.error?.message || JSON.stringify(run.error);
      throw new Error(`Task ${taskId} failed: ${errorMsg || run.status}`);
    }
  }
};
export {
  tasks,
  triggerClient
};
//# sourceMappingURL=client.mjs.map
