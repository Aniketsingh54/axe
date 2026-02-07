import { client } from "@/src/trigger/client";
import { job } from "@trigger.dev/sdk/v3";

// Generic Node Runner Job
export const nodeRunnerJob = job("node-runner", {
  run: async (payload: { nodeId: string; nodeType: string; inputData?: any }, { logger }) => {
    await logger.info(`Starting execution for node ${payload.nodeId} of type ${payload.nodeType}`);

    // Simulate work with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return a success payload to prove the pipeline works
    const result = {
      nodeId: payload.nodeId,
      nodeType: payload.nodeType,
      status: "completed",
      output: `Processed node ${payload.nodeId} successfully`,
      timestamp: new Date().toISOString()
    };

    await logger.info(`Completed execution for node ${payload.nodeId}`, result);

    return result;
  },
});

// Specific jobs for each node type
export const llmProcessJob = job("llm-process", {
  run: async (payload: { nodeId: string; prompt: string; model?: string }, { logger }) => {
    await logger.info(`Processing LLM task for node ${payload.nodeId}`);

    // Simulate LLM processing with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      nodeId: payload.nodeId,
      status: "completed",
      output: `LLM processed: "${payload.prompt.substring(0, 30)}..."`,
      model: payload.model || "gemini-1.5-pro",
      timestamp: new Date().toISOString()
    };

    await logger.info(`LLM task completed for node ${payload.nodeId}`, result);

    return result;
  },
});

export const imageCropJob = job("image-crop", {
  run: async (payload: { nodeId: string; imageUrl: string; x: number; y: number; width: number; height: number }, { logger }) => {
    await logger.info(`Processing image crop for node ${payload.nodeId}`);

    // Simulate image processing with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      nodeId: payload.nodeId,
      status: "completed",
      output: `Cropped image from ${payload.imageUrl}`,
      dimensions: { x: payload.x, y: payload.y, width: payload.width, height: payload.height },
      timestamp: new Date().toISOString()
    };

    await logger.info(`Image crop completed for node ${payload.nodeId}`, result);

    return result;
  },
});

export const videoExtractFrameJob = job("video-extract-frame", {
  run: async (payload: { nodeId: string; videoUrl: string; timestamp: string }, { logger }) => {
    await logger.info(`Processing video frame extraction for node ${payload.nodeId}`);

    // Simulate video processing with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      nodeId: payload.nodeId,
      status: "completed",
      output: `Extracted frame from ${payload.videoUrl} at ${payload.timestamp}`,
      timestamp: new Date().toISOString()
    };

    await logger.info(`Video frame extraction completed for node ${payload.nodeId}`, result);

    return result;
  },
});