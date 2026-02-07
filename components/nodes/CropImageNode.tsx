import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Crop } from 'lucide-react';
import BaseNode from './BaseNode';

interface CropImageNodeData {
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  connectedImage?: boolean;
  connectedX?: boolean;
  connectedY?: boolean;
  connectedWidth?: boolean;
  connectedHeight?: boolean;
  isRunning?: boolean;
  output?: string;
}

/**
 * Crop Image Node - FFmpeg via Trigger.dev
 * Input Handles (5):
 *   1. image_url - Required, accepts image types
 *   2. x_percent - Optional (0-100), default 0
 *   3. y_percent - Optional (0-100), default 0
 *   4. width_percent - Optional (0-100), default 100
 *   5. height_percent - Optional (0-100), default 100
 * Output Handle (1):
 *   - output - Cropped Image URL
 */
const CropImageNode = memo(({ id, data, selected }: NodeProps<CropImageNodeData>) => {
  const {
    xPercent = 0,
    yPercent = 0,
    widthPercent = 100,
    heightPercent = 100,
    connectedImage = false,
    connectedX = false,
    connectedY = false,
    connectedWidth = false,
    connectedHeight = false,
    isRunning = false,
    output = ''
  } = data || {};

  return (
    <BaseNode id={id} title="Crop Image" icon={<Crop className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* 5 Input Handles - Left side */}
      <Handle type="target" position={Position.Left} id="image_url" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '20%' }} />
      <Handle type="target" position={Position.Left} id="x_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '35%' }} />
      <Handle type="target" position={Position.Left} id="y_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '50%' }} />
      <Handle type="target" position={Position.Left} id="width_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '65%' }} />
      <Handle type="target" position={Position.Left} id="height_percent" className="!bg-wy-500 !w-2 !h-2 !border-0" style={{ top: '80%' }} />

      {/* Output Handle */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div className="space-y-1">
        {/* Image Input indicator */}
        <div>
          <label className="text-[9px] text-dark-text-muted flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-wy-500"></span>
            Image *
          </label>
          <div className={`p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text-muted ${connectedImage ? 'border-wy-500' : ''}`}>
            {connectedImage ? "◀ Connected" : "Connect image →"}
          </div>
        </div>

        {/* Crop parameters in 2x2 grid */}
        <div className="grid grid-cols-2 gap-1">
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className="w-0.5 h-0.5 rounded-full bg-wy-500"></span>
              X %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text ${connectedX ? 'opacity-50' : ''}`}
              value={xPercent}
              disabled={connectedX}
              onChange={() => { }}
            />
          </div>
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className="w-0.5 h-0.5 rounded-full bg-wy-500"></span>
              Y %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text ${connectedY ? 'opacity-50' : ''}`}
              value={yPercent}
              disabled={connectedY}
              onChange={() => { }}
            />
          </div>
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className="w-0.5 h-0.5 rounded-full bg-wy-500"></span>
              Width %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text ${connectedWidth ? 'opacity-50' : ''}`}
              value={widthPercent}
              disabled={connectedWidth}
              onChange={() => { }}
            />
          </div>
          <div>
            <label className="text-[8px] text-dark-text-muted flex items-center gap-0.5">
              <span className="w-0.5 h-0.5 rounded-full bg-wy-500"></span>
              Height %
            </label>
            <input
              type="number"
              className={`w-full p-0.5 text-[9px] border rounded bg-dark-bg border-dark-border text-dark-text ${connectedHeight ? 'opacity-50' : ''}`}
              value={heightPercent}
              disabled={connectedHeight}
              onChange={() => { }}
            />
          </div>
        </div>

        {/* Output preview */}
        {output && (
          <div className="mt-1 p-1 bg-wy-500/10 border border-wy-500/30 rounded">
            <img src={output} alt="Cropped" className="w-full h-12 object-cover rounded" />
          </div>
        )}
      </div>
    </BaseNode>
  );
});

CropImageNode.displayName = 'CropImageNode';
export default CropImageNode;