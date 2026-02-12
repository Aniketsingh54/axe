'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Type,
  Image as ImageIcon,
  Video,
  Sparkles,
  Crop,
  Film,
  FileDown,
  Download,
  Upload,
  Search,
  FolderOpen
} from 'lucide-react';

import WorkflowList from './WorkflowList';
import { useStore } from '@/hooks/useStore';
import sampleWorkflow from '@/samples/product-marketing-workflow.json';

interface DraggableNodeButtonProps {
  icon: React.ReactNode;
  label: string;
  nodeType: string;
}

type LeftPanelTab = 'quick' | 'workflows' | 'json';

interface NodePaletteProps {
  activeTab: LeftPanelTab;
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

const NODE_ITEMS: DraggableNodeButtonProps[] = [
  { icon: <Type className="w-4 h-4" />, label: 'Text Node', nodeType: 'text' },
  { icon: <ImageIcon className="w-4 h-4" />, label: 'Upload Image', nodeType: 'upload-image' },
  { icon: <Video className="w-4 h-4" />, label: 'Upload Video', nodeType: 'upload-video' },
  { icon: <Sparkles className="w-4 h-4 text-[#dfe887]" />, label: 'Run Any LLM', nodeType: 'llm' },
  { icon: <Crop className="w-4 h-4" />, label: 'Crop Image', nodeType: 'crop-image' },
  { icon: <Film className="w-4 h-4" />, label: 'Extract Frame', nodeType: 'extract-frame' },
];

const JSON_TOOLS = [
  { id: 'export', label: 'Export Workflow JSON' },
  { id: 'import', label: 'Import Workflow JSON' },
];

const SAMPLE_MEDIA = {
  imageUrl: '/samples/sample-product.png',
  imageName: 'sample-product.png',
  videoUrl: '/samples/sample-demo.mp4',
  videoName: 'sample-demo.mp4',
};

export default function NodePalette({ activeTab }: NodePaletteProps) {
  const { nodes, edges, workflowId, workflowName, setNodes, setEdges, setWorkflowId, setWorkflowName, updateNodeData } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSample = () => {
    const toAbsoluteUrl = (value: string) => {
      if (!value) return '';
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      return new URL(value, window.location.origin).toString();
    };
    const isLocalSampleUrl = (value: string) => {
      if (!value) return false;
      if (value.startsWith('/samples/')) return true;
      try {
        const parsed = new URL(value);
        return parsed.origin === window.location.origin && parsed.pathname.startsWith('/samples/');
      } catch {
        return false;
      }
    };

    const uploadSampleAsset = async (nodeId: string, kind: 'image' | 'video', sourceUrl: string, fallbackName: string) => {
      const absoluteUrl = toAbsoluteUrl(sourceUrl);
      if (!isLocalSampleUrl(absoluteUrl)) return;

      updateNodeData(nodeId, { isUploading: true });
      try {
        const res = await fetch(absoluteUrl);
        if (!res.ok) throw new Error(`Failed to fetch sample asset (${res.status})`);

        const blob = await res.blob();
        const inferredName = absoluteUrl.split('/').pop() || fallbackName;
        const file = new File([blob], inferredName, {
          type: blob.type || (kind === 'image' ? 'image/png' : 'video/mp4'),
        });

        const { uploadFile } = await import('@/lib/blob');
        const uploadedUrl = await uploadFile(file);

        if (kind === 'image') {
          updateNodeData(nodeId, {
            imageUrl: uploadedUrl,
            fileName: inferredName,
            isUploading: false,
          });
        } else {
          updateNodeData(nodeId, {
            videoUrl: uploadedUrl,
            fileName: inferredName,
            isUploading: false,
          });
        }
      } catch (error) {
        console.error(`Sample ${kind} auto-upload failed for node ${nodeId}:`, error);
        updateNodeData(nodeId, { isUploading: false });
      }
    };

    // Clear existing workflow and load sample with media preloaded.
    const hydratedSampleNodes = sampleWorkflow.nodes.map((node) => {
      const nodeData = (node.data ?? {}) as Record<string, unknown>;
      if (node.type === 'upload-image') {
        const imageValue = (nodeData.imageUrl as string) || SAMPLE_MEDIA.imageUrl;
        return {
          ...node,
          data: {
            ...nodeData,
            imageUrl: toAbsoluteUrl(imageValue),
            fileName: (nodeData.fileName as string) || SAMPLE_MEDIA.imageName,
          },
        };
      }
      if (node.type === 'upload-video') {
        const videoValue = (nodeData.videoUrl as string) || SAMPLE_MEDIA.videoUrl;
        return {
          ...node,
          data: {
            ...nodeData,
            videoUrl: toAbsoluteUrl(videoValue),
            fileName: (nodeData.fileName as string) || SAMPLE_MEDIA.videoName,
          },
        };
      }
      return node;
    });

    setWorkflowId(null);
    setWorkflowName(sampleWorkflow.name || 'untitled');
    setNodes(hydratedSampleNodes);
    setEdges(sampleWorkflow.edges);

    // Auto-upload local sample assets to Blob so runs work from public URLs.
    hydratedSampleNodes.forEach((node) => {
      const nodeData = (node.data ?? {}) as Record<string, unknown>;
      if (node.type === 'upload-image') {
        const imageValue = (nodeData.imageUrl as string) || SAMPLE_MEDIA.imageUrl;
        const fileName = (nodeData.fileName as string) || SAMPLE_MEDIA.imageName;
        void uploadSampleAsset(node.id, 'image', imageValue, fileName);
      }
      if (node.type === 'upload-video') {
        const videoValue = (nodeData.videoUrl as string) || SAMPLE_MEDIA.videoUrl;
        const fileName = (nodeData.fileName as string) || SAMPLE_MEDIA.videoName;
        void uploadSampleAsset(node.id, 'video', videoValue, fileName);
      }
    });
  };

  const filteredNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NODE_ITEMS;
    return NODE_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredJsonTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return JSON_TOOLS;
    return JSON_TOOLS.filter((tool) => tool.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleExportJson = () => {
    const workflowData = {
      version: 1,
      name: workflowName?.trim() || (workflowId ? `workflow-${workflowId}` : 'untitled-workflow'),
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowData.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.nodes || !parsed.edges) {
        throw new Error('Invalid workflow file format');
      }
      setNodes(parsed.nodes);
      setEdges(parsed.edges);
      setWorkflowId(null);
      setWorkflowName((parsed.name as string) || 'untitled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Import failed: ${message}`);
    }

    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  return (
    <div className="px-3 py-3 overflow-y-auto h-full custom-scrollbar">
      <div className="mb-4">
        <label className="h-8 rounded-md border border-dark-border bg-[#1a1d25] px-2.5 text-[12px] text-white/60 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-white/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'workflows' ? 'Search workflows' : activeTab === 'json' ? 'Search tools' : 'Search nodes'}
            className="bg-transparent outline-none border-0 w-full text-white/85 placeholder:text-white/40"
          />
        </label>
      </div>

      {activeTab === 'quick' && (
        <>
          <h2 className="text-[26px] font-semibold text-white tracking-tight mb-3">Quick access</h2>
          {filteredNodes.length === 0 ? (
            <div className="rounded-md border border-dashed border-dark-border bg-[#1b1f2a] p-3 text-[11px] text-white/55">
              No nodes match your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredNodes.map((item) => (
                <DraggableNodeButton key={item.nodeType} {...item} />
              ))}
            </div>
          )}

          <div className="my-4">
            <button
              onClick={handleLoadSample}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md border border-dark-border bg-[#232632] hover:bg-[#2a2e3a] text-white/90 transition-colors text-[12px]"
            >
              <FileDown className="w-4 h-4" />
              <span className="font-medium">Load Sample Workflow</span>
            </button>
          </div>
        </>
      )}

      {activeTab === 'workflows' && (
        <>
          <h2 className="text-[24px] font-semibold text-white tracking-tight mb-3">Workflows</h2>
          <WorkflowList searchQuery={searchQuery} />
        </>
      )}

      {activeTab === 'json' && (
        <>
          <h2 className="text-[24px] font-semibold text-white tracking-tight mb-3">JSON Tools</h2>
          <div className="space-y-2">
            {filteredJsonTools.length === 0 ? (
              <div className="rounded-md border border-dashed border-dark-border bg-[#1b1f2a] p-3 text-[11px] text-white/55">
                No tools match your search.
              </div>
            ) : (
              <>
                {filteredJsonTools.some((tool) => tool.id === 'export') && (
                  <button
                    onClick={handleExportJson}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md border border-dark-border bg-[#232632] hover:bg-[#2a2e3a] text-white/90 transition-colors text-[12px]"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Export Workflow JSON</span>
                  </button>
                )}
                {filteredJsonTools.some((tool) => tool.id === 'import') && (
                  <button
                    onClick={() => jsonInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md border border-dark-border bg-[#232632] hover:bg-[#2a2e3a] text-white/90 transition-colors text-[12px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">Import Workflow JSON</span>
                  </button>
                )}
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
                <div className="rounded-md border border-dashed border-dark-border bg-[#1b1f2a] p-3 text-[11px] text-white/55">
                  <div className="flex items-center gap-2 mb-1 text-white/75">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Tip</span>
                  </div>
                  Use import/export here to move workflows across environments.
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
