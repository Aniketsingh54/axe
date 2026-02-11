'use client';

import { memo, useRef, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Video, Upload, X, Loader2 } from 'lucide-react';
import BaseNode, { type NodeRunStatus } from './BaseNode';
import { useStore } from '@/hooks/useStore';

interface UploadVideoNodeData extends Record<string, unknown> {
  videoUrl?: string;
  fileName?: string;
  label?: string;
  isRunning?: boolean;
  runStatus?: NodeRunStatus;
  isUploading?: boolean;
}

type UploadVideoNodeType = Node<UploadVideoNodeData>;

/**
 * Upload Video Node - File upload via Transloadit
 * Accepts: mp4, mov, webm, m4v
 * Shows video player preview after upload
 * Output: Video URL
 */
const UploadVideoNode = memo(({ id, data, selected }: NodeProps<UploadVideoNodeType>) => {
  const videoUrl = (data.videoUrl as string) || '';
  const fileName = (data.fileName as string) || '';
  const label = (data.label as string) || 'Upload Video';
  const isRunning = (data.isRunning as boolean) || false;
  const runStatus = (data.runStatus as NodeRunStatus) || 'idle';
  const isUploading = (data.isUploading as boolean) || false;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const setPendingNodeRun = useStore((state) => state.setPendingNodeRun);

  const handleRunNode = useCallback(() => {
    setPendingNodeRun(id);
  }, [id, setPendingNodeRun]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid video file (mp4, mov, webm, m4v)');
      return;
    }

    // Start upload
    updateNodeData(id, { isUploading: true, fileName: file.name });
    setUploadProgress(0);

    try {
      const { uploadFile } = await import('@/lib/blob');
      const url = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      updateNodeData(id, {
        videoUrl: url,
        fileName: file.name,
        isUploading: false
      });
      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      updateNodeData(id, { isUploading: false });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Upload failed: ${errorMessage}`);
    }
  }, [id, updateNodeData]);

  const handleRemove = useCallback(() => {
    // Revoke object URL to free memory
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    updateNodeData(id, { videoUrl: '', fileName: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [id, videoUrl, updateNodeData]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <BaseNode title={label} icon={<Video className="w-3 h-3" />} selected={selected} isRunning={isRunning} runStatus={runStatus} onRunNode={handleRunNode}>
      {/* Output Handle - Right side only */}
      <Handle type="source" position={Position.Right} id="output" className="!bg-wy-500 !w-2 !h-2 !border-0" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-1 p-2">
          <Loader2 className="w-5 h-5 animate-spin text-wy-500" />
          <div className="text-[9px] text-dark-text-muted">Uploading... {Math.round(uploadProgress)}%</div>
          <div className="w-full h-1 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-wy-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : videoUrl ? (
        <div className="space-y-1 relative group">
          <video
            src={videoUrl}
            className="w-full h-20 object-cover rounded border border-dark-border"
            controls
            muted
          />
          <button
            onClick={handleRemove}
            className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-white" />
          </button>
          <div className="text-[8px] text-dark-text-muted truncate">{fileName}</div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className="w-full p-2 flex flex-col items-center gap-1 text-[10px] border border-dashed border-dark-border rounded bg-dark-bg text-dark-text-muted hover:border-wy-500 hover:text-wy-500 transition-colors"
        >
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
