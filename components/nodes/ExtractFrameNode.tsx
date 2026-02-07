import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Film } from 'lucide-react';
import BaseNode from './BaseNode';

interface ExtractFrameNodeData {
  timestamp?: string;
  connectedVideo?: boolean;
  connectedTimestamp?: boolean;
  isRunning?: boolean;
  output?: string;
}

/**
 * Extract Frame from Video Node - FFmpeg via Trigger.dev
 * Input Handles (2):
 *   1. video_url - Required, accepts video types (mp4, mov, webm, m4v)
 *   2. timestamp - Optional, seconds or "50%" for percentage, default 0
 * Output Handle (1):
 *   - output - Extracted frame image URL (jpg/png)
 */
const ExtractFrameNode = memo(({ id, data, selected }: NodeProps<ExtractFrameNodeData>) => {
  const {
    timestamp = '0',
    connectedVideo = false,
    connectedTimestamp = false,
    isRunning = false,
    output = ''
  } = data || {};

  return (
    <BaseNode id={id} title="Extract Frame" icon={<Film className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* 2 Input Handles - Left side */}
      <Handle type="target" position={Position.Left} id="video_url" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '35%' }} />
      <Handle type="target" position={Position.Left} id="timestamp" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '65%' }} />

      {/* Output Handle */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div className="space-y-1.5">
        {/* Video URL indicator */}
        <div>
          <label className="text-[9px] text-dark-text-muted flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            Video URL *
          </label>
          <div className={`p-1 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text-muted ${connectedVideo ? 'border-wy-500' : ''}`}>
            {connectedVideo ? "◀ Video connected" : "Connect video node →"}
          </div>
        </div>

        {/* Timestamp input */}
        <div>
          <label className="text-[9px] text-dark-text-muted flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            Timestamp
          </label>
          <input
            type="text"
            className={`w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedTimestamp ? 'opacity-50 cursor-not-allowed' : ''}`}
            value={timestamp}
            placeholder={connectedTimestamp ? "◀ Connected" : "e.g. 5.5 or 50%"}
            disabled={connectedTimestamp}
            onChange={() => { }}
          />
        </div>

        {/* Output preview */}
        {output && (
          <div className="mt-1 p-1 bg-wy-500/10 border border-wy-500/30 rounded">
            <img src={output} alt="Extracted frame" className="w-full h-12 object-cover rounded" />
          </div>
        )}
      </div>
    </BaseNode>
  );
});

ExtractFrameNode.displayName = 'ExtractFrameNode';
export default ExtractFrameNode;