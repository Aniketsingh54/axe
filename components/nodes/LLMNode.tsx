'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node, useHandleConnections } from '@xyflow/react';
import { Sparkles, Loader2 } from 'lucide-react';
import BaseNode, { type NodeRunStatus } from './BaseNode';
import { useStore } from '@/hooks/useStore';

interface LLMNodeData extends Record<string, unknown> {
  model?: string;
  label?: string;
  systemPrompt?: string;
  userMessage?: string;
  output?: string;
  isRunning?: boolean;
  runStatus?: NodeRunStatus;
  error?: string;
}

type LLMNodeType = Node<LLMNodeData>;

/**
 * LLM Node - Run Any LLM (Gemini)
 * Inputs: system_prompt, user_message, images
 * Output: Generated text
 */
const LLMNode = memo(({ id, data, selected }: NodeProps<LLMNodeType>) => {
  const model = (data.model as string) || 'gemini-1.5-flash';
  const label = (data.label as string) || 'Run Any LLM';
  const systemPrompt = (data.systemPrompt as string) || '';
  const userMessage = (data.userMessage as string) || '';
  const output = (data.output as string) || '';
  const isRunning = (data.isRunning as boolean) || false;
  const runStatus = (data.runStatus as NodeRunStatus) || 'idle';
  const error = (data.error as string) || '';
  const workflowIsRunning = useStore((state) => state.isRunning);

  const updateNodeData = useStore((state) => state.updateNodeData);
  const setPendingNodeRun = useStore((state) => state.setPendingNodeRun);

  const handleRunNode = useCallback(() => {
    setPendingNodeRun(id);
  }, [id, setPendingNodeRun]);

  // Check which handles are connected
  const systemConnections = useHandleConnections({ type: 'target', id: 'system_prompt' });
  const userConnections = useHandleConnections({ type: 'target', id: 'user_message' });
  const imageConnections = useHandleConnections({ type: 'target', id: 'images' });

  const connectedSystem = systemConnections.length > 0;
  const connectedUser = userConnections.length > 0;
  const connectedImages = imageConnections.length > 0;

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { model: e.target.value });
  }, [id, updateNodeData]);

  const handleSystemPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { systemPrompt: e.target.value });
  }, [id, updateNodeData]);

  const handleUserMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { userMessage: e.target.value });
  }, [id, updateNodeData]);

  return (
    <BaseNode title={label} icon={<Sparkles className="w-3 h-3" />} selected={selected} isRunning={isRunning} runStatus={runStatus} onRunNode={handleRunNode} disableRun={workflowIsRunning && !isRunning}>
      {/* Input Handles - Left side */}
      <Handle
        type="target"
        position={Position.Left}
        id="system_prompt"
        className="!bg-wy-500 !w-2 !h-2 !border-0"
        style={{ top: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="user_message"
        className="!bg-wy-500 !w-2 !h-2 !border-0"
        style={{ top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        className="!bg-wy-500 !w-2 !h-2 !border-0"
        style={{ top: '75%' }}
      />

      {/* Output Handle - Right side */}
      <Handle type="source" position={Position.Right} id="output" className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div className="space-y-1.5">
        {/* Model Selector */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Model</label>
          <select
            className="w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text focus:border-wy-500 focus:outline-none"
            value={model}
            onChange={handleModelChange}
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          </select>
        </div>

        {/* System Prompt */}
        <div className="relative">
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${connectedSystem ? 'bg-green-500' : 'bg-wy-500'}`}></span>
            System Prompt
          </label>
          <textarea
            className={`w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted focus:border-wy-500 focus:outline-none ${connectedSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={1}
            value={systemPrompt}
            placeholder={connectedSystem ? "◀ Connected" : "You are a helpful..."}
            disabled={connectedSystem}
            onChange={handleSystemPromptChange}
          />
        </div>

        {/* User Message */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${connectedUser ? 'bg-green-500' : 'bg-wy-500'}`}></span>
            User Message *
          </label>
          <textarea
            className={`w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted focus:border-wy-500 focus:outline-none ${connectedUser ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={1}
            value={userMessage}
            placeholder={connectedUser ? "◀ Connected" : "Your question..."}
            disabled={connectedUser}
            onChange={handleUserMessageChange}
          />
        </div>

        {/* Images */}
        <div>
          <label className="text-[9px] text-dark-text-muted uppercase tracking-wide flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${connectedImages ? 'bg-green-500' : 'bg-wy-500/50'}`}></span>
            Images (optional)
          </label>
          <div className={`p-1 text-[10px] border rounded bg-dark-bg ${connectedImages ? 'border-green-500/50 text-green-400' : 'border-dark-border text-dark-text-muted'}`}>
            {connectedImages ? "◀ Images connected" : "Connect image nodes →"}
          </div>
        </div>

        {/* Running State */}
        {isRunning && (
          <div className="flex items-center gap-1.5 p-1.5 bg-wy-500/10 border border-wy-500/30 rounded">
            <Loader2 className="w-3 h-3 animate-spin text-wy-500" />
            <span className="text-[9px] text-wy-400">Generating...</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded">
            <div className="text-[9px] text-red-400 truncate">{error}</div>
          </div>
        )}

        {/* Output Display */}
        {output && !isRunning && (
          <div className="p-1.5 bg-wy-500/10 border border-wy-500/30 rounded">
            <label className="text-[9px] text-wy-400 uppercase tracking-wide">Output →</label>
            <div className="text-[10px] text-dark-text mt-0.5 max-h-20 overflow-y-auto whitespace-pre-wrap">
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
