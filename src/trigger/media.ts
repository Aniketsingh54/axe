import { task } from "@trigger.dev/sdk/v3";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

/**
 * Media Task Contract:
 * Job ID: media-process
 * Payload: { operation, inputUrl, params }
 * Output: { url: string }
 */

type MediaPayload = {
    operation: "CROP" | "EXTRACT_FRAME";
    inputUrl: string;
    params: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        timestamp?: number | string; // e.g., 5 or "50%"
    };
};

type MediaOutput = {
    url: string;
    localPath?: string; // For debugging
};

// Helper to download file from URL
async function downloadFile(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
}

// Helper to parse timestamp (supports "50%" or number of seconds)
function parseTimestamp(timestamp: number | string | undefined, duration?: number): string {
    if (timestamp === undefined) return "0";

    if (typeof timestamp === "string" && timestamp.endsWith("%")) {
        const percent = parseFloat(timestamp.replace("%", ""));
        if (duration) {
            return String((percent / 100) * duration);
        }
        // If no duration, return 0 for percentage
        return "0";
    }

    return String(timestamp);
}

// Helper to get video duration using ffprobe
async function getVideoDuration(inputPath: string): Promise<number> {
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

// Helper to upload to Transloadit (simplified - in production use proper SDK)
async function uploadToTransloadit(filePath: string): Promise<string> {
    const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
    const isPlaceholder = authKey === "c767882fc1143c30a6480eda2e2a6921";

    if (!authKey || isPlaceholder) {
        console.log("Transloadit AUTH KEY not configured or placeholder, using base64 fallback");
        const buffer = fs.readFileSync(filePath);
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    try {
        console.log(`Uploading ${filePath} to Transloadit...`);
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        // Create FormData
        const formData = new FormData();
        const blob = new Blob([fileBuffer]);
        formData.append("file", blob, fileName);

        // Params
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
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result: any = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        console.log(`Assembly created: ${result.assembly_id}, polling for completion...`);

        // Poll for completion with exponential backoff
        const assemblyUrl = result.assembly_url;

        let attempts = 0;
        let delay = 500; // Start at 500ms
        const maxDelay = 3000; // Max 3 seconds between polls
        const maxAttempts = 30; // ~30 seconds total max

        while (attempts < maxAttempts) {
            const statusRes = await fetch(assemblyUrl);
            const status: any = await statusRes.json();

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
            await new Promise(r => setTimeout(r, delay));
            delay = Math.min(delay * 1.5, maxDelay); // Exponential backoff
            attempts++;
        }

        throw new Error("Transloadit upload timed out after 30 attempts");

    } catch (error) {
        console.error("Transloadit upload error, falling back to base64:", error);
        const buffer = fs.readFileSync(filePath);
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
}

export const mediaProcessTask = task({
    id: "media-process",
    maxDuration: 180, // 3 minutes max for media processing
    run: async (payload: MediaPayload): Promise<MediaOutput> => {
        const { operation, inputUrl, params } = payload;

        // Create temp directory for processing
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "media-"));
        const inputExt = path.extname(new URL(inputUrl).pathname) || ".mp4";
        const inputPath = path.join(tempDir, `input${inputExt}`);
        const outputPath = path.join(tempDir, "output.jpg");

        try {
            // Download the input file
            console.log(`Downloading from: ${inputUrl}`);
            await downloadFile(inputUrl, inputPath);
            console.log(`Downloaded to: ${inputPath}`);

            let ffmpegCommand: string;

            if (operation === "EXTRACT_FRAME") {
                // Get video duration for percentage-based timestamps
                const duration = await getVideoDuration(inputPath);
                const timestampSeconds = parseTimestamp(params.timestamp, duration);

                // FFmpeg command: extract single frame at timestamp
                ffmpegCommand = `ffmpeg -ss ${timestampSeconds} -i "${inputPath}" -frames:v 1 -y "${outputPath}"`;
                console.log(`Extracting frame at ${timestampSeconds}s`);

            } else if (operation === "CROP") {
                const { x = 0, y = 0, width = 100, height = 100 } = params;

                // For percentage-based crop, we need to calculate actual pixels
                // This simplified version assumes percentage values (0-100)
                // FFmpeg crop filter: crop=out_w:out_h:x:y
                // Using iw/ih (input width/height) for percentage calculations
                const cropFilter = `crop=iw*${width}/100:ih*${height}/100:iw*${x}/100:ih*${y}/100`;

                ffmpegCommand = `ffmpeg -i "${inputPath}" -filter:v "${cropFilter}" -frames:v 1 -y "${outputPath}"`;
                console.log(`Cropping with filter: ${cropFilter}`);

            } else {
                throw new Error(`Unknown operation: ${operation}`);
            }

            // Execute FFmpeg
            console.log(`Running: ${ffmpegCommand}`);
            const { stdout, stderr } = await execAsync(ffmpegCommand);

            if (stderr) {
                console.log("FFmpeg stderr:", stderr);
            }

            // Verify output exists
            if (!fs.existsSync(outputPath)) {
                throw new Error("FFmpeg did not produce output file");
            }

            // Upload the result
            const outputUrl = await uploadToTransloadit(outputPath);

            return {
                url: outputUrl,
                localPath: outputPath,
            };

        } catch (error) {
            // Cleanup on error
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch { }
            throw error;
        }
    },
});

// Convenience tasks for specific operations
export const cropImageTask = task({
    id: "crop-image",
    maxDuration: 120,
    run: async (payload: { inputUrl: string; x: number; y: number; width: number; height: number }) => {
        return mediaProcessTask.triggerAndWait({
            operation: "CROP",
            inputUrl: payload.inputUrl,
            params: {
                x: payload.x,
                y: payload.y,
                width: payload.width,
                height: payload.height,
            },
        });
    },
});

export const extractFrameTask = task({
    id: "extract-frame",
    maxDuration: 120,
    run: async (payload: { inputUrl: string; timestamp: number | string }) => {
        return mediaProcessTask.triggerAndWait({
            operation: "EXTRACT_FRAME",
            inputUrl: payload.inputUrl,
            params: {
                timestamp: payload.timestamp,
            },
        });
    },
});
