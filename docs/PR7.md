# PR #7: Advanced Graph Logic & Parallel Execution

## System Overview: "You Are Here"

This is the **Final Logic Layer**. Up to this point, our nodes execute, but the orchestrator is likely linear or simplistic. This PR implements the sophisticated graph theory required to support **Parallel Branches** and **Convergence** (merging branches). It ensures that "Branch A" and "Branch B" run simultaneously, and the final "LLM Node" intelligently waits for both to finish before starting. We also add the **Safety Rails** (DAG Validation) to prevent users from creating infinite loops.

## Scope

* **DAG Validation:** Implement a client-side check `isValidConnection` to prevent users from connecting a node back to its ancestor (Cyclic Dependency prevention).
* **Parallel Orchestration:** Upgrade the Trigger.dev workflow logic to analyze the graph topology. Independent nodes must execute concurrently (e.g., Image Upload AND Video Upload start at T=0).
* **Convergence Logic:** Implement the "Wait for Dependencies" rule. A node (e.g., the final LLM) must only trigger when **ALL** its upstream inputs have successfully resolved.
* **Sample Workflow:** Inject the "Product Marketing Kit Generator" (The specific 2-branch demo workflow) as a default template in the database/UI.

## Out of Scope

* New UI components (we are just making the existing graph behave smarter).
* Additional integrations (we are using the existing Gemini/FFmpeg tasks).

---

## 📜 The Contract (Graph Theory)

### 1. The "No Loops" Rule (DAG)

The system must be a **Directed Acyclic Graph**.

* **Constraint:** Before creating an edge `A -> B`, run a traversal check. If `B` can already reach `A`, the connection must be **rejected** with a visual warning.

### 2. The Convergence Rule

> **Critical:** If Node C depends on Node A and Node B:
> * Node C state = `PENDING` while A or B are running.
> * Node C state = `RUNNING` only when A.status = `SUCCESS` **AND** B.status = `SUCCESS`.
> * If A or B fails, Node C must be skipped or marked `SKIPPED`.
> 
> 

### 3. Sample Workflow Data Structure

The "Product Marketing Kit" must be pre-loaded with these exact characteristics:

* **Branch A:** Upload Image -> Crop Image -> Text Nodes -> LLM #1.
* **Branch B:** Upload Video -> Extract Frame.
* **Merge:** LLM #2 (Takes LLM #1 output + Cropped Image + Extracted Frame).

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: DAG Validation (`utils/graph.ts`)

* [ ] Implement a cycle detection function (DFS or BFS).
* [ ] Hook this into React Flow's `isValidConnection` prop.
```typescript
const isValidConnection = (edge: Edge | Connection) => {
  // 1. Check for type safety (Image Output !-> Text Input)
  // 2. Check for cycles (findTargetInSource(edge.target, edge.source))
  return isSafe;
};

```



### Step 2: Parallel Execution Engine (`src/jobs/workflow-runner.ts`)

* [ ] Refactor the linear runner to a **Topological Sort** or **Event-Driven** runner.
* [ ] **Algorithm:**
1. Identify all nodes with 0 uncompleted dependencies.
2. `Promise.all([ run(NodeA), run(NodeB) ])`.
3. On complete, mark nodes as done.
4. Identify next set of runnable nodes.
5. Repeat until graph is empty.



### Step 3: Input Aggregation Logic

* [ ] Ensure the "Convergence Node" collects data correctly.
* `inputs.systemPrompt` comes from Node X.
* `inputs.images` is an array `[NodeY.url, NodeZ.url]`.


* [ ] Verify the `LLMNode` task can handle an array of image inputs (Multimodal).

### Step 4: The Sample Workflow (`prisma/seed.ts` or `app/api/seed/route.ts`)

* [ ] Create a script to insert the "Product Marketing Kit" JSON into the `Workflow` table.
* [ ] **Verification:** Ensure the node IDs and Edge sources/targets match exactly so the graph renders correctly on load.

---

## 🏁 Final System State

Upon merging PR #7, the system is **Feature Complete**.

* The UI is pixel-perfect (PR 1-3).
* The Engine runs in the background (PR 4).
* The Brains (AI/Media) work (PR 5).
* History is saved (PR 6).
* Complex, parallel workflows function correctly (PR 7).

**The project is now ready for the final "Submission" phase (Deployment & Video Demo).**