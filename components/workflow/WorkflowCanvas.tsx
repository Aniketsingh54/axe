'use client';

import React, { useCallback } from 'react';
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

import '@xyflow/react/dist/style.css';

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    setEdges
  } = useStore();
  const { screenToFlowPosition } = useReactFlow();

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

  return (
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
  );
}