import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import BaseNode from './BaseNode';

interface LLMNodeData {
  model?: string;
  systemPrompt?: string;
  userMessage?: string;
  connectedSystem?: boolean;
  connectedUser?: boolean;
  connectedImages?: boolean;
  output?: string;
  isRunning?: boolean;
}

/**
 * LLM Node - Run Any LLM
 * Input Handles (3):
 *   1. system_prompt - from Text Node (optional)
 *   2. user_message - from Text Node (required)
 *   3. images - from Image Node(s) (optional, supports multiple)
 * Output Handle (1):
 *   - output - Text response from LLM
 * Results displayed directly on node (not separate output node)
 */
const LLMNode = memo(({ id, data, selected }: NodeProps<LLMNodeData>) => {
  const {
    model = 'gemini-1.5-pro',
    systemPrompt = '',
    userMessage = '',
    connectedSystem = false,
    connectedUser = false,
    connectedImages = false,
    output = '',
    isRunning = false
  } = data || {};

  return (
    <BaseNode id={id} title="Run Any LLM" icon={<Sparkles className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* 3 Input Handles - Left side */}
      <Handle type="target" position={Position.Left} id="system_prompt" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '25%' }} />
      <Handle type="target" position={Position.Left} id="user_message" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '50%' }} />
      <Handle type="target" position={Position.Left} id="images" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '75%' }} />

      {/* Output Handle - Right side */}
      <Handle type="source" position={Position.Right} id="output" className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div className="space-y-1.5">
        {/* Model Selector */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Model</label>
          <select className="w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text" value={model} onChange={() => { }}>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          </select>
        </div>

        {/* System Prompt */}
        <div className="relative">
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            System Prompt
          </label>
          <textarea
            className={`w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={1}
            value={systemPrompt}
            placeholder={connectedSystem ? "◀ Connected" : "You are a helpful..."}
            disabled={connectedSystem}
            onChange={() => { }}
          />
        </div>

        {/* User Message (Required) */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            User Message *
          </label>
          <textarea
            className={`w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedUser ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={1}
            value={userMessage}
            placeholder={connectedUser ? "◀ Connected" : "Your question..."}
            disabled={connectedUser}
            onChange={() => { }}
          />
        </div>

        {/* Images indicator */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            Images (optional)
          </label>
          <div className={`p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text-muted ${connectedImages ? 'border-wy-500' : ''}`}>
            {connectedImages ? "◀ Images connected" : "Connect image nodes →"}
          </div>
        </div>

        {/* Result Display - directly on node per spec */}
        {output && (
          <div className="mt-2 p-1.5 bg-wy-500/10 border border-wy-500/30 rounded">
            <label className="text-[9px] text-wy-400 uppercase tracking-wide">Output →</label>
            <div className="text-[10px] text-dark-text mt-0.5 max-h-16 overflow-y-auto">
              {output}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
});

LLMNode.displayName = 'LLMNode';
export default LLMNode;