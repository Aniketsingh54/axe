import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';

type SetEdgesFunc = Edge[] | ((edges: Edge[]) => Edge[]);

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
  setWorkflowId: (id: string | null) => void;
};

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
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
    if (typeof nodesOrFn === 'function') {
      set({ nodes: nodesOrFn(get().nodes) });
    } else {
      set({ nodes: nodesOrFn });
    }
  },
  setEdges: (edgesOrFn) => {
    if (typeof edgesOrFn === 'function') {
      set({ edges: edgesOrFn(get().edges) });
    } else {
      set({ edges: edgesOrFn });
    }
  },
  setWorkflowId: (id) => set({ workflowId: id }),
}));