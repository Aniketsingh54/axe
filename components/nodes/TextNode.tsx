import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';

interface TextNodeData {
  text: string;
  connected?: boolean;
}

const TextNode = memo(({ id, data, selected }: NodeProps<TextNodeData>) => {
  const { text = '', connected = false } = data || {};

  return (
    <BaseNode id={id} title="Text" icon={<Type className="w-3 h-3" />} selected={selected}>
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-1.5 !h-1.5 !border-0" />
      <div>
        <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Content</label>
        <textarea
          className="w-full p-1 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted focus:border-wy-500"
          rows={2}
          value={text}
          onChange={() => { }}
          disabled={connected}
          placeholder={connected ? "◀ Connected" : "Enter your text here..."}
        />
      </div>
    </BaseNode>
  );
});

TextNode.displayName = 'TextNode';
export default TextNode;