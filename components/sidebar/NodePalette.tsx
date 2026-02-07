'use client';

import React from 'react';
import {
  Type,
  Image,
  Video,
  Sparkles,
  Crop,
  Film
} from 'lucide-react';

import WorkflowList from './WorkflowList';

interface DraggableNodeButtonProps {
  icon: React.ReactNode;
  label: string;
  nodeType: string;
}

const DraggableNodeButton = ({ icon, label, nodeType }: DraggableNodeButtonProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border border-dark-border bg-dark-bg hover:bg-dark-muted cursor-grab transition-colors"
      draggable
      onDragStart={(event) => onDragStart(event, nodeType)}
    >
      <div className="p-1.5 rounded-md bg-wy-600/20 text-wy-500">
        {icon}
      </div>
      <span className="text-sm font-medium text-dark-text">{label}</span>
    </div>
  );
};

export default function NodePalette() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-dark-text mb-4">Quick Access</h2>

      <div className="space-y-2">
        <DraggableNodeButton
          icon={<Type className="w-4 h-4" />}
          label="Text Node"
          nodeType="text"
        />

        <DraggableNodeButton
          icon={<Image className="w-4 h-4" />}
          label="Upload Image"
          nodeType="upload-image"
        />

        <DraggableNodeButton
          icon={<Video className="w-4 h-4" />}
          label="Upload Video"
          nodeType="upload-video"
        />

        <DraggableNodeButton
          icon={
            <div className="relative">
              <Sparkles className="w-4 h-4 text-wy-500" />
              <div className="absolute inset-0 rounded-full bg-wy-500 opacity-20 animate-pulse"></div>
            </div>
          }
          label="Run Any LLM"
          nodeType="llm"
        />

        <DraggableNodeButton
          icon={<Crop className="w-4 h-4" />}
          label="Crop Image"
          nodeType="crop-image"
        />

        <DraggableNodeButton
          icon={<Film className="w-4 h-4" />}
          label="Extract Frame"
          nodeType="extract-frame"
        />
      </div>

      <div className="my-6 border-t border-dark-border" />

      <WorkflowList />
    </div>
  );
}