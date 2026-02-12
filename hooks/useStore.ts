import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';

type SetEdgesFunc = Edge[] | ((edges: Edge[]) => Edge[]);

// Execution log entry type
export type ExecutionLog = {
  id: string;
  timestamp: Date;
  nodeId?: string;
  nodeName?: string;
  level: 'info' | 'success' | 'error' | 'warn';
  message: string;
};

// History state for undo/redo
type HistoryState = {
  nodes: Node[];
  edges: Edge[];
};

const MAX_HISTORY_SIZE = 50;

type AppState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: SetEdgesFunc) => void;
  workflowId: string | null;
  workflowName: string;
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  loadWorkflow: (id: string, nodes: Node[], edges: Edge[], name?: string) => void;
  // History refresh trigger
  historyTrigger: number;
  refreshHistory: () => void;
  // Execution logs
  executionLogs: ExecutionLog[];
  addExecutionLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => void;
  clearExecutionLogs: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  // Single node execution
  pendingNodeRun: string | null;
  setPendingNodeRun: (nodeId: string | null) => void;
  // Undo/Redo
  past: HistoryState[];
  future: HistoryState[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  // Clear workflow
  clearWorkflow: () => void;
};

// Helper to check if a change is significant (worth saving to history)
const isSignificantNodeChange = (changes: NodeChange[]): boolean => {
  return changes.some(change =>
    change.type === 'add' ||
    change.type === 'remove' ||
    (change.type === 'position' && change.dragging === false)
  );
};

const isSignificantEdgeChange = (changes: EdgeChange[]): boolean => {
  return changes.some(change =>
    change.type === 'add' ||
    change.type === 'remove'
  );
};

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  workflowName: 'untitled',
  historyTrigger: 0,
  executionLogs: [],
  isRunning: false,
  pendingNodeRun: null,
  past: [],
  future: [],

  setPendingNodeRun: (nodeId) => set({ pendingNodeRun: nodeId }),
  setIsRunning: (running) => set({ isRunning: running }),

  addExecutionLog: (log) => set((state) => ({
    executionLogs: [...state.executionLogs, {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }],
  })),

  clearExecutionLogs: () => set({ executionLogs: [] }),
  refreshHistory: () => set((state) => ({ historyTrigger: state.historyTrigger + 1 })),

  onNodesChange: (changes) => {
    const { nodes, edges, past } = get();
    const shouldSaveHistory = isSignificantNodeChange(changes);

    const newNodes = applyNodeChanges(changes, nodes);

    if (shouldSaveHistory) {
      const newPast = [...past, { nodes, edges }].slice(-MAX_HISTORY_SIZE);
      set({ nodes: newNodes, past: newPast, future: [] });
    } else {
      set({ nodes: newNodes });
    }
  },

  onEdgesChange: (changes) => {
    const { nodes, edges, past } = get();
    const shouldSaveHistory = isSignificantEdgeChange(changes);

    const newEdges = applyEdgeChanges(changes, edges);

    if (shouldSaveHistory) {
      const newPast = [...past, { nodes, edges }].slice(-MAX_HISTORY_SIZE);
      set({ edges: newEdges, past: newPast, future: [] });
    } else {
      set({ edges: newEdges });
    }
  },

  addNode: (node) => {
    const { nodes, edges, past } = get();
    const newPast = [...past, { nodes, edges }].slice(-MAX_HISTORY_SIZE);
    set({
      nodes: [...nodes, node],
      past: newPast,
      future: [],
    });
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          }
          : node
      ),
    });
  },

  setNodes: (nodesOrFn) => {
    const { nodes, edges, past } = get();
    const newNodes = typeof nodesOrFn === 'function' ? nodesOrFn(nodes) : nodesOrFn;
    const newPast = [...past, { nodes, edges }].slice(-MAX_HISTORY_SIZE);
    set({ nodes: newNodes, past: newPast, future: [] });
  },

  setEdges: (edgesOrFn) => {
    const { nodes, edges, past } = get();
    const newEdges = typeof edgesOrFn === 'function' ? edgesOrFn(edges) : edgesOrFn;
    const newPast = [...past, { nodes, edges }].slice(-MAX_HISTORY_SIZE);
    set({ edges: newEdges, past: newPast, future: [] });
  },

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name || 'untitled' }),

  loadWorkflow: (id, nodes, edges, name) => set({
    workflowId: id,
    workflowName: name || 'untitled',
    nodes,
    edges,
    past: [],
    future: [],
  }),

  // Undo/Redo
  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [{ nodes, edges }, ...future].slice(0, MAX_HISTORY_SIZE),
    });
  },

  redo: () => {
    const { past, nodes, edges, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, { nodes, edges }].slice(-MAX_HISTORY_SIZE),
      future: newFuture,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // Clear workflow for new workflow
  clearWorkflow: () => set({
    nodes: [],
    edges: [],
    workflowId: null,
    workflowName: 'untitled',
    past: [],
    future: [],
    executionLogs: [],
  }),
}));
