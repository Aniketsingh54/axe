'use client';

import React from 'react';
import {
  Type,
  Image,
  Video,
  Sparkles,
  Crop,
  Film,
  FileDown
} from 'lucide-react';

import WorkflowList from './WorkflowList';
import { useStore } from '@/hooks/useStore';
import sampleWorkflow from '@/samples/product-marketing-workflow.json';

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
      className="group min-h-[88px] flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-md border border-dark-border bg-[#232632] hover:border-white/30 hover:bg-[#2a2e3a] cursor-grab transition-colors"
      draggable
      onDragStart={(event) => onDragStart(event, nodeType)}
    >
      <div className="p-1.5 rounded-md text-white/80 group-hover:text-white">
        {icon}
      </div>
      <span className="text-[12px] font-medium text-center leading-snug text-white/88">{label}</span>
    </div>
  );
};

export default function NodePalette() {
  const { setNodes, setEdges, setWorkflowId } = useStore();

  const handleLoadSample = () => {
    // Clear existing workflow and load sample
    setWorkflowId(null);
    setNodes(sampleWorkflow.nodes);
    setEdges(sampleWorkflow.edges);
  };

  return (
    <div className="px-3 py-3 overflow-y-auto h-full">
      <div className="mb-4">
        <div className="h-8 rounded-md border border-dark-border bg-[#1a1d25] px-2.5 text-[12px] text-white/60 flex items-center">
          Search
        </div>
      </div>

      <h2 className="text-[26px] font-semibold text-white tracking-tight mb-3">Quick access</h2>

      <div className="grid grid-cols-2 gap-2">
        <DraggableNodeButton
          icon={<Type className="w-4 h-4" />}
          label="Prompt"
          nodeType="text"
        />

        <DraggableNodeButton
          icon={<Image className="w-4 h-4" />}
          label="Import"
          nodeType="upload-image"
        />

        <DraggableNodeButton
          icon={<Video className="w-4 h-4" />}
          label="Export"
          nodeType="upload-video"
        />

        <DraggableNodeButton
          icon={
            <Sparkles className="w-4 h-4 text-[#dfe887]" />
          }
          label="Preview"
          nodeType="llm"
        />

        <DraggableNodeButton
          icon={<Crop className="w-4 h-4" />}
          label="Crop"
          nodeType="crop-image"
        />

        <DraggableNodeButton
          icon={<Film className="w-4 h-4" />}
          label="Extract"
          nodeType="extract-frame"
        />
      </div>

      <div className="my-4">
        <button
          onClick={handleLoadSample}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md border border-dark-border bg-[#232632] hover:bg-[#2a2e3a] text-white/90 transition-colors text-[12px]"
        >
          <FileDown className="w-4 h-4" />
          <span className="font-medium">Load Sample Workflow</span>
        </button>
      </div>

      <div className="my-4 border-t border-dark-border/80" />

      <WorkflowList />
    </div>
  );
}
