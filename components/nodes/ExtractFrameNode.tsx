'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node, useHandleConnections } from '@xyflow/react';
import { Film, Loader2 } from 'lucide-react';
import BaseNode from './BaseNode';
import { useStore } from '@/hooks/useStore';

interface ExtractFrameNodeData extends Record<string, unknown> {
  timestamp?: number | string;
  output?: string;
  isRunning?: boolean;
  error?: string;
}

type ExtractFrameNodeType = Node<ExtractFrameNodeData>;

/**
 * Extract Frame Node - Extract a single frame from video
 * Inputs: video_url, timestamp
 * Output: Extracted frame image URL
 * 
 * Timestamp can be:
 * - A number (seconds): 5.5 means 5.5 seconds into the video
 * - A percentage string: "50%" means halfway through
 */
const ExtractFrameNode = memo(({ id, data, selected }: NodeProps<ExtractFrameNodeType>) => {
  const timestamp = (data.timestamp as number | string) || 0;
  const output = (data.output as string) || '';
  const isRunning = (data.isRunning as boolean) || false;
  const error = (data.error as string) || '';

  const updateNodeData = useStore((state) => state.updateNodeData);
  const setPendingNodeRun = useStore((state) => state.setPendingNodeRun);

  const handleRunNode = useCallback(() => {
    setPendingNodeRun(id);
  }, [id, setPendingNodeRun]);

  // Check which handles are connected
  const videoConnections = useHandleConnections({ type: 'target', id: 'video_url' });
  const timestampConnections = useHandleConnections({ type: 'target', id: 'timestamp' });

  const connectedVideo = videoConnections.length > 0;
  const connectedTimestamp = timestampConnections.length > 0;

  const handleTimestampChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow percentage strings like "50%"
    if (value.includes('%')) {
      updateNodeData(id, { timestamp: value });
    } else {
      updateNodeData(id, { timestamp: parseFloat(value) || 0 });
    }
  }, [id, updateNodeData]);

  return (
    <BaseNode id={id} title="Extract Frame" icon={<Film className="w-3 h-3" />} selected={selected} isRunning={isRunning} onRunNode={handleRunNode}>
      {/* Input Handles - Left side */}
      <Handle
        type="target"
        position={Position.Left}
        id="video_url"
        className="!bg-wy-500 !w-2 !h-2 !border-0"
        style={{ top: '35%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="timestamp"
        className="!bg-wy-500 !w-2 !h-2 !border-0"
        style={{ top: '65%' }}
      />

      {/* Output Handle - Right side */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div className="space-y-1.5">
        {/* Video Input */}
        <div>
          <label className="text-[9px] text-dark-text-muted flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${connectedVideo ? 'bg-green-500' : 'bg-wy-500'}`}></span>
            Video *
          </label>
          <div className={`p-1 text-[9px] border rounded bg-dark-bg ${connectedVideo ? 'border-green-500/50 text-green-400' : 'border-dark-border text-dark-text-muted'}`}>
            {connectedVideo ? "◀ Connected" : "Connect video →"}
          </div>
        </div>

        {/* Timestamp Input */}
        <div>
          <label className="text-[9px] text-dark-text-muted flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${connectedTimestamp ? 'bg-green-500' : 'bg-wy-500'}`}></span>
            Timestamp (sec or %)
          </label>
          <input
            type="text"
            className={`w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted focus:border-wy-500 focus:outline-none ${connectedTimestamp ? 'opacity-50 cursor-not-allowed' : ''}`}
            value={timestamp}
            placeholder="0 or 50%"
            disabled={connectedTimestamp}
            onChange={handleTimestampChange}
          />
          <div className="text-[8px] text-dark-text-muted mt-0.5">
            e.g., 5 for 5sec or 50% for halfway
          </div>
        </div>

        {/* Running State */}
        {isRunning && (
          <div className="flex items-center gap-1.5 p-1.5 bg-wy-500/10 border border-wy-500/30 rounded">
            <Loader2 className="w-3 h-3 animate-spin text-wy-500" />
            <span className="text-[9px] text-wy-400">Extracting...</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded">
            <div className="text-[9px] text-red-400 truncate">{error}</div>
          </div>
        )}

        {/* Output Preview */}
        {output && !isRunning && (
          <div className="space-y-1">
            <label className="text-[9px] text-wy-400 uppercase tracking-wide">Frame →</label>
            <img src={output} alt="Extracted frame" className="w-full h-12 object-cover rounded border border-wy-500/30" />
          </div>
        )}
      </div>
    </BaseNode>
  );
});

ExtractFrameNode.displayName = 'ExtractFrameNode';
export default ExtractFrameNode;