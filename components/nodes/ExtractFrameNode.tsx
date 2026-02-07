import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Film } from 'lucide-react';
import BaseNode from './BaseNode';

const ExtractFrameNode = memo(({ id, data, selected }: NodeProps<{ timestamp?: string; connectedTimestamp?: boolean }>) => {
  const { timestamp = '0', connectedTimestamp = false } = data || {};

  return (
    <BaseNode id={id} title="Extract Frame" icon={<Film className="w-3 h-3" />} selected={selected}>
      <Handle type="target" position={Position.Left} id="video" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" style={{ top: '40%' }} />
      <Handle type="target" position={Position.Left} id="timestamp" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" style={{ top: '70%' }} />
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />
      <div>
        <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Timestamp (seconds)</label>
        <input
          type="text"
          className={`w-full p-1 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted ${connectedTimestamp ? 'opacity-50' : ''}`}
          value={timestamp}
          placeholder={connectedTimestamp ? "◀ Connected" : "e.g. 5.5"}
          disabled={connectedTimestamp}
          onChange={() => { }}
        />
      </div>
    </BaseNode>
  );
});

ExtractFrameNode.displayName = 'ExtractFrameNode';
export default ExtractFrameNode;