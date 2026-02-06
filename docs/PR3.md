# PR #3: The Node System & Interactive Graph

## System Overview: "You Are Here"

We have a secured app with a static layout (PR #1 & #2). Now we bring the canvas to life. This PR implements the **Custom Node Components** and the **Drag-and-Drop** logic. By the end of this PR, a user will be able to drag buttons from the sidebar and drop fully-styled (though not yet connected) nodes onto the canvas.

## Scope

* **Custom Node UI:** Implementation of the 6 specific node components (Text, Upload Image, Upload Video, LLM, Crop, Extract Frame) with their respective I/O handles.
* **State Management (Zustand):** Setup of the global store to manage node data (inputs, output values) separate from the React Flow internal state.
* **Drag-and-Drop (DnD):** Logic to transfer data from the sidebar buttons to the canvas `onDrop` event, spawning the correct node type.
* **Node Registration:** defining the `nodeTypes` object and passing it to the `ReactFlow` instance.

## Out of Scope

* **Edge Connections:** Logic for connecting nodes (validation comes in PR #7).
* **Execution:** No API calls or Trigger.dev integration yet.
* **File Uploads:** The "Upload" nodes will just show the UI (button/preview area), but actual Transloadit logic comes in PR #5.

---

## 📜 The Contract (Node UI Specifications)

### 1. Visual Standard (`BaseNode` Wrapper)

All nodes must share a common "Weavy-style" container design to ensure consistency.

* **Background:** White (`bg-white`)
* **Border:** Thin gray (`border-gray-200`), turns purple (`border-indigo-500`) when selected.
* **Shadow:** Small shadow (`shadow-sm`).
* **Header:** Small icon + Title (e.g., "Text Node").
* **Width:** Fixed width (e.g., `w-64` or `250px`).

### 2. Handle Configuration

Handles are the "ports" for connections. They must be positioned correctly:

* **Inputs:** `Position.Left`
* **Outputs:** `Position.Right`
* **Styling:** Small purple dots (`!bg-indigo-500`) matching the Weavy theme.

### 3. The "Input State" Rule

> **Critical:** Every input field (textarea, number input) inside a node component must accept a `connected` prop (boolean). If `true`, the UI input must be **disabled** and show a visual indicator (e.g., placeholder "Value from connection"). *Note: We implement the UI support for this now; the logic to toggle it comes in PR #7.*

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: State Management (`hooks/useStore.ts`)

* [ ] Install Zustand: `npm install zustand`.
* [ ] Create a store that mirrors React Flow's `useNodesState` and `useEdgesState` but accessible globally.
```typescript
import { create } from 'zustand';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

type AppState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: any) => void;
};
// ... implement create() with set/get

```



### Step 2: Create Custom Node Components (`components/nodes/*.tsx`)

* [ ] **TextNode:** Contains a `<textarea>` and 1 Output Handle.
* [ ] **LLMNode:** Contains 3 Input Handles (System, User, Image) and 1 Output Handle. Includes a `Select` for the model (Gemini Pro/Flash).
* [ ] **Image/Video Upload Nodes:** Contains a placeholder "Upload" button area and 1 Output Handle.
* [ ] **Crop/Extract Nodes:** Contains Number inputs (X, Y, Width...) and Input/Output handles.
* [ ] **Crucial:** Register these in a `nodeTypes` object in `components/workflow/config.ts`.

### Step 3: Implement Drag-and-Drop Logic

* [ ] **Sidebar (`NodePalette.tsx`):** Add `onDragStart` to buttons. Attach the "nodeType" to `event.dataTransfer`.
```typescript
const onDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

```


* [ ] **Canvas (`WorkflowCanvas.tsx`):**
* Add `onDragOver` (preventDefault).
* Add `onDrop`: Read `nodeType` from dataTransfer, project the mouse position to canvas coordinates (`screenToFlowPosition`), and call `addNode` from the store.



### Step 4: Wire it Up

* [ ] Pass `nodeTypes={nodeTypes}` to the `<ReactFlow>` component.
* [ ] Connect the `nodes` and `onNodesChange` from the Zustand store to the `<ReactFlow>` component props.

---

## ⏭️ Next Step

Merging this PR gives us a "Drawing Tool". We can drag nodes and arrange them.
**Next PR:** `PR #4: The Execution Engine` (Setting up Trigger.dev so we can eventually "Run" these nodes).