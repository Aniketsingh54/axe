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
      return run.output;
    } else {
      throw new Error(`Task ${taskId} failed with status: ${run.status}`);
    }
  }
};

export { tasks };