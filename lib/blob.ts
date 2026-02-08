import { upload } from '@vercel/blob/client';

interface UploadOptions {
    file: File;
    onProgress?: (percent: number) => void;
}

export async function uploadFile(
    file: File,
    onProgress?: (percent: number) => void
): Promise<string> {
    try {
        const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    onProgress(progressEvent.percentage);
                }
            },
        });

        return newBlob.url;
    } catch (error) {
        console.error("Blob upload failed:", error);
        throw error;
    }
}
