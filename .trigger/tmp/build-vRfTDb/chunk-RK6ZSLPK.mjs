import {
  task
} from "./chunk-WJCZZMVF.mjs";
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
  } catch (error) {
    console.warn("Failed to get video duration:", error);
    return 0;
  }
}
async function uploadToTransloadit(filePath) {
  const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
  const isPlaceholder = authKey === "c767882fc1143c30a6480eda2e2a6921";
  if (!authKey || isPlaceholder) {
    console.log("Transloadit AUTH KEY not configured or placeholder, using base64 fallback");
    const buffer = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }
  try {
    console.log(`Uploading ${filePath} to Transloadit...`);
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append("file", blob, fileName);
    const params = {
      auth: { key: authKey },
      steps: {
        ":original": { robot: "/upload/handle" },
        optimized: { robot: "/image/optimize", use: ":original", progressive: true }
      }
    };
    formData.append("params", JSON.stringify(params));
    const response = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    console.log(`Assembly created: ${result.assembly_id}, polling for completion...`);
    const assemblyUrl = result.assembly_url;
    let attempts = 0;
    let delay = 500;
    const maxDelay = 3e3;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      const statusRes = await fetch(assemblyUrl);
      const status = await statusRes.json();
      if (status.ok === "ASSEMBLY_COMPLETED") {
        const results = status.results.optimized || status.results[":original"];
        if (results && results.length > 0) {
          const url = results[0].ssl_url || results[0].url;
          console.log(`Upload complete after ${attempts + 1} attempts: ${url}`);
          return url;
        }
      }
      if (status.error) {
        throw new Error(status.error);
      }
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts}, waiting ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, maxDelay);
      attempts++;
    }
    throw new Error("Transloadit upload timed out after 30 attempts");
  } catch (error) {
    console.error("Transloadit upload error, falling back to base64:", error);
    const buffer = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }
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
//# sourceMappingURL=chunk-RK6ZSLPK.mjs.map
