import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Image } from 'lucide-react';
import BaseNode from './BaseNode';

const UploadImageNode = memo(({ id, data, selected }: NodeProps<{ imageUrl?: string }>) => {
  const { imageUrl = '' } = data || {};

  return (
    <BaseNode id={id} title="Image" icon={<Image className="w-3 h-3" />} selected={selected}>
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-10 object-cover rounded" />
      ) : (
        <button className="w-full p-1 text-[10px] border border-dashed border-dark-border rounded bg-dark-bg text-dark-text-muted hover:border-wy-500">+ Upload</button>
      )}
    </BaseNode>
  );
});

UploadImageNode.displayName = 'UploadImageNode';
export default UploadImageNode;