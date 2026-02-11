import { memo, ReactNode } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeRunStatus = 'idle' | 'queued' | 'running' | 'success' | 'failed';

interface BaseNodeProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  selected?: boolean;
  isRunning?: boolean;
  runStatus?: NodeRunStatus;
  onRunNode?: () => void;
}

/**
 * BaseNode - Common wrapper for all node types
 * Handles: visual feedback for running state (pulsating glow)
 * Children: Custom content from each node type
 * Note: Handles are managed by individual nodes since each has different handle requirements
 */
const BaseNode = memo(({
  title,
  icon,
  children,
  selected = false,
  isRunning = false,
  runStatus = 'idle',
  onRunNode
}: BaseNodeProps) => {
  const effectiveStatus: NodeRunStatus = isRunning ? 'running' : runStatus;

  return (
    <div className={cn(
      "bg-dark-surface border rounded shadow-md w-44",
      selected ? "border-wy-500 ring-1 ring-wy-500/30" : "border-dark-border",
      effectiveStatus === 'queued' && "ring-1 ring-amber-500/40 border-amber-500/60",
      effectiveStatus === 'running' && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-dark-bg animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.65)]",
      effectiveStatus === 'success' && "ring-2 ring-emerald-500/70 shadow-[0_0_14px_rgba(16,185,129,0.3)] border-emerald-500/60",
      effectiveStatus === 'failed' && "ring-2 ring-red-500/70 shadow-[0_0_14px_rgba(239,68,68,0.3)] border-red-500/60",
      "text-dark-text"
    )}>
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-dark-border bg-dark-muted/30">
        <div className={cn("text-wy-400", isRunning && "animate-spin")}>{icon}</div>
        <span className="text-[11px] font-medium flex-1 truncate">{title}</span>
        {effectiveStatus === 'running' ? (
          <span className="text-[8px] text-indigo-400">Running</span>
        ) : effectiveStatus === 'success' ? (
          <span className="text-[8px] text-emerald-400">Done</span>
        ) : effectiveStatus === 'failed' ? (
          <span className="text-[8px] text-red-400">Failed</span>
        ) : effectiveStatus === 'queued' ? (
          <span className="text-[8px] text-amber-400">Queued</span>
        ) : (
          onRunNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunNode();
              }}
              className="p-0.5 rounded hover:bg-wy-500/20 text-dark-text-muted hover:text-wy-400 transition-colors"
              title="Run from here"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
          )
        )}
      </div>

      {/* Body - handles are placed by individual nodes */}
      <div className="p-1.5 relative">{children}</div>
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;
