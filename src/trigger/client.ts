import { tasks } from "@trigger.dev/sdk/v3";

/**
 * Trigger client helper for triggering tasks from within Next.js
 */
export const triggerClient = {
  trigger: async (taskId: string, payload: Record<string, unknown>) => {
    // This connects to the cloud or local dev server to trigger the task
    return await tasks.trigger(taskId, payload);
  }
};

export { tasks };