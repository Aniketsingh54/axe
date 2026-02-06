# PR #6: The Memory Layer (History & Persistence)

## System Overview: "You Are Here"

Currently, the system functions but has "amnesia." We can execute nodes (PR #4 & #5), but the results disappear upon refresh, and we cannot track past performance. This PR implements the **Persistence Layer**, ensuring that both the Workflow structure (the graph itself) and the Execution History (the results) are permanently stored in PostgreSQL.

## Scope

* **Workflow Persistence:** API route to **Save/Load** the workflow graph (nodes, edges, viewport) to the database.
* **Run Logging:** Logic to insert a `Run` record and associated `NodeResult` records into the database whenever a workflow execution finishes.
* **History Sidebar (Right):** Implementation of the sidebar UI to list past runs with status badges (Success/Failed) and timestamps.
* **Node-Level Detail View:** Clicking a run in the history expands it to show the granular details (inputs/outputs/duration) for each node in that run.

## Out of Scope

* Real-time streaming of updates (we will rely on polling or simple refetching for this MVP).
* Complex filtering of history (just a simple chronological list).

---

## 📜 The Contract (Data Persistence)

### 1. The "Save Before Run" Rule

To attach a history record to a workflow, the workflow **must** exist in the database.

* **Constraint:** The "Run" button should auto-save the workflow (or require a save) before triggering the execution to ensure a valid `workflowId` exists.

### 2. History Data Shape (Frontend)

The Right Sidebar expects this structure to render the "Run Entry" and "Node Level History":

```typescript
interface RunHistoryItem {
  id: string;
  timestamp: Date;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  duration: number; // ms
  scope: "FULL" | "SINGLE" | "PARTIAL";
  nodeResults: {
    nodeId: string;
    nodeType: string;
    status: "SUCCESS" | "FAILED";
    duration: number;
    output: any; // The JSON result
  }[];
}

```

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: Workflow Persistence (`app/api/workflows/route.ts`)

* [ ] Create `POST /api/workflows`: Creates or Updates a workflow.
* Receives: `nodes`, `edges`, `name`.
* Upserts to Prisma `Workflow` model.


* [ ] Create `GET /api/workflows/[id]`: Loads the graph state.
* [ ] **UI:** Add a "Save" button to the header (or auto-save hook).

### Step 2: Run Logging Logic (`src/jobs/workflow-completion.ts`)

* [ ] Create a new Trigger.dev task (or a final step in the existing workflow task) that runs *after* all nodes complete.
* [ ] This task calls `prisma.run.create`:
```typescript
await prisma.run.create({
  data: {
    workflowId: ...,
    status: finalStatus,
    duration: totalTime,
    results: {
      create: nodeResults.map(n => ({
        nodeId: n.id,
        status: n.status,
        output: n.output,
        // ...
      }))
    }
  }
})

```



### Step 3: Right Sidebar Implementation (`components/sidebar/HistoryPanel.tsx`)

* [ ] Fetch runs using SWR or React Query: `useSWR('/api/workflows/${id}/runs')`.
* [ ] Render the list of runs.
* [ ] **Interaction:** When a run is clicked, expand the item to show the list of nodes and their status/outputs (as defined in the "Node-Level History View" requirement).

### Step 4: Visual Status Badges

* [ ] Implement the status indicators matching the spec:
* ✅ Green Check = Success
* ❌ Red X = Failed
* ⏳ Yellow Spinner = Running



---

## ⏭️ Next Step

Merging this PR completes the "CRUD" cycle. We can build, save, run, and review.
**Next PR:** `PR #7: Advanced Graph Logic` (The final polish: DAG validation, Parallel execution logic, and the Convergence Node).