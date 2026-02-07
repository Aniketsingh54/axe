'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';
import { useStore } from '@/hooks/useStore';

interface TextNodeData extends Record<string, unknown> {
  text?: string;
  isRunning?: boolean;
}

type TextNodeType = Node<TextNodeData>;

/**
 * Text Node - Simple text input
 * No inputs, only output
 * Output: The text content
 */
const TextNode = memo(({ id, data, selected }: NodeProps<TextNodeType>) => {
  const text = (data.text as string) || '';
  const isRunning = (data.isRunning as boolean) || false;
  const updateNodeData = useStore((state) => state.updateNodeData);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { text: e.target.value });
  }, [id, updateNodeData]);

  return (
    <BaseNode id={id} title="Text" icon={<Type className="w-3 h-3" />} selected={selected} isRunning={isRunning}>
      {/* Output Handle - Right side only */}
      <Handle type="source" position={Position.Right} className="!bg-wy-500 !w-2 !h-2 !border-0" />

      <div>
        <label className="text-[9px] text-dark-text-muted uppercase tracking-wide">Content</label>
        <textarea
          className="w-full p-1.5 text-[10px] border rounded resize-none bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-muted focus:border-wy-500 focus:outline-none transition-colors"
          rows={3}
          value={text}
          onChange={handleTextChange}
          placeholder="Enter your text here..."
        />
      </div>
    </BaseNode>
  );
});

TextNode.displayName = 'TextNode';
export default TextNode;