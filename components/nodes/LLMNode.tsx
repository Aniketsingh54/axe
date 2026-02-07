import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import BaseNode from './BaseNode';

interface LLMNodeData {
  model?: string;
  systemPrompt?: string;
  userMessage?: string;
  imageUrl?: string;
  connectedSystem?: boolean;
  connectedUser?: boolean;
  connectedImage?: boolean;
  output?: string;
}

const LLMNode = memo(({ id, data, selected }: NodeProps<LLMNodeData>) => {
  const {
    model = 'gemini-1.5-pro',
    systemPrompt = '',
    userMessage = '',
    imageUrl = '',
    connectedSystem = false,
    connectedUser = false,
    connectedImage = false,
    output = ''
  } = data || {};

  return (
    <BaseNode id={id} title="LLM" icon={<Sparkles className="w-3 h-3" />} selected={selected}>
      {/* 3 Input Handles - Left side */}
      <Handle type="target" position={Position.Left} id="system" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" style={{ top: '28%' }} />
      <Handle type="target" position={Position.Left} id="user" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" style={{ top: '50%' }} />
      <Handle type="target" position={Position.Left} id="image" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" style={{ top: '72%' }} />

      {/* Output Handle - Right side */}
      <Handle type="source" position={Position.Right} id="output" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />

      <div className="space-y-1.5">
        {/* Model Select */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Model</label>
          <select className="w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text" value={model} onChange={() => { }}>
            <option value="gemini-1.5-pro">Gemini Pro</option>
            <option value="gemini-1.5-flash">Gemini Flash</option>
          </select>
        </div>

        {/* System Prompt Input */}
        <div className="relative">
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            System Prompt
          </label>
          <textarea
            className={`w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedSystem ? 'opacity-50' : ''}`}
            rows={1}
            value={systemPrompt}
            placeholder={connectedSystem ? "◀ Connected" : "You are a helpful..."}
            disabled={connectedSystem}
            onChange={() => { }}
          />
        </div>

        {/* User Prompt Input */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            User Prompt
          </label>
          <textarea
            className={`w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedUser ? 'opacity-50' : ''}`}
            rows={1}
            value={userMessage}
            placeholder={connectedUser ? "◀ Connected" : "Your question..."}
            disabled={connectedUser}
            onChange={() => { }}
          />
        </div>

        {/* Image Input */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            Image (optional)
          </label>
          <input
            type="text"
            className={`w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedImage ? 'opacity-50' : ''}`}
            value={imageUrl}
            placeholder={connectedImage ? "◀ Connected" : "Image URL..."}
            disabled={connectedImage}
            onChange={() => { }}
          />
        </div>

        {/* Output */}
        {output && (
          <div>
            <label className="text-[9px] text-wy-400 uppercase tracking-wide">Output →</label>
            <div className="p-1 bg-dark-muted rounded text-[9px] text-dark-text truncate">{output.slice(0, 40)}...</div>
          </div>
        )}
      </div>
    </BaseNode>
  );
});

LLMNode.displayName = 'LLMNode';
export default LLMNode;