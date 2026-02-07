import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Simple .env parser to avoid dotenv dependency
const envPath = path.resolve(process.cwd(), '.env');
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            // Remove quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (!process.env[key]) {
                process.env[key] = val;
            }
        }
    });
} catch (e) {
    console.warn('.env file not found or readable');
}

console.log('Checking GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Present' : 'Missing');

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set in environment");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
    try {
        const modelName = "gemini-2.5-flash";
        console.log(`Connecting to Gemini API with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
            model: modelName as any
        });

        console.log('Sending prompt: "Hello."');
        const result = await model.generateContent('Hello.');
        const response = await result.response;
        console.log('Response received:');
        console.log(response.text());
        console.log(`SUCCESS: ${modelName} works.`);
    } catch (error: any) {
        console.error('FAILURE:', error.message);
    }
}

runTest();
