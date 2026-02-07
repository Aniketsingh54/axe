import { tasks } from "@trigger.dev/sdk/v3";

// Export configured client
export const triggerClient = {
  trigger: async (taskId: string, payload: Record<string, unknown>) => {
    // This will be used to trigger tasks
    return { id: `run_${Date.now()}` };
  }
};

// Re-export for convenience
export { tasks };