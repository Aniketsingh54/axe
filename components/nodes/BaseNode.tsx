import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  selected?: boolean;
}

const BaseNode = memo(({ id, title, icon, children, selected = false }: BaseNodeProps) => {
  return (
    <div className={cn(
      "bg-dark-surface border rounded shadow-md w-44",
      selected ? "border-wy-500 ring-1 ring-wy-500/30" : "border-dark-border",
      "text-dark-text"
    )}>
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-dark-border bg-dark-muted/30">
        <div className="text-wy-400">{icon}</div>
        <span className="text-[11px] font-medium">{title}</span>
      </div>

      {/* Body */}
      <div className="p-1.5">{children}</div>
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;