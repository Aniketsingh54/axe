import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Video } from 'lucide-react';
import BaseNode from './BaseNode';

const UploadVideoNode = memo(({ id, data, selected }: NodeProps<{ videoUrl?: string }>) => {
  const { videoUrl = '' } = data || {};

  return (
    <BaseNode id={id} title="Video" icon={<Video className="w-3 h-3" />} selected={selected}>
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />
      {videoUrl ? (
        <video src={videoUrl} className="w-full h-10 object-cover rounded" />
      ) : (
        <button className="w-full p-1 text-[10px] border border-dashed border-dark-border rounded bg-dark-bg text-dark-text-muted hover:border-wy-500">+ Upload</button>
      )}
    </BaseNode>
  );
});

UploadVideoNode.displayName = 'UploadVideoNode';
export default UploadVideoNode;