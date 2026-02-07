import { tasks } from "@trigger.dev/sdk/v3";

/**
 * Trigger client helper for triggering tasks from within Next.js
 */
export const triggerClient = {
  trigger: async (taskId: string, payload: Record<string, unknown>) => {
    // Basic fire-and-forget (returns handle)
    return await tasks.trigger(taskId, payload);
  },
  triggerAndWait: async (taskId: string, payload: Record<string, unknown>) => {
    // Wait for completion and return result
    // Trigger.dev v3 SDK has triggerAndPoll
    const run = await tasks.triggerAndPoll(taskId, payload);

    if (run.status === "COMPLETED") {
      console.log(`[triggerAndWait] Task ${taskId} completed. Output:`, JSON.stringify(run.output, null, 2));
      return run.output;
    } else {
      console.error(`[triggerAndWait] Task ${taskId} failed:`, JSON.stringify(run, null, 2));
      const errorMsg = (run as any).error?.message || JSON.stringify((run as any).error);
      throw new Error(`Task ${taskId} failed: ${errorMsg || run.status}`);
    }
  }
};

export { tasks };