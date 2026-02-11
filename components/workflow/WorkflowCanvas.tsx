'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
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
import { Play, Save, Loader2, Download, Upload, Undo2, Redo2, FilePlus, PlayCircle } from 'lucide-react';
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
  status: 'SUCCESS' | 'FAILED';
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

const DAG_ANIMATION_TICK_MS = 900;
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

const getExecutionScopeNodeIds = (targetNodeIds: string[] | undefined, edges: Edge[]): Set<string> => {
  if (!targetNodeIds || targetNodeIds.length === 0) {
    return new Set<string>();
  }

  const include = new Set<string>(targetNodeIds);
  const queue = [...targetNodeIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.target === current && !include.has(edge.source)) {
        include.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return include;
};

const buildExecutionPhases = (nodes: Node[], edges: Edge[], scopeNodeIds?: Set<string>): string[][] => {
  const includedIds = scopeNodeIds && scopeNodeIds.size > 0
    ? new Set([...scopeNodeIds].filter((id) => nodes.some((node) => node.id === id)))
    : new Set(nodes.map((node) => node.id));

  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const nodeId of includedIds) {
    inDegree.set(nodeId, 0);
    adjacency.set(nodeId, []);
  }

  for (const edge of edges) {
    if (!includedIds.has(edge.source) || !includedIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const phases: string[][] = [];
  const remaining = new Set(includedIds);
  let current = [...includedIds].filter((id) => (inDegree.get(id) || 0) === 0);

  while (current.length > 0) {
    phases.push(current);
    current.forEach((id) => remaining.delete(id));

    const nextSet = new Set<string>();
    for (const nodeId of current) {
      for (const childId of adjacency.get(nodeId) || []) {
        const nextDegree = (inDegree.get(childId) || 0) - 1;
        inDegree.set(childId, nextDegree);
        if (nextDegree === 0) nextSet.add(childId);
      }
    }
    current = [...nextSet];
  }

  if (remaining.size > 0) {
    phases.push([...remaining]);
  }

  return phases;
};

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
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
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visualizedScopeRef = useRef<Set<string>>(new Set());

  const stopPhaseAnimation = useCallback(() => {
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  const startPhaseAnimation = useCallback((targetNodeIds?: string[]) => {
    stopPhaseAnimation();

    const scope = getExecutionScopeNodeIds(targetNodeIds, edges);
    const scopeIds = scope.size > 0 ? [...scope] : nodes.map((node) => node.id);
    visualizedScopeRef.current = new Set(scopeIds);

    // Initialize selected execution scope as queued.
    scopeIds.forEach((nodeId) => {
      updateNodeData(nodeId, {
        isRunning: false,
        runStatus: 'queued' as NodeRunStatus,
        error: undefined,
        output: undefined,
      });
    });

    const phases = buildExecutionPhases(nodes, edges, scope.size > 0 ? scope : undefined);
    if (phases.length === 0) return;

    const activatePhase = (phaseIndex: number) => {
      if (phaseIndex > 0 && phases[phaseIndex - 1]) {
        phases[phaseIndex - 1].forEach((nodeId) => {
          updateNodeData(nodeId, {
            isRunning: false,
            runStatus: 'success' as NodeRunStatus,
          });
        });
      }

      if (phases[phaseIndex]) {
        phases[phaseIndex].forEach((nodeId) => {
          updateNodeData(nodeId, {
            isRunning: true,
            runStatus: 'running' as NodeRunStatus,
          });
        });
      }
    };

    let phaseIndex = 0;
    activatePhase(phaseIndex);

    phaseTimerRef.current = setInterval(() => {
      phaseIndex += 1;
      if (phaseIndex >= phases.length) {
        stopPhaseAnimation();
        return;
      }
      activatePhase(phaseIndex);
    }, DAG_ANIMATION_TICK_MS);
  }, [edges, nodes, stopPhaseAnimation, updateNodeData]);

  const applyNodeResult = useCallback((nodeResult: ExecutionNodeResult | PolledNodeResult) => {
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
    const seenResultIds = new Set<string>();
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
        if (seenResultIds.has(nodeResult.id)) continue;
        seenResultIds.add(nodeResult.id);
        resolvedNodeIds.add(nodeResult.nodeId);
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

  useEffect(() => {
    return () => stopPhaseAnimation();
  }, [stopPhaseAnimation]);

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

  // Single node execution (with dependencies)
  const handleRunSingleNode = async (targetNodeId: string) => {
    if (isRunning) return;

    const savedId = await handleSaveWorkflow();
    if (!savedId) return;

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    const targetNode = nodes.find(n => n.id === targetNodeId);
    const nodeName = targetNode?.type || 'Node';

    addExecutionLog({ level: 'info', message: `Running single node: ${nodeName} (with dependencies)...` });
    startPhaseAnimation([targetNodeId]);

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

      stopPhaseAnimation();
      refreshHistory();

      if (finalStatus === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Single node execution completed!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Execution finished with status: ${finalStatus}` });
      }

    } catch (error: any) {
      console.error('Error running single node:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      stopPhaseAnimation();
      visualizedScopeRef.current.forEach((nodeId) => {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'failed' as NodeRunStatus, error: error.message });
      });
    } finally {
      stopPhaseAnimation();
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  // Run multiple selected nodes
  const handleRunSelectedNodes = async () => {
    if (isRunning || selectedNodeIds.length === 0) return;

    const savedId = await handleSaveWorkflow();
    if (!savedId) return;

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    addExecutionLog({ level: 'info', message: `Running ${selectedNodeIds.length} selected node(s) with dependencies...` });
    startPhaseAnimation(selectedNodeIds);

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

      stopPhaseAnimation();
      refreshHistory();

      if (finalStatus === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Selected nodes execution completed!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Execution finished with status: ${finalStatus}` });
      }

    } catch (error: any) {
      console.error('Error running selected nodes:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      stopPhaseAnimation();
      visualizedScopeRef.current.forEach((nodeId) => {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'failed' as NodeRunStatus, error: error.message });
      });
    } finally {
      stopPhaseAnimation();
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
    startPhaseAnimation();

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

      stopPhaseAnimation();
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
      stopPhaseAnimation();
      visualizedScopeRef.current.forEach((nodeId) => {
        updateNodeData(nodeId, { isRunning: false, runStatus: 'failed' as NodeRunStatus, error: error.message });
      });
    } finally {
      stopPhaseAnimation();
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  // Export workflow as JSON
  const handleExportWorkflow = () => {
    const workflowData = {
      version: 1,
      name: workflowId ? `workflow-${workflowId}` : 'untitled-workflow',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowData.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import workflow from JSON
  const handleImportWorkflow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const workflowData = JSON.parse(text);

      if (!workflowData.nodes || !workflowData.edges) {
        throw new Error('Invalid workflow file format');
      }

      const { setNodes, setEdges } = useStore.getState();
      setNodes(workflowData.nodes);
      setEdges(workflowData.edges);
      setWorkflowId(null);
      await handleSaveWorkflow();

      addExecutionLog({ level: 'success', message: 'Workflow imported successfully!' });
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`Failed to import workflow: ${error.message}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative h-full">
      {/* Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-dark-bg border border-dark-border text-dark-text hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-dark-bg border border-dark-border text-dark-text hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* New Workflow */}
        <button
          onClick={clearWorkflow}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-dark-bg border border-dark-border text-dark-text hover:bg-dark-border"
          title="New Workflow"
        >
          <FilePlus className="w-4 h-4" />
        </button>

        <button
          onClick={handleSaveWorkflow}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-dark-bg border border-dark-border text-dark-text hover:bg-dark-border"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleRunWorkflow}
          disabled={isRunning || nodes.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isRunning || nodes.length === 0
            ? 'bg-wy-500/50 text-white/50 cursor-not-allowed'
            : 'bg-wy-500 text-white hover:bg-wy-600'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isRunning
              ? 'bg-green-500/50 text-white/50 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            title={`Run ${selectedNodeIds.length} selected node(s) with dependencies`}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Run Selected ({selectedNodeIds.length})
          </button>
        )}

        {/* Export Button */}
        <button
          onClick={handleExportWorkflow}
          disabled={nodes.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-dark-bg border border-dark-border text-dark-text hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export as JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-dark-bg border border-dark-border text-dark-text hover:bg-dark-border"
          title="Import from JSON"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportWorkflow}
          className="hidden"
        />
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
          style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' },
        }}
        fitView
        minZoom={0.1}
        maxZoom={4}
        className="bg-dark-bg"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          color="#3a3a3a"
        />
        <Controls className="bg-dark-surface border-dark-border fill-dark-text" />
        <MiniMap
          nodeColor={() => '#6366f1'}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="bg-dark-surface border-dark-border"
        />
      </ReactFlow>
    </div>
  );
}
