# PR #2: The Canvas Core & Application Layout

## System Overview: "You Are Here"

With the foundation (Auth & DB) established in PR #1, we now build the **visual shell** of the application. This PR transforms the blank page into the pixel-perfect structure required by the Weavy.ai clone: a responsive three-column layout containing the left sidebar (node palette), the central workspace (React Flow canvas), and the right sidebar (history).

## Scope

* **Layout Architecture:** Implement the `SidebarLayout` component that strictly adheres to the Weavy design (Left: 280px, Right: 320px, Center: Flex-grow).
* **React Flow Canvas:** Initialize the central `WorkflowCanvas` with the "Dots" background, MiniMap, and Controls (Zoom/Fit).
* **Left Sidebar (Static):** Create the UI for the "Quick Access" panel with the 6 specific buttons (Text, Upload Image, Upload Video, Run LLM, Crop Image, Extract Frame).
* **Right Sidebar (Static):** Create the shell for the "Workflow History" panel (functionality comes in PR #6).
* **Theme Integration:** Apply the Weavy-specific colors and fonts defined in `tailwind.config.ts`.

## Out of Scope

* Drag-and-drop logic (dragging buttons to the canvas).
* Custom node implementation (the nodes on the canvas are just generic boxes for now).
* Database connection for saving/loading.

---

## 📜 The Contract (UI Specifications)

### 1. Layout Dimensions

The application must use a fixed-position layout to ensure the canvas takes up the remaining viewport height and width.

| Region | Width/Height | Behavior |
| --- | --- | --- |
| **Header** | `h-14` (56px) | Fixed top, contains Logo and UserButton. |
| **Left Sidebar** | `w-[280px]` | Fixed left, scrollable node list. |
| **Right Sidebar** | `w-[320px]` | Fixed right, scrollable history. |
| **Canvas** | `flex-1` | Occupies remaining space, hidden overflow. |

### 2. React Flow Configuration

The canvas must use these specific props to match the reference experience:

* `color="#e1e1e1"` (for the background dots)
* `gap={20}` (grid gap)
* `minZoom={0.1}` / `maxZoom={4}`
* `fitView` (on initial load)

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: Install UI Dependencies

* [ ] Install React Flow: `npm install @xyflow/react` (Note: ensure you are using the latest version compatible with Next.js 15).
* [ ] Install Lucide Icons for the buttons: `npm install lucide-react`.

### Step 2: Create the Layout Component (`components/layout/AppLayout.tsx`)

* [ ] Create a component that wraps children in the 3-column structure.
* [ ] **Crucial:** Ensure the main wrapper has `h-screen` and `overflow-hidden` to prevent window scrolling.

```tsx
// Simplified visual structure
<div className="flex h-screen w-full flex-col bg-white">
  <Header className="h-14 border-b" />
  <div className="flex flex-1 overflow-hidden">
    <aside className="w-[280px] border-r bg-gray-50/50">
       {/* Left Sidebar Content */}
    </aside>
    <main className="flex-1 relative">
       {children} {/* Canvas goes here */}
    </main>
    <aside className="w-[320px] border-l bg-gray-50/50">
       {/* Right Sidebar Content */}
    </aside>
  </div>
</div>

```

### Step 3: Implement the Canvas (`components/workflow/WorkflowCanvas.tsx`)

* [ ] Initialize `<ReactFlow>` with `<Background variant={BackgroundVariant.Dots} />`.
* [ ] Add `<Controls />` (bottom-left) and `<MiniMap />` (bottom-right).
* [ ] Define `initialNodes` as an empty array `[]` for now.

### Step 4: Implement Left Sidebar Buttons (`components/sidebar/NodePalette.tsx`)

* [ ] Create a `DraggableNodeButton` component.
* [ ] Implement the list of 6 mandatory buttons:
1. **Text Node** (Icon: `Type`)
2. **Upload Image** (Icon: `Image`)
3. **Upload Video** (Icon: `Video`)
4. **Run Any LLM** (Icon: `Sparkles` - *Use pulsating effect css class placeholder here*)
5. **Crop Image** (Icon: `Crop`)
6. **Extract Frame** (Icon: `Film`)



### Step 5: Update the Main Page (`app/page.tsx`)

* [ ] Replace the default Next.js homepage with the `AppLayout` containing the `WorkflowCanvas`.

---

## ⏭️ Next Step

Once this PR is merged, the user will see the "Weavy" interface, but it will be static.
**Next PR:** `PR #3: The Node System` (Implementing the custom node components and enabling drag-and-drop).