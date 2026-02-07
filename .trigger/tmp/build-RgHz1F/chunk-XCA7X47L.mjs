import {
  task
} from "./chunk-7KDATMD2.mjs";
import {
  init_esm
} from "./chunk-BN2S3UNS.mjs";

// src/trigger/media.ts
init_esm();
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
var execAsync = promisify(exec);
async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}
function parseTimestamp(timestamp, duration) {
  if (timestamp === void 0) return "0";
  if (typeof timestamp === "string" && timestamp.endsWith("%")) {
    const percent = parseFloat(timestamp.replace("%", ""));
    if (duration) {
      return String(percent / 100 * duration);
    }
    return "0";
  }
  return String(timestamp);
}
async function getVideoDuration(inputPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
    );
    return parseFloat(stdout.trim());
  } catch {
    return 0;
  }
}
async function uploadToTransloadit(filePath) {
  const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
  const authSecret = process.env.TRANSLOADIT_AUTH_SECRET;
  if (!authKey || !authSecret) {
    console.log("Transloadit not configured, using local path");
    return `file://${filePath}`;
  }
  return `file://${filePath}`;
}
var mediaProcessTask = task({
  id: "media-process",
  maxDuration: 180,
  // 3 minutes max for media processing
  run: async (payload) => {
    const { operation, inputUrl, params } = payload;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "media-"));
    const inputExt = path.extname(new URL(inputUrl).pathname) || ".mp4";
    const inputPath = path.join(tempDir, `input${inputExt}`);
    const outputPath = path.join(tempDir, "output.jpg");
    try {
      console.log(`Downloading from: ${inputUrl}`);
      await downloadFile(inputUrl, inputPath);
      console.log(`Downloaded to: ${inputPath}`);
      let ffmpegCommand;
      if (operation === "EXTRACT_FRAME") {
        const duration = await getVideoDuration(inputPath);
        const timestampSeconds = parseTimestamp(params.timestamp, duration);
        ffmpegCommand = `ffmpeg -ss ${timestampSeconds} -i "${inputPath}" -frames:v 1 -y "${outputPath}"`;
        console.log(`Extracting frame at ${timestampSeconds}s`);
      } else if (operation === "CROP") {
        const { x = 0, y = 0, width = 100, height = 100 } = params;
        const cropFilter = `crop=iw*${width}/100:ih*${height}/100:iw*${x}/100:ih*${y}/100`;
        ffmpegCommand = `ffmpeg -i "${inputPath}" -filter:v "${cropFilter}" -frames:v 1 -y "${outputPath}"`;
        console.log(`Cropping with filter: ${cropFilter}`);
      } else {
        throw new Error(`Unknown operation: ${operation}`);
      }
      console.log(`Running: ${ffmpegCommand}`);
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      if (stderr) {
        console.log("FFmpeg stderr:", stderr);
      }
      if (!fs.existsSync(outputPath)) {
        throw new Error("FFmpeg did not produce output file");
      }
      const outputUrl = await uploadToTransloadit(outputPath);
      return {
        url: outputUrl,
        localPath: outputPath
      };
    } catch (error) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
      }
      throw error;
    }
  }
});
var cropImageTask = task({
  id: "crop-image",
  maxDuration: 120,
  run: async (payload) => {
    return mediaProcessTask.triggerAndWait({
      operation: "CROP",
      inputUrl: payload.inputUrl,
      params: {
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height
      }
    });
  }
});
var extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 120,
  run: async (payload) => {
    return mediaProcessTask.triggerAndWait({
      operation: "EXTRACT_FRAME",
      inputUrl: payload.inputUrl,
      params: {
        timestamp: payload.timestamp
      }
    });
  }
});

export {
  mediaProcessTask,
  cropImageTask,
  extractFrameTask
};
//# sourceMappingURL=chunk-XCA7X47L.mjs.map
