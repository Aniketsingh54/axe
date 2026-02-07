import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Image, Upload } from 'lucide-react';
import BaseNode from './BaseNode';

interface UploadImageNodeData {
  imageUrl?: string;
  isRunning?: boolean;
}

/**
 * Upload Image Node - File upload via Transloadit
 * Accepts: jpg, jpeg, png, webp, gif
 * Shows image preview after upload
 * Output: Image URL
 */
const UploadImageNode = memo(({ id, data, selected }: NodeProps<UploadImageNodeData>) => {
  const { imageUrl = '', isRunning = false } = data || {};

  return (
    <BaseNode id={id} title="Upload Image" icon={<Image className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* Output Handle - Right side only */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      {imageUrl ? (
        <div className="space-y-1">
          <img src={imageUrl} alt="Uploaded" className="w-full h-16 object-cover rounded border border-dark-border" />
          <div className="text-[8px] text-dark-text-muted truncate">{imageUrl}</div>
        </div>
      ) : (
        <button className="w-full p-2 flex flex-col items-center gap-1 text-[10px] border border-dashed border-dark-border rounded bg-dark-bg text-dark-text-muted hover:border-wy-500 hover:text-wy-500 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Click to upload</span>
          <span className="text-[8px]">jpg, png, webp, gif</span>
        </button>
      )}
    </BaseNode>
  );
});

UploadImageNode.displayName = 'UploadImageNode';
export default UploadImageNode;