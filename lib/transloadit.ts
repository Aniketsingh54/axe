/**
 * Transloadit Upload Utility
 * Handles file uploads to Transloadit service
 */

interface TransloaditResult {
    ok: boolean;
    assembly_id?: string;
    results?: {
        [step: string]: Array<{
            url: string;
            ssl_url: string;
            name: string;
            size: number;
            mime: string;
        }>;
    };
    error?: string;
}

interface UploadOptions {
    file: File;
    onProgress?: (percent: number) => void;
}

/**
 * Upload a file to Transloadit
 * Returns the public URL of the uploaded file
 */
export async function uploadToTransloadit(options: UploadOptions): Promise<string> {
    const { file, onProgress } = options;

    const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;

    if (!authKey) {
        throw new Error("Transloadit auth key not configured");
    }

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    // Transloadit template params
    const params = {
        auth: { key: authKey },
        steps: {
            // Store the original file
            ":original": {
                robot: "/upload/handle",
            },
            // Optimize images
            optimized: {
                robot: "/image/optimize",
                use: ":original",
                progressive: true,
            },
        },
    };

    formData.append("params", JSON.stringify(params));

    try {
        const response = await fetch("https://api2.transloadit.com/assemblies", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result: TransloaditResult = await response.json();

        if (!result.ok) {
            throw new Error(result.error || "Upload failed");
        }

        // Poll for completion (Transloadit processes asynchronously)
        const assemblyUrl = `https://api2.transloadit.com/assemblies/${result.assembly_id}`;
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
            const statusResponse = await fetch(assemblyUrl);
            const statusResult: TransloaditResult = await statusResponse.json();

            if (statusResult.ok && statusResult.results) {
                // Get the URL from either optimized or original step
                const results = statusResult.results.optimized || statusResult.results[":original"];
                if (results && results.length > 0) {
                    return results[0].ssl_url || results[0].url;
                }
            }

            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, 1000));
            attempts++;

            if (onProgress) {
                onProgress(Math.min(90, (attempts / maxAttempts) * 100));
            }
        }

        throw new Error("Upload timed out");
    } catch (error) {
        console.error("Transloadit upload error:", error);
        throw error;
    }
}

/**
 * Simple base64 upload for MVP (fallback if Transloadit not configured)
 * Converts file to data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Upload handler that uses Transloadit if available, otherwise falls back to data URL
 */
export async function uploadFile(
    file: File,
    onProgress?: (percent: number) => void
): Promise<string> {
    const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;

    if (authKey) {
        // Use Transloadit
        return uploadToTransloadit({ file, onProgress });
    } else {
        // Fallback to data URL
        if (onProgress) onProgress(50);
        const dataUrl = await fileToDataUrl(file);
        if (onProgress) onProgress(100);
        return dataUrl;
    }
}
