'use client';

import React, { useCallback, useState } from 'react';
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
} from '@xyflow/react';
import { useStore } from '@/hooks/useStore';
import { nodeTypes } from './config';
import { Play, Square, Save, Loader2 } from 'lucide-react';

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
    refreshHistory
  } = useStore();
  const { screenToFlowPosition } = useReactFlow();
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((prevEdges) => addEdge(connection, prevEdges));
    },
    [setEdges]
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

      if (!response.ok) throw new Error('Failed to save');

      const savedWorkflow = await response.json();
      setWorkflowId(savedWorkflow.id);
      // alert('Workflow saved!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (isRunning) return;

    // Auto-save before running
    await handleSaveWorkflow();

    setIsRunning(true);

    // Set all to running visual state (optional, or engine handles it)
    nodes.forEach(node => {
      updateNodeData(node.id, { isRunning: true, error: undefined, output: undefined });
    });

    try {
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId, // Pass the ID we just saved (or null if save failed, but handled above)
          nodes,
          edges
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Workflow execution result:', result);
      refreshHistory(); // Refresh history panel

      // Update nodes with results
      if (result.results) {
        result.results.forEach((nodeResult: any) => {
          updateNodeData(nodeResult.nodeId, {
            isRunning: false,
            output: nodeResult.outputs?.output,
            error: nodeResult.error,
          });
        });
      }

    } catch (error: any) {
      console.error('Error running workflow:', error);
      alert(`Execution failed: ${error.message}`);
      // Reset running state
      nodes.forEach(node => {
        updateNodeData(node.id, { isRunning: false });
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="relative h-full">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
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
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
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