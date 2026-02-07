import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Crop } from 'lucide-react';
import BaseNode from './BaseNode';

const CropImageNode = memo(({ id, data, selected }: NodeProps<{ xPercent?: number; yPercent?: number; widthPercent?: number; heightPercent?: number }>) => {
  const { xPercent = 0, yPercent = 0, widthPercent = 100, heightPercent = 100 } = data || {};

  return (
    <BaseNode id={id} title="Crop" icon={<Crop className="w-3 h-3" />} selected={selected}>
      <Handle type="target" position={Position.Left} id="image" className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />
      <div className="grid grid-cols-2 gap-1">
        <div>
          <label className="text-[8px] text-dark-text-muted">X %</label>
          <input type="number" className="w-full p-0.5 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text" value={xPercent} onChange={() => { }} />
        </div>
        <div>
          <label className="text-[8px] text-dark-text-muted">Y %</label>
          <input type="number" className="w-full p-0.5 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text" value={yPercent} onChange={() => { }} />
        </div>
        <div>
          <label className="text-[8px] text-dark-text-muted">Width %</label>
          <input type="number" className="w-full p-0.5 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text" value={widthPercent} onChange={() => { }} />
        </div>
        <div>
          <label className="text-[8px] text-dark-text-muted">Height %</label>
          <input type="number" className="w-full p-0.5 text-[10px] border rounded bg-dark-bg border-dark-border text-dark-text" value={heightPercent} onChange={() => { }} />
        </div>
      </div>
    </BaseNode>
  );
});

CropImageNode.displayName = 'CropImageNode';
export default CropImageNode;