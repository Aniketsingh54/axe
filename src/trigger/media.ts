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

// Helper to upload to Vercel Blob
async function uploadToBlob(filePath: string): Promise<string> {
    const { put } = await import("@vercel/blob");

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const parsed = path.parse(path.basename(filePath));
    const fileName = `${parsed.name}-${Date.now()}${parsed.ext || ".jpg"}`;

    console.log(`Uploading ${fileName} to Vercel Blob...`);

    try {
        const blob = await put(fileName, fileBuffer, {
            access: 'public',
            addRandomSuffix: true,
        });

        console.log(`Upload complete: ${blob.url}`);
        return blob.url;
    } catch (error) {
        console.error("Blob upload error:", error);
        throw error;
    }
}

export const mediaProcessTask = task({
    id: "media-process",
    maxDuration: 180, // 3 minutes max for media processing
    run: async (payload: MediaPayload): Promise<MediaOutput> => {
        const { operation, inputUrl, params } = payload;

        // Validate URL early
        if (!inputUrl || inputUrl === '[base64-stripped]' || (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://'))) {
            throw new Error(`Invalid URL: "${inputUrl}". Media processing requires a valid HTTP/HTTPS URL. Please re-upload your media files.`);
        }

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
            const outputUrl = await uploadToBlob(outputPath);

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
