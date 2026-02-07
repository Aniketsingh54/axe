import { createAPIRoute } from "@trigger.dev/nextjs";
import { client } from "../../../src/trigger/client";
import { nodeRunnerJob, llmProcessJob, imageCropJob, videoExtractFrameJob } from "../../../src/trigger/jobs";

// This is the endpoint that will handle all Trigger.dev related requests
export const { POST, dynamic } = createAPIRoute({
  client,
  static: {
    jobs: [
      nodeRunnerJob,
      llmProcessJob,
      imageCropJob,
      videoExtractFrameJob
    ],
  },
});