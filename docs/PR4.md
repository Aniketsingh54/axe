# PR #4: The Execution Engine & Task Infrastructure

## System Overview: "You Are Here"

The application now looks like Weavy.ai and allows users to draw a workflow (PR #3). However, it is currently "brainless"—clicking nodes does nothing. This PR installs the **Trigger.dev** infrastructure, creating the asynchronous pipeline required to execute heavy AI and media tasks off the main thread. We are building the "engine" that will eventually drive the car.

## Scope

* **Trigger.dev Initialization:** Installation of the SDK and configuration of the client.
* **Task Registry:** Setting up the file structure for background tasks (`src/trigger/`).
* **Visual Feedback State:** Implementing the **"Pulsating Glow"** effect for nodes marked as `running`.
* **Execution API:** Creating the API route (`/api/run`) that receives a "Run" command and triggers a background job.
* **"Run" Button:** Adding the main execution control to the UI to test the pipeline.

## Out of Scope

* Actual LLM or FFmpeg logic (The tasks created here will be "Hello World" placeholders).
* Passing complex data between nodes (PR #7).
* Saving run history to the database (PR #6).

---

## 📜 The Contract (Execution Patterns)

### 1. The Async Rule

**All** node execution logic must reside in `src/trigger` folders. The Next.js API route (`/api/run`) serves **only** as a dispatcher. It must never perform the actual processing.

### 2. Visual Feedback Contract

Nodes currently in the `RUNNING` state must visually indicate activity.

* **CSS Class:** `ring-2 ring-indigo-500 ring-offset-2 animate-pulse` (or similar Tailwind utility).
* **Behavior:** The glow must persist until the Trigger.dev task sends a "Completed" event back to the client.

### 3. Task Identity

Every node type must map to a specific Trigger.dev Job ID:

* `llm-process`
* `image-crop`
* `video-extract-frame`

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: Trigger.dev Setup

* [ ] Sign up/Login to Trigger.dev and get the API Keys (`TRIGGER_API_KEY`, `TRIGGER_API_URL`).
* [ ] Install the SDK: `npm install @trigger.dev/sdk @trigger.dev/nextjs`.
* [ ] Run `npx @trigger.dev/cli@latest init` to scaffold the configuration.

### Step 2: Configure the Client (`src/trigger.ts`)

* [ ] Export the Trigger client instance.
```typescript
import { TriggerClient } from "@trigger.dev/sdk";
export const client = new TriggerClient({
  id: "weavy-clone",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});

```



### Step 3: Create Placeholder Tasks (`src/jobs/nodes.ts`)

* [ ] Define a generic "Node Runner" job that accepts a `nodeId` and `type` payload.
* [ ] Add a simple `await new Promise(resolve => setTimeout(resolve, 2000))` to simulate work.
* [ ] **Crucial:** Ensure this job returns a success payload to prove the pipeline works.

### Step 4: Implement the API Route (`app/api/trigger/route.ts`)

* [ ] Set up the standard Trigger.dev Next.js route handler to expose the jobs.

### Step 5: Visual Feedback (`components/nodes/BaseNode.tsx`)

* [ ] Update the `BaseNode` component to accept an `isRunning` prop.
* [ ] Apply the glow effect conditionally:
```tsx
<div className={cn(
  "bg-white border rounded-md p-4", 
  selected ? "border-indigo-500" : "border-gray-200",
  isRunning && "ring-4 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" 
)}>

```



### Step 6: The "Run" Action

* [ ] Add a "Run Workflow" button to the canvas header.
* [ ] Connect it to a function that toggles the `isRunning` state in the Zustand store (mocking the start/end of a run for visual verification).

---

## ⏭️ Next Step

Once this PR is merged, we can click "Run", see the node glow for 2 seconds (simulated delay), and then stop. The pipes are laid.
**Next PR:** `PR #5: The Intelligence Layer` (Replacing the placeholders with actual Gemini and FFmpeg logic).