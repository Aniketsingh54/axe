import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';

interface TextNodeData {
  text: string;
  connected?: boolean;
  isRunning?: boolean;
}

/**
 * Text Node - Simple text input with textarea
 * Output: text data
 * No input handles - only outputs
 */
const TextNode = memo(({ id, data, selected }: NodeProps<TextNodeData>) => {
  const { text = '', connected = false, isRunning = false } = data || {};

  return (
    <BaseNode id={id} title="Text" icon={<Type className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* Output Handle - Right side only */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div>
        <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Content</label>
        <textarea
          className="w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted focus:border-wy-500"
          rows={3}
          value={text}
          onChange={() => { }}
          placeholder="Enter your text here..."
        />
      </div>
    </BaseNode>
  );
});

TextNode.displayName = 'TextNode';
export default TextNode;