'use client';

import { useEffect, useState, useRef } from 'react';
import { Clock, RotateCcw, ChevronDown, ChevronUp, CheckCircle, XCircle, Terminal, Info, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useStore, type ExecutionLog } from '@/hooks/useStore';

interface NodeResult {
  id: string;
  nodeId: string;
  nodeType: string;
  status: 'SUCCESS' | 'FAILED';
  input?: any;
  output?: any;
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

const LogIcon = ({ level }: { level: ExecutionLog['level'] }) => {
  switch (level) {
    case 'success':
      return <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />;
    case 'warn':
      return <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0" />;
    default:
      return <Info className="w-3 h-3 text-blue-400 shrink-0" />;
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const calcDuration = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return (ms / 1000).toFixed(1) + 's';
};

const formatOutput = (value: any): string => {
  if (!value) return '—';
  if (typeof value === 'string') {
    return value.length > 60 ? value.slice(0, 60) + '...' : value;
  }
  return JSON.stringify(value).slice(0, 60) + '...';
};

export default function HistoryPanel() {
  const { workflowId, historyTrigger, executionLogs, clearExecutionLogs, isRunning } = useStore();
  const [runs, setRuns] = useState<Run[]>([]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [showLiveLogs, setShowLiveLogs] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(5);
  const logsRef = useRef<HTMLDivElement>(null);
  const runsCache = useRef<{ workflowId: string | null; data: Run[]; timestamp: number }>({ workflowId: null, data: [], timestamp: 0 });
  const lastTrigger = useRef<number>(0);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current && isRunning) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [executionLogs, isRunning]);

  // Auto-expand live logs when running
  useEffect(() => {
    if (isRunning) {
      setShowLiveLogs(true);
    }
  }, [isRunning]);

  const fetchHistory = async (force = false) => {
    if (!workflowId) return;

    const now = Date.now();
    const CACHE_TTL = 10000; // 10 seconds

    // Use cache if valid and not forced
    if (!force &&
      runsCache.current.workflowId === workflowId &&
      runsCache.current.data.length > 0 &&
      (now - runsCache.current.timestamp) < CACHE_TTL) {
      setRuns(runsCache.current.data);
      return;
    }

    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
        runsCache.current = { workflowId, data, timestamp: now };
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  // Initial fetch when workflowId changes
  useEffect(() => {
    if (workflowId) {
      fetchHistory();
    } else {
      setRuns([]);
    }
  }, [workflowId]);

  // Only fetch on historyTrigger if it actually changed
  useEffect(() => {
    if (historyTrigger > lastTrigger.current && workflowId) {
      lastTrigger.current = historyTrigger;
      fetchHistory(true); // Force refresh after a run completes
    }
  }, [historyTrigger, workflowId]);

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

  const displayedRuns = runs.slice(0, displayLimit);
  const hasMoreRuns = runs.length > displayLimit;

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
      {/* Runs History Section - TOP */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-sm font-semibold text-dark-text uppercase tracking-wide">Runs History</h2>
        <button
          onClick={() => fetchHistory(true)}
          className="p-1.5 rounded-md hover:bg-dark-border transition-colors text-dark-text-muted hover:text-dark-text"
          title="Refresh"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[120px]">
        {runs.length === 0 ? (
          <div className="text-center py-6 text-xs text-dark-text-muted">
            No runs yet. Click "Run Workflow" to start.
          </div>
        ) : (
          <>
            {displayedRuns.map((run) => (
              <div
                key={run.id}
                className={`rounded-lg border transition-colors ${getStatusColor(run.status)}`}
              >
                <div
                  className="p-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(run.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
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
                    <span className="text-[10px] text-dark-text-muted">{run.triggerType}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRunId === run.id && (
                  <div className="p-2.5 pt-0 border-t border-white/5 space-y-1.5">
                    <div className="text-[10px] font-semibold text-dark-text-muted uppercase tracking-wide mt-1.5 mb-1">
                      Node Executions ({run.results?.length || 0} nodes)
                    </div>
                    {run.results && run.results.length > 0 ? (
                      run.results.map((result) => (
                        <div key={result.id} className="flex flex-col gap-1 p-1.5 rounded bg-dark-bg/50 border border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-dark-text flex items-center gap-1">
                              {result.status === 'SUCCESS' ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-400" />
                              )}
                              {result.nodeType}
                            </span>
                            <span className="text-[9px] text-dark-text-muted font-mono">
                              {calcDuration(result.startedAt, result.endedAt)}
                            </span>
                          </div>
                          {/* Show output */}
                          {result.output && (
                            <div className="text-[9px] text-green-400/80 bg-green-900/10 px-1.5 py-0.5 rounded truncate">
                              Output: {formatOutput(result.output?.output || result.output)}
                            </div>
                          )}
                          {result.error && (
                            <div className="text-[9px] text-red-400 bg-red-900/10 px-1.5 py-0.5 rounded truncate">
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-dark-text-muted italic">
                        No node results.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}


            {/* Load More Button */}
            {hasMoreRuns && (
              <button
                onClick={() => setDisplayLimit(prev => prev + 5)}
                className="w-full py-2 text-xs text-wy-400 hover:text-wy-300 hover:bg-wy-500/10 rounded-lg border border-dashed border-wy-500/30 transition-colors"
              >
                Load More ({runs.length - displayLimit} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {/* Execution Logs Section - BOTTOM (Flexible) */}
      <div className="mt-4 rounded-lg border border-wy-500/30 bg-dark-bg/50 overflow-hidden flex flex-col min-h-[180px] max-h-[50%]">
        <div
          className="flex items-center justify-between px-3 py-2 bg-wy-500/10 cursor-pointer hover:bg-wy-500/20 transition-colors shrink-0"
          onClick={() => setShowLiveLogs(!showLiveLogs)}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-wy-500" />
            <span className="text-xs font-medium text-wy-400">Execution Logs</span>
            {isRunning && (
              <span className="w-1.5 h-1.5 bg-wy-500 rounded-full animate-pulse" />
            )}
            <span className="text-[10px] text-dark-text-muted">({executionLogs.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); clearExecutionLogs(); }}
              className="p-1 hover:bg-dark-border rounded text-dark-text-muted hover:text-dark-text transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            {showLiveLogs ? (
              <ChevronUp className="w-3.5 h-3.5 text-dark-text-muted" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-dark-text-muted" />
            )}
          </div>
        </div>

        {showLiveLogs && (
          <div
            ref={logsRef}
            className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]"
          >
            {executionLogs.length === 0 ? (
              <div className="text-dark-text-muted text-center py-4">
                Run a workflow to see execution logs here.
              </div>
            ) : (
              executionLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-1.5 px-1.5 py-0.5 rounded ${log.level === 'error' ? 'bg-red-500/10' :
                    log.level === 'success' ? 'bg-green-500/10' :
                      log.level === 'warn' ? 'bg-yellow-500/10' :
                        ''
                    }`}
                >
                  <span className="text-dark-text-muted shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                  <LogIcon level={log.level} />
                  {log.nodeName && (
                    <span className="text-wy-400 shrink-0">[{log.nodeName}]</span>
                  )}
                  <span className={`break-all ${log.level === 'error' ? 'text-red-400' :
                    log.level === 'success' ? 'text-green-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                        'text-dark-text'
                    }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}