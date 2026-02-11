'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node, useHandleConnections } from '@xyflow/react';
import { Crop, Loader2 } from 'lucide-react';
import BaseNode, { type NodeRunStatus } from './BaseNode';
import { useStore } from '@/hooks/useStore';

interface CropImageNodeData extends Record<string, unknown> {
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  label?: string;
  output?: string;
  isRunning?: boolean;
  runStatus?: NodeRunStatus;
  error?: string;
}

type CropImageNodeType = Node<CropImageNodeData>;

/**
 * Crop Image Node - Crop images using percentage-based coordinates
 * Inputs: image_url, x_percent, y_percent, width_percent, height_percent
 * Output: Cropped image URL
 */
const CropImageNode = memo(({ id, data, selected }: NodeProps<CropImageNodeType>) => {
  const xPercent = (data.xPercent as number) || 0;
  const yPercent = (data.yPercent as number) || 0;
  const widthPercent = (data.widthPercent as number) || 100;
  const heightPercent = (data.heightPercent as number) || 100;
  const label = (data.label as string) || 'Crop Image';
  const output = (data.output as string) || '';
  const isRunning = (data.isRunning as boolean) || false;
  const runStatus = (data.runStatus as NodeRunStatus) || 'idle';
  const error = (data.error as string) || '';

  const updateNodeData = useStore((state) => state.updateNodeData);
  const setPendingNodeRun = useStore((state) => state.setPendingNodeRun);

  const handleRunNode = useCallback(() => {
    setPendingNodeRun(id);
  }, [id, setPendingNodeRun]);

  // Check which handles are connected
  const imageConnections = useHandleConnections({ type: 'target', id: 'image_url' });
  const xConnections = useHandleConnections({ type: 'target', id: 'x_percent' });
  const yConnections = useHandleConnections({ type: 'target', id: 'y_percent' });
  const widthConnections = useHandleConnections({ type: 'target', id: 'width_percent' });
  const heightConnections = useHandleConnections({ type: 'target', id: 'height_percent' });

  const connectedImage = imageConnections.length > 0;
  const connectedX = xConnections.length > 0;
  const connectedY = yConnections.length > 0;
  const connectedWidth = widthConnections.length > 0;
  const connectedHeight = heightConnections.length > 0;

  const handleNumberChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { [field]: parseFloat(e.target.value) || 0 });
  }, [id, updateNodeData]);

  return (
    <BaseNode title={label} icon={<Crop className="w-3 h-3" />} selected={selected} isRunning={isRunning} runStatus={runStatus} onRunNode={handleRunNode}>
      {/* Input Handles - Left side */}
      <Handle type="target" position={Position.Left} id="image_url" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '15%' }} />
      <Handle type="target" position={Position.Left} id="x_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="y_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '45%' }} />
      <Handle type="target" position={Position.Left} id="width_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '60%' }} />
      <Handle type="target" position={Position.Left} id="height_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '75%' }} />

      {/* Output Handle - Right side */}
      <Handle type="source" position={Position.Right} id="output" className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div className="space-y-1">
        {/* Image Input */}
        <div>
          <label className="text-[9px] text-dark-text-muted flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${connectedImage ? 'bg-green-500' : 'bg-wy-500'}`}></span>
            Image *
          </label>
          <div className={`p-0.5 text-[9px] border rounded bg-dark-bg ${connectedImage ? 'border-green-500/50 text-green-400' : 'border-dark-border text-dark-text-muted'}`}>
            {connectedImage ? "◀ Connected" : "Connect image →"}
          </div>
        </div>

        {/* Crop Parameters Grid */}
        <div className="grid grid-cols-2 gap-1">
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className={`w-0.5 h-0.5 rounded-full ${connectedX ? 'bg-green-500' : 'bg-wy-500'}`}></span>
              X %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text focus:border-wy-500 focus:outline-none ${connectedX ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={xPercent}
              min={0}
              max={100}
              disabled={connectedX}
              onChange={handleNumberChange('xPercent')}
            />
          </div>
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className={`w-0.5 h-0.5 rounded-full ${connectedY ? 'bg-green-500' : 'bg-wy-500'}`}></span>
              Y %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text focus:border-wy-500 focus:outline-none ${connectedY ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={yPercent}
              min={0}
              max={100}
              disabled={connectedY}
              onChange={handleNumberChange('yPercent')}
            />
          </div>
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className={`w-0.5 h-0.5 rounded-full ${connectedWidth ? 'bg-green-500' : 'bg-wy-500'}`}></span>
              Width %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text focus:border-wy-500 focus:outline-none ${connectedWidth ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={widthPercent}
              min={0}
              max={100}
              disabled={connectedWidth}
              onChange={handleNumberChange('widthPercent')}
            />
          </div>
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className={`w-0.5 h-0.5 rounded-full ${connectedHeight ? 'bg-green-500' : 'bg-wy-500'}`}></span>
              Height %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text focus:border-wy-500 focus:outline-none ${connectedHeight ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={heightPercent}
              min={0}
              max={100}
              disabled={connectedHeight}
              onChange={handleNumberChange('heightPercent')}
            />
          </div>
        </div>

        {/* Running State */}
        {isRunning && (
          <div className="flex items-center gap-1.5 p-1.5 bg-wy-500/10 border border-wy-500/30 rounded">
            <Loader2 className="w-3 h-3 animate-spin text-wy-500" />
            <span className="text-[9px] text-wy-400">Processing...</span>
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
            <label className="text-[9px] text-wy-400 uppercase tracking-wide">Output →</label>
            <img src={output} alt="Cropped" className="w-full h-12 object-cover rounded border border-wy-500/30" />
          </div>
        )}
      </div>
    </BaseNode>
  );
});

CropImageNode.displayName = 'CropImageNode';
export default CropImageNode;
