'use client';

import React, { useCallback, useState, useEffect } from 'react';
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

import '@xyflow/react/dist/style.css';

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

  // Track selected nodes
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeIds(selectedNodes.map(n => n.id));
  }, []);

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

  const handleSaveWorkflow = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workflowId,
          name: 'My Workflow',
          nodes,
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
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(`Failed to save workflow: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Single node execution (with dependencies)
  const handleRunSingleNode = async (targetNodeId: string) => {
    if (isRunning) return;

    await handleSaveWorkflow();

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    const targetNode = nodes.find(n => n.id === targetNodeId);
    const nodeName = targetNode?.type || 'Node';

    addExecutionLog({ level: 'info', message: `Running single node: ${nodeName} (with dependencies)...` });
    updateNodeData(targetNodeId, { isRunning: true, error: undefined, output: undefined });

    try {
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodes,
          edges,
          targetNodeId,
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
      console.log('Single node execution result:', result);
      refreshHistory();

      if (result.results) {
        result.results.forEach((nodeResult: any) => {
          const nodeInfo = nodes.find(n => n.id === nodeResult.nodeId);
          const name = nodeInfo?.type || nodeResult.nodeId;

          if (nodeResult.status === 'SUCCESS') {
            addExecutionLog({
              level: 'success',
              nodeId: nodeResult.nodeId,
              nodeName: name,
              message: `Completed successfully`,
            });
          } else if (nodeResult.status === 'FAILED') {
            addExecutionLog({
              level: 'error',
              nodeId: nodeResult.nodeId,
              nodeName: name,
              message: `Failed: ${nodeResult.error || 'Unknown error'}`,
            });
          }

          updateNodeData(nodeResult.nodeId, {
            isRunning: false,
            output: nodeResult.outputs?.output,
            error: nodeResult.error,
          });
        });
      }

      if (result.status === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Single node execution completed!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Execution finished with status: ${result.status}` });
      }

    } catch (error: any) {
      console.error('Error running single node:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      updateNodeData(targetNodeId, { isRunning: false, error: error.message });
    } finally {
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  // Run multiple selected nodes
  const handleRunSelectedNodes = async () => {
    if (isRunning || selectedNodeIds.length === 0) return;

    await handleSaveWorkflow();

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    addExecutionLog({ level: 'info', message: `Running ${selectedNodeIds.length} selected node(s) with dependencies...` });

    selectedNodeIds.forEach(nodeId => {
      updateNodeData(nodeId, { isRunning: true, error: undefined, output: undefined });
    });

    try {
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodes,
          edges,
          targetNodeIds: selectedNodeIds,
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
      console.log('Selected nodes execution result:', result);
      refreshHistory();

      if (result.results) {
        result.results.forEach((nodeResult: any) => {
          const nodeInfo = nodes.find(n => n.id === nodeResult.nodeId);
          const name = nodeInfo?.type || nodeResult.nodeId;

          if (nodeResult.status === 'SUCCESS') {
            addExecutionLog({
              level: 'success',
              nodeId: nodeResult.nodeId,
              nodeName: name,
              message: `Completed successfully`,
            });
          } else if (nodeResult.status === 'FAILED') {
            addExecutionLog({
              level: 'error',
              nodeId: nodeResult.nodeId,
              nodeName: name,
              message: `Failed: ${nodeResult.error || 'Unknown error'}`,
            });
          }

          updateNodeData(nodeResult.nodeId, {
            isRunning: false,
            output: nodeResult.outputs?.output,
            error: nodeResult.error,
          });
        });
      }

      if (result.status === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Selected nodes execution completed!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Execution finished with status: ${result.status}` });
      }

    } catch (error: any) {
      console.error('Error running selected nodes:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      selectedNodeIds.forEach(nodeId => {
        updateNodeData(nodeId, { isRunning: false, error: error.message });
      });
    } finally {
      setIsRunning(false);
      setGlobalIsRunning(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (isRunning) return;

    await handleSaveWorkflow();

    setIsRunning(true);
    setGlobalIsRunning(true);
    clearExecutionLogs();

    addExecutionLog({ level: 'info', message: `Starting workflow execution with ${nodes.length} nodes...` });

    nodes.forEach(node => {
      updateNodeData(node.id, { isRunning: true, error: undefined, output: undefined });
    });

    try {
      addExecutionLog({ level: 'info', message: 'Sending workflow to execution engine...' });

      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, nodes, edges }),
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
      console.log('Workflow execution result:', result);
      refreshHistory();

      if (result.results) {
        result.results.forEach((nodeResult: any) => {
          const nodeInfo = nodes.find(n => n.id === nodeResult.nodeId);
          const nodeName = nodeInfo?.type || nodeResult.nodeId;

          if (nodeResult.status === 'SUCCESS') {
            addExecutionLog({
              level: 'success',
              nodeId: nodeResult.nodeId,
              nodeName,
              message: `Completed successfully`,
            });
          } else if (nodeResult.status === 'FAILED') {
            addExecutionLog({
              level: 'error',
              nodeId: nodeResult.nodeId,
              nodeName,
              message: `Failed: ${nodeResult.error || 'Unknown error'}`,
            });
          }

          updateNodeData(nodeResult.nodeId, {
            isRunning: false,
            output: nodeResult.outputs?.output,
            error: nodeResult.error,
          });
        });
      }

      if (result.status === 'SUCCESS') {
        addExecutionLog({ level: 'success', message: `Workflow completed successfully!` });
      } else {
        addExecutionLog({ level: 'warn', message: `Workflow finished with status: ${result.status}` });
      }

    } catch (error: any) {
      console.error('Error running workflow:', error);
      addExecutionLog({ level: 'error', message: `Execution failed: ${error.message}` });
      alert(`Execution failed: ${error.message}`);
      nodes.forEach(node => {
        updateNodeData(node.id, { isRunning: false });
      });
    } finally {
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