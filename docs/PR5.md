# PR #5: The Intelligence Layer (Gemini & Media Processing)

## System Overview: "You Are Here"

In PR #4, we built the "engine" (Trigger.dev infrastructure). Now, we are adding the "fuel." This PR implements the actual business logic that makes the nodes intelligent. We are replacing the "placeholder" tasks with real integrations for **Google Gemini (LLM)** and **FFmpeg (Media Processing)**. By the end of this PR, the system will be able to actually generate text and manipulate media.

## Scope

* **LLM Integration:** Implement the Trigger.dev task for `gemini-generate` using the `@google/generative-ai` SDK. Support multi-modal inputs (Text + Images).
* **Media Processing:** Implement Trigger.dev tasks for `ffmpeg-crop` and `ffmpeg-extract-frame`. These tasks will take input URLs, process them using FFmpeg, and upload the result back to Transloadit (or a storage bucket) to generate an output URL.
* **File Uploads:** Implement the client-side logic for the **Upload Image** and **Upload Video** nodes to handle direct file uploads via Transloadit, returning a URL to the node's state.
* **Environment Config:** Add `GOOGLE_API_KEY` and Transloadit keys to the `.env` file.

## Out of Scope

* Saving these execution results to the PostgreSQL database (PR #6).
* Complex graph dependency logic (e.g., waiting for parallel branches). This PR focuses on making individual nodes *work* in isolation.

---

## 📜 The Contract (Task Specifications)

### 1. Gemini Task Contract (`src/jobs/llm.ts`)

The LLM task must accept a rigid payload structure to support the "Input Chaining" requirement later.

* **Job ID:** `gemini-generate`
* **Payload:**
```typescript
type LLMPayload = {
  systemPrompt?: string;
  userMessage: string;
  imageUrls?: string[]; // Array of public URLs
  model: "gemini-1.5-pro" | "gemini-1.5-flash";
};

```


* **Output:** `{ text: string }` (The raw response text).

### 2. FFmpeg Task Contract (`src/jobs/media.ts`)

Processing video/images requires downloading the asset, processing it, and re-uploading it.

* **Job ID:** `media-process`
* **Payload:**
```typescript
type MediaPayload = {
  operation: "CROP" | "EXTRACT_FRAME";
  inputUrl: string;
  params: {
    x?: number; y?: number; width?: number; height?: number; // For Crop
    timestamp?: number | string; // For Extract Frame (e.g. 5 or "50%")
  };
};

```


* **Output:** `{ url: string }` (The URL of the processed asset).

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: Install SDKs

* [ ] Install Google AI: `npm install @google/generative-ai`.
* [ ] Install Transloadit (for server-side signing if needed): `npm install transloadit`.
* [ ] Install FFmpeg wrapper (if running inside container) or ensure Trigger.dev environment supports it. *Note: For this PR, we will assume the Trigger.dev environment (or local Docker) has `ffmpeg` installed, or use a library like `fluent-ffmpeg`.*

### Step 2: Implement Gemini Logic (`src/jobs/llm.ts`)

* [ ] Initialize `GoogleGenerativeAI` with `process.env.GOOGLE_API_KEY`.
* [ ] Construct the prompt parts. If `imageUrls` are present, fetch them and convert to `GenerativeContentBlob` (base64) because Gemini API often requires inline data or specific file URI handling.
* *Tip:* For the MVP, fetching the image buffer and passing it as inline data to the SDK is the most robust method.


* [ ] Call `model.generateContent` and return the `response.text()`.

### Step 3: Implement Media Logic (`src/jobs/media.ts`)

* [ ] **Extract Frame:**
* Use FFmpeg to seek to `timestamp`.
* Command: `ffmpeg -ss <time> -i <input> -frames:v 1 output.jpg`.


* [ ] **Crop:**
* Use FFmpeg crop filter.
* Command: `ffmpeg -i <input> -filter:v "crop=w:h:x:y" output.jpg`.


* [ ] **Re-upload:** logic to upload `output.jpg` to Transloadit/S3 and get a public URL.

### Step 4: Client-Side Uploads (`components/nodes/UploadNode.tsx`)

* [ ] Integrate the Transloadit React SDK or a simple `fetch` upload handler.
* [ ] When the upload completes, update the node's local state (Zustand) with the returned `url`.

---

## ⏭️ Next Step

Merging this PR means the system is "smart." We can send a text prompt and get an AI response, or upload a video and get a frame.
**Next PR:** `PR #6: The Memory Layer` (Persisting these results to the database and showing the History Sidebar).