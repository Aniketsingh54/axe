import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI, GenerativeModel, Part } from "@google/generative-ai";

/**
 * LLM Task Contract:
 * Job ID: gemini-generate
 * Payload: { systemPrompt?, userMessage, imageUrls?, model }
 * Output: { text: string }
 */

type LLMPayload = {
    systemPrompt?: string;
    userMessage: string;
    imageUrls?: string[];
    model: "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-2.0-flash";
};

type LLMOutput = {
    text: string;
};

// Helper to fetch image and convert to base64
async function imageUrlToBase64(url: string): Promise<{ inlineData: { data: string; mimeType: string } }> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Determine MIME type from URL or response headers
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return {
        inlineData: {
            data: base64,
            mimeType: contentType,
        },
    };
}

export const geminiGenerateTask = task({
    id: "gemini-generate",
    maxDuration: 120, // 2 minutes max for LLM calls
    run: async (payload: LLMPayload): Promise<LLMOutput> => {
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY is not configured");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Select the model
        // Select the model
        // Map alias to specific version if needed
        let modelName = payload.model || "gemini-1.5-flash";
        // User requested 2.5-flash
        if (modelName.includes("gemini-1.5-flash")) {
            modelName = "gemini-2.5-flash" as any;
        }

        const model: GenerativeModel = genAI.getGenerativeModel({
            model: modelName as any,
            systemInstruction: payload.systemPrompt,
        });

        // Build the content parts
        const parts: Part[] = [];

        // Add text message
        parts.push({ text: payload.userMessage });

        // Add images if provided (convert to base64 inline data)
        if (payload.imageUrls && payload.imageUrls.length > 0) {
            for (const imageUrl of payload.imageUrls) {
                try {
                    const imagePart = await imageUrlToBase64(imageUrl);
                    parts.push(imagePart);
                } catch (error) {
                    console.error(`Failed to fetch image ${imageUrl}:`, error);
                    // Continue without the image
                }
            }
        }

        // Generate content
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        return { text };
    },
});
