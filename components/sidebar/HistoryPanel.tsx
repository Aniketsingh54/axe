'use client';

import { useEffect, useState } from 'react';
import { Clock, RotateCcw, Play, FileText, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';

interface NodeResult {
  id: string;
  nodeId: string;
  nodeType: string;
  status: 'SUCCESS' | 'FAILED';
  output: any;
  error?: string;
  startedAt: string;
  endedAt: string;
}

interface Run {
  id: string;
  workflowId: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PARTIAL';
  createdAt: string;
  duration: number;
  triggerType: string;
  results: NodeResult[];
}

export default function HistoryPanel() {
  const { workflowId, historyTrigger } = useStore();
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!workflowId) return;
    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [workflowId, historyTrigger]);

  const toggleExpand = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'border-green-800/50 bg-green-900/10';
      case 'FAILED': return 'border-red-800/50 bg-red-900/10';
      case 'RUNNING': return 'border-wy-500/50 bg-wy-500/10';
      default: return 'border-dark-border bg-dark-bg';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <span className="text-green-400 bg-green-900/30 px-2 py-0.5 rounded text-[10px] font-medium">Success</span>;
      case 'FAILED': return <span className="text-red-400 bg-red-900/30 px-2 py-0.5 rounded text-[10px] font-medium">Failed</span>;
      case 'RUNNING': return <span className="text-wy-400 bg-wy-500/30 px-2 py-0.5 rounded text-[10px] font-medium animate-pulse">Running</span>;
      default: return null;
    }
  };

  if (!workflowId) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-dark-text-muted text-center">
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Save your workflow to start tracking history</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col bg-dark-surface border-l border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-dark-text uppercase tracking-wide">Runs History</h2>
        <button
          onClick={fetchHistory}
          className="p-1.5 rounded-md hover:bg-dark-border transition-colors text-dark-text-muted hover:text-dark-text"
          title="Refresh"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {runs.length === 0 ? (
          <div className="text-center py-8 text-xs text-dark-text-muted">
            No runs yet. Click "Run Workflow" to start.
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className={`rounded-lg border transition-colors ${getStatusColor(run.status)}`}
            >
              <div
                className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(run.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(run.status)}
                    <span className="text-[10px] text-dark-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(run.createdAt)}
                    </span>
                  </div>
                  {expandedRunId === run.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-dark-text-muted" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-dark-text-muted" />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-dark-text">
                  <span className="font-medium truncate max-w-[120px]">
                    Run #{run.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-dark-text-muted">
                    <span>{run.triggerType}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRunId === run.id && (
                <div className="p-3 pt-0 border-t border-white/5 space-y-2">
                  <div className="text-[10px] font-semibold text-dark-text-muted uppercase tracking-wide mt-2 mb-1">
                    Node Executions
                  </div>
                  {run.results && run.results.length > 0 ? (
                    run.results.map((result) => (
                      <div key={result.id} className="flex flex-col gap-1 p-2 rounded bg-dark-bg/50 border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-dark-text flex items-center gap-1.5">
                            {result.status === 'SUCCESS' ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            {result.nodeType}
                          </span>
                          <span className="text-[10px] text-dark-text-muted font-mono">
                            {result.nodeId.split('-')[0]}...
                          </span>
                        </div>
                        {result.output && (
                          <div className="mt-1 text-[10px] text-dark-text-muted bg-dark-bg p-1.5 rounded border border-white/5 overflow-hidden">
                            <div className="truncate opacity-80">Output:</div>
                            <div className="font-mono text-dark-text break-all line-clamp-2">
                              {typeof result.output === 'object'
                                ? JSON.stringify(result.output)
                                : String(result.output)}
                            </div>
                          </div>
                        )}
                        {result.error && (
                          <div className="mt-1 text-[10px] text-red-400 bg-red-900/10 p-1.5 rounded border border-red-500/20">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-dark-text-muted italic">
                      No node results logged yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}