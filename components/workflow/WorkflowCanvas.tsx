'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  NodeTypes,
  addEdge,
  Connection,
  useReactFlow,
  OnSelectionChangeFunc,
} from '@xyflow/react';
import { useStore } from '@/hooks/useStore';
import { nodeTypes } from './config';
import { Play, Save, Loader2, Undo2, Redo2, FilePlus, PlayCircle } from 'lucide-react';
import { isValidConnection as validateConnection } from '@/lib/graph';
import { type NodeRunStatus } from '@/components/nodes/BaseNode';

import '@xyflow/react/dist/style.css';

// Helper to strip runtime data and large base64 URLs from nodes to reduce API payload size
const getCleanNodes = (nodes: Node[]) => nodes.map(node => {
  const data = { ...node.data };

  // Remove runtime fields
  delete data.output;
  delete data.error;
  delete data.isRunning;
  delete data.runStatus;

  // Strip base64 data URLs (they're too large for Vercel's serverless functions)
  // Keep only external URLs (http/https)
  if (typeof data.imageUrl === 'string' && data.imageUrl.startsWith('data:')) {
    data.imageUrl = '[base64-stripped]';
  }
  if (typeof data.videoUrl === 'string' && data.videoUrl.startsWith('data:')) {
    data.videoUrl = '[base64-stripped]';
  }

  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data,
  };
});

type ExecutionNodeResult = {
  nodeId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  outputs?: { output?: unknown };
  error?: string;
  startedAt?: string;
  endedAt?: string;
};

type PolledNodeResult = {
  id: string;
  nodeId: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  output?: unknown;
  error?: string | null;
  startedAt: string;
  endedAt: string;
};

type PolledRun = {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  results: PolledNodeResult[];
};

const POLL_INTERVAL_MS = 700;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatOutputForLog = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 120 ? `${trimmed.slice(0, 120)}...` : trimmed;
  }
  try {
    const json = JSON.stringify(value);
    return json.length > 120 ? `${json.slice(0, 120)}...` : json;
  } catch {
    return String(value);
  }
};

const extractOutputFromNodeResult = (result: ExecutionNodeResult | PolledNodeResult): unknown => {
  const executionResult = result as ExecutionNodeResult;
  if (executionResult.outputs && typeof executionResult.outputs === 'object' && 'output' in executionResult.outputs) {
    return executionResult.outputs.output;
  }
  const polled = result as PolledNodeResult;
  if (polled.output && typeof polled.output === 'object' && 'output' in (polled.output as Record<string, unknown>)) {
    return (polled.output as Record<string, unknown>).output;
  }
  return polled.output;
};

const getExecutionScopeNodeIds = (
  targetNodeIds: string[] | undefined,
  edges: Edge[],
  direction: 'UPSTREAM' | 'DOWNSTREAM'
): Set<string> => {
  if (!targetNodeIds || targetNodeIds.length === 0) {
    return new Set<string>();
  }

  const include = new Set<string>(targetNodeIds);
  const queue = [...targetNodeIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (direction === 'DOWNSTREAM' && edge.source === current && !include.has(edge.target)) {
        include.add(edge.target);
        queue.push(edge.target);
      }
      if (direction === 'UPSTREAM' && edge.target === current && !include.has(edge.source)) {
        include.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return include;
};

const getScopeRoots = (scopeNodeIds: Set<string>, edges: Edge[]): string[] => {
  const roots: string[] = [];
  scopeNodeIds.forEach((nodeId) => {
    const hasIncomingFromScope = edges.some((edge) => edge.target === nodeId && scopeNodeIds.has(edge.source));
    if (!hasIncomingFromScope) roots.push(nodeId);
  });
  return roots;
};

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    setNodes,
    setEdges,
    updateNodeData,
    workflowId,
    setWorkflowId,
    refreshHistory,
    addExecutionLog,
    clearExecutionLogs,
    setIsRunning: setGlobalIsRunning,
    pendingNodeRun,
    setPendingNodeRun,
    undo,
    redo,
    canUndo,
    canRedo,
    clearWorkflow,
  } = useStore();
  const { screenToFlowPosition } = useReactFlow();
  const searchParams = useSearchParams();
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const visualizedScopeRef = useRef<Set<string>>(new Set());
  const loadedWorkflowRef = useRef<string | null>(null);

  const initializeRunVisualState = useCallback((targetNodeIds?: string[], direction: 'UPSTREAM' | 'DOWNSTREAM' = 'DOWNSTREAM') => {
    const scope = getExecutionScopeNodeIds(targetNodeIds, edges, direction);
    const scopeIds = scope.size > 0 ? [...scope] : nodes.map((node) => node.id);
    visualizedScopeRef.current = new Set(scopeIds);

    // Reset scope status; actual RUNNING/SUCCESS/FAILED come from backend polling.
    scopeIds.forEach((nodeId) => {
      updateNodeData(nodeId, {
        isRunning: false,
        runStatus: 'idle' as NodeRunStatus,
        error: undefined,
        output: undefined,
      });
    });

    // Queue only roots of current run scope to avoid "everything queued" spam.
    const queueNodeIds = targetNodeIds && targetNodeIds.length > 0
      ? targetNodeIds
      : getScopeRoots(new Set(scopeIds), edges);

    queueNodeIds.forEach((nodeId) => {
      if (!visualizedScopeRef.current.has(nodeId)) return;
      updateNodeData(nodeId, {
        isRunning: false,
        runStatus: 'queued' as NodeRunStatus,
      });
    });
  }, [edges, nodes, updateNodeData]);

  const applyNodeResult = useCallback((nodeResult: ExecutionNodeResult | PolledNodeResult) => {
    if (nodeResult.status === 'RUNNING') {
      updateNodeData(nodeResult.nodeId, {
        isRunning: true,
        runStatus: 'running' as NodeRunStatus,
      });
      return;
    }

    const nodeInfo = nodes.find((n) => n.id === nodeResult.nodeId);
    const nodeName = nodeInfo?.type || nodeResult.nodeId;
    const output = extractOutputFromNodeResult(nodeResult);
    const outputPreview = formatOutputForLog(output);
    const isSuccess = nodeResult.status === 'SUCCESS';

    if (isSuccess) {
      addExecutionLog({
        level: 'success',
        nodeId: nodeResult.nodeId,
        nodeName,
        message: outputPreview ? `Completed | Output: ${outputPreview}` : 'Completed successfully',
      });
    } else {
      addExecutionLog({
        level: 'error',
        nodeId: nodeResult.nodeId,
        nodeName,
        message: `Failed: ${nodeResult.error || 'Unknown error'}`,
      });
    }

    updateNodeData(nodeResult.nodeId, {
      isRunning: false,
      runStatus: (isSuccess ? 'success' : 'failed') as NodeRunStatus,
      output,
      error: nodeResult.error || undefined,
    });
  }, [addExecutionLog, nodes, updateNodeData]);

  const settleUnreportedNodes = useCallback((resolvedNodeIds: Set<string>) => {
    visualizedScopeRef.current.forEach((nodeId) => {
      if (!resolvedNodeIds.has(nodeId)) {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'idle' as NodeRunStatus });
      }
    });
  }, [updateNodeData]);

  const pollRunUntilComplete = useCallback(async (workflowIdToPoll: string, runId: string): Promise<PolledRun['status']> => {
    const seenResultStatus = new Map<string, PolledNodeResult['status']>();
    const resolvedNodeIds = new Set<string>();

    while (true) {
      const runRes = await fetch(`/api/workflows/${workflowIdToPoll}/runs/${runId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (runRes.status === 404) {
        await wait(POLL_INTERVAL_MS);
        continue;
      }

      if (!runRes.ok) {
        throw new Error(`Failed to poll run ${runId}: HTTP ${runRes.status}`);
      }

      const run: PolledRun = await runRes.json();
      const sortedResults = [...(run.results || [])].sort(
        (a, b) => new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime()
      );

      for (const nodeResult of sortedResults) {
        const prevStatus = seenResultStatus.get(nodeResult.id);
        if (prevStatus === nodeResult.status) continue;
        seenResultStatus.set(nodeResult.id, nodeResult.status);

        if (nodeResult.status === 'SUCCESS' || nodeResult.status === 'FAILED') {
          resolvedNodeIds.add(nodeResult.nodeId);
        }
        applyNodeResult(nodeResult);
      }

      if (run.status !== 'RUNNING') {
        settleUnreportedNodes(resolvedNodeIds);
        return run.status;
      }

      await wait(POLL_INTERVAL_MS);
    }
  }, [applyNodeResult, settleUnreportedNodes]);

  // Track selected nodes
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeIds(selectedNodes.map(n => n.id));
  }, []);

  // Load a workflow passed via /builder?workflowId=...
  useEffect(() => {
    const routeWorkflowId = searchParams.get('workflowId');
    if (!routeWorkflowId) {
      // /builder without an id should be a fresh canvas entry point
      if (loadedWorkflowRef.current !== '__new__') {
        clearWorkflow();
        loadedWorkflowRef.current = '__new__';
      }
      return;
    }

    if (loadedWorkflowRef.current === routeWorkflowId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/workflows/${routeWorkflowId}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to load workflow (${res.status})`);
        }
        const workflow = await res.json();
        if (cancelled) return;
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setWorkflowId(workflow.id);
        loadedWorkflowRef.current = routeWorkflowId;
      } catch (error) {
        console.error('Failed to load workflow by route id:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, clearWorkflow, setEdges, setNodes, setWorkflowId]);

  // Handle single node execution when pendingNodeRun is set
  useEffect(() => {
    if (pendingNodeRun && !isRunning) {
      handleRunSingleNode(pendingNodeRun);
      setPendingNodeRun(null);
    }
  }, [pendingNodeRun]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((prevEdges) => addEdge(connection, prevEdges));
    },
    [setEdges]
  );

  const isValidConnection = useCallback(
    (connection: Connection) => validateConnection(connection, edges),
    [edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');

      if (typeof nodeType === 'undefined' || !nodeType) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNodeData: Record<string, unknown> = {};

      switch (nodeType) {
        case 'text':
          newNodeData = { text: '', connected: false };
          break;
        case 'llm':
          newNodeData = {
            systemPrompt: '',
            userMessage: '',
            imageUrl: '',
            model: 'gemini-1.5-flash',
            connectedSystem: false,
            connectedUser: false,
            connectedImage: false
          };
          break;
        case 'upload-image':
          newNodeData = { imageUrl: '', connected: false };
          break;
        case 'upload-video':
          newNodeData = { videoUrl: '', connected: false };
          break;
        case 'crop-image':
          newNodeData = {
            imageUrl: '',
            xPercent: 0,
            yPercent: 0,
            widthPercent: 100,
            heightPercent: 100,
            connectedImage: false,
            connectedX: false,
            connectedY: false,
            connectedWidth: false,
            connectedHeight: false
          };
          break;
        case 'extract-frame':
          newNodeData = {
            videoUrl: '',
            timestamp: '0',
            connectedVideo: false,
            connectedTimestamp: false
          };
          break;
        default:
          newNodeData = {};
      }

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: newNodeData,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const handleSaveWorkflow = async (): Promise<string | null> => {
    if (isSaving) return workflowId;
    setIsSaving(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workflowId,
          name: 'My Workflow',
          nodes: getCleanNodes(nodes),
          edges,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to save';
        try {
          const errJson = JSON.parse(text);
          errorMessage = errJson.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const savedWorkflow = await response.json();
      setWorkflowId(savedWorkflow.id);
      return savedWorkflow.id;
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(`Failed to save workflow: ${error.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Single node execution as selected sub-tree root
  const handleRunSingleNode = async (targetNodeId: string) => {
    if (isRunning) return;

    const savedId = await handleSaveWorkflow();
    if (!savedId) return;

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    const targetNode = nodes.find(n => n.id === targetNodeId);
    const nodeName = targetNode?.type || 'Node';

    addExecutionLog({ level: 'info', message: `Running downstream sub-tree from node: ${nodeName}...` });
    initializeRunVisualState([targetNodeId], 'DOWNSTREAM');

    try {
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: savedId,
          nodes: getCleanNodes(nodes),
          edges,
          targetNodeId,
          asyncExecution: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = JSON.parse(text);
          errorMessage = errJson.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const runId = result.runId as string | undefined;
      const finalStatus = runId ? await pollRunUntilComplete(savedId, runId) : result.status;

      refreshHistory();

      if (finalStatus === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Single node execution completed!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Execution finished with status: ${finalStatus}` });
      }

    } catch (error: any) {
      console.error('Error running single node:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      visualizedScopeRef.current.forEach((nodeId) => {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'failed' as NodeRunStatus, error: error.message });
      });
    } finally {
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  // Run multiple selected nodes as sub-tree roots
  const handleRunSelectedNodes = async () => {
    if (isRunning || selectedNodeIds.length === 0) return;

    const savedId = await handleSaveWorkflow();
    if (!savedId) return;

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    addExecutionLog({ level: 'info', message: `Running ${selectedNodeIds.length} selected node(s) with upstream dependencies...` });
    initializeRunVisualState(selectedNodeIds, 'UPSTREAM');

    try {
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: savedId,
          nodes: getCleanNodes(nodes),
          edges,
          targetNodeIds: selectedNodeIds,
          asyncExecution: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = JSON.parse(text);
          errorMessage = errJson.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const runId = result.runId as string | undefined;
      const finalStatus = runId ? await pollRunUntilComplete(savedId, runId) : result.status;

      refreshHistory();

      if (finalStatus === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Selected nodes execution completed!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Execution finished with status: ${finalStatus}` });
      }

    } catch (error: any) {
      console.error('Error running selected nodes:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      visualizedScopeRef.current.forEach((nodeId) => {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'failed' as NodeRunStatus, error: error.message });
      });
    } finally {
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (isRunning) return;

    const savedId = await handleSaveWorkflow();
    if (!savedId) return;

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    addExecutionLog({ level: 'info', message: `Starting workflow execution with ${nodes.length} nodes...` });
    initializeRunVisualState();

    try {
      addExecutionLog({ level: 'info', message: 'Sending workflow to execution engine...' });

      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: savedId, nodes: getCleanNodes(nodes), edges, asyncExecution: true }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = JSON.parse(text);
          errorMessage = errJson.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const runId = result.runId as string | undefined;
      const finalStatus = runId ? await pollRunUntilComplete(savedId, runId) : result.status;

      refreshHistory();

      if (finalStatus === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Workflow completed successfully!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Workflow finished with status: ${finalStatus}` });
      }

    } catch (error: any) {
      console.error('Error running workflow:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      alert(`Execution failed: ${error.message}`);
      visualizedScopeRef.current.forEach((nodeId) => {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'failed' as NodeRunStatus, error: error.message });
      });
    } finally {
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  return (
    <div className="relative h-full">
      {/* Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="h-9 w-9 grid place-items-center rounded-md text-sm transition-colors bg-[#1f222a]/95 border border-[#343846] text-white/80 hover:bg-[#2a2e39] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="h-9 w-9 grid place-items-center rounded-md text-sm transition-colors bg-[#1f222a]/95 border border-[#343846] text-white/80 hover:bg-[#2a2e39] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* New Workflow */}
        <button
          onClick={clearWorkflow}
          className="h-9 w-9 grid place-items-center rounded-md text-sm transition-colors bg-[#1f222a]/95 border border-[#343846] text-white/80 hover:bg-[#2a2e39]"
          title="New Workflow"
        >
          <FilePlus className="w-4 h-4" />
        </button>

        <button
          onClick={handleSaveWorkflow}
          disabled={isSaving}
          className="h-9 px-3 flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors bg-[#1f222a]/95 border border-[#343846] text-white/90 hover:bg-[#2a2e39]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleRunWorkflow}
          disabled={isRunning || nodes.length === 0}
          className={`h-9 px-4 flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors ${isRunning || nodes.length === 0
            ? 'bg-[#5f68a8]/60 text-white/55 cursor-not-allowed'
            : 'bg-[#7078ff] text-white hover:bg-[#7b84ff]'
            }`}
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Running...' : 'Run Workflow'}
        </button>

        {/* Run Selected Button */}
        {selectedNodeIds.length > 0 && (
          <button
            onClick={handleRunSelectedNodes}
            disabled={isRunning}
            className={`h-9 px-4 flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors ${isRunning
              ? 'bg-[#2e6f4c]/55 text-white/50 cursor-not-allowed'
              : 'bg-[#2e8b57] text-white hover:bg-[#339c62]'
              }`}
            title={`Run ${selectedNodeIds.length} selected node(s) with upstream dependencies`}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Run Selected ({selectedNodeIds.length})
          </button>
        )}

      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes as NodeTypes}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6f78ff', strokeWidth: 1.8, strokeDasharray: '4,4' },
        }}
        fitView
        minZoom={0.1}
        maxZoom={4}
        className="bg-[#060912]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={14}
          size={1}
          color="#253066"
        />
        <Controls className="bg-[#1f222a] border-[#343846] fill-white/85" />
        <MiniMap
          nodeColor={() => '#6f78ff'}
          maskColor="rgba(6, 9, 18, 0.72)"
          className="bg-[#1f222a] border-[#343846]"
        />
      </ReactFlow>
    </div>
  );
}
