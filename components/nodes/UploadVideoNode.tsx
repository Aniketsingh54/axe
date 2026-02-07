import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Video, Upload } from 'lucide-react';
import BaseNode from './BaseNode';

interface UploadVideoNodeData {
  videoUrl?: string;
  isRunning?: boolean;
}

/**
 * Upload Video Node - File upload via Transloadit
 * Accepts: mp4, mov, webm, m4v
 * Shows video player preview after upload
 * Output: Video URL
 */
const UploadVideoNode = memo(({ id, data, selected }: NodeProps<UploadVideoNodeData>) => {
  const { videoUrl = '', isRunning = false } = data || {};

  return (
    <BaseNode id={id} title="Upload Video" icon={<Video className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* Output Handle - Right side only */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      {videoUrl ? (
        <div className="space-y-1">
          <video src={videoUrl} className="w-full h-16 object-cover rounded border border-dark-border" controls />
          <div className="text-[8px] text-dark-text-muted truncate">{videoUrl}</div>
        </div>
      ) : (
        <button className="w-full p-2 flex flex-col items-center gap-1 text-[10px] border border-dashed border-dark-border rounded bg-dark-bg text-dark-text-muted hover:border-wy-500 hover:text-wy-500 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Click to upload</span>
          <span className="text-[8px]">mp4, mov, webm, m4v</span>
        </button>
      )}
    </BaseNode>
  );
});

UploadVideoNode.displayName = 'UploadVideoNode';
export default UploadVideoNode;