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
import { Play, Square } from 'lucide-react';

import '@xyflow/react/dist/style.css';

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    setEdges,
    updateNodeData
  } = useStore();
  const { screenToFlowPosition } = useReactFlow();
  const [isRunning, setIsRunning] = useState(false);

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
            model: 'gemini-1.5-pro',
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

  const handleRunWorkflow = async () => {
    if (isRunning) return; // Prevent multiple simultaneous runs

    setIsRunning(true);

    // Toggle all nodes to running state
    nodes.forEach(node => {
      updateNodeData(node.id, { isRunning: true });
    });

    try {
      // Simulate the workflow execution by calling the trigger API
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
          edges 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Workflow execution result:', result);
    } catch (error) {
      console.error('Error running workflow:', error);
    } finally {
      // Reset running state after a delay
      setTimeout(() => {
        // Toggle all nodes back to non-running state
        nodes.forEach(node => {
          updateNodeData(node.id, { isRunning: false });
        });
        setIsRunning(false);
      }, 2000); // 2 second delay to match the simulated task duration
    }
  };

  return (
    <div className="relative h-full">
      {/* Run Workflow Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleRunWorkflow}
          disabled={isRunning || nodes.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isRunning || nodes.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-4 h-4" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Workflow
            </>
          )}
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
        <Controls />
        <MiniMap
          nodeColor={() => '#6366f1'}
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}