'use client';

import { memo, useEffect, useRef } from 'react';
import { Terminal, X, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { useStore, type ExecutionLog } from '@/hooks/useStore';

const LogIcon = ({ level }: { level: ExecutionLog['level'] }) => {
    switch (level) {
        case 'success':
            return <CheckCircle className="w-3 h-3 text-green-400" />;
        case 'error':
            return <AlertCircle className="w-3 h-3 text-red-400" />;
        case 'warn':
            return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
        default:
            return <Info className="w-3 h-3 text-blue-400" />;
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

interface ExecutionLogsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExecutionLogsPanel = memo(({ isOpen, onClose }: ExecutionLogsPanelProps) => {
    const logs = useStore((state) => state.executionLogs);
    const clearLogs = useStore((state) => state.clearExecutionLogs);
    const isRunning = useStore((state) => state.isRunning);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border shadow-2xl z-50 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border bg-dark-bg/50">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-wy-500" />
                    <span className="text-sm font-medium text-dark-text">Execution Logs</span>
                    {isRunning && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-wy-500/20 border border-wy-500/30 rounded-full">
                            <span className="w-1.5 h-1.5 bg-wy-500 rounded-full animate-pulse" />
                            <span className="text-xs text-wy-400">Running</span>
                        </span>
                    )}
                    <span className="text-xs text-dark-text-muted">({logs.length} entries)</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearLogs}
                        className="p-1 hover:bg-dark-bg rounded text-dark-text-muted hover:text-dark-text transition-colors"
                        title="Clear logs"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-dark-bg rounded text-dark-text-muted hover:text-dark-text transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Logs Container */}
            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto p-2 font-mono text-xs space-y-1"
            >
                {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-dark-text-muted">
                        <span>No execution logs yet. Run a workflow to see logs here.</span>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={`flex items-start gap-2 px-2 py-1 rounded ${log.level === 'error' ? 'bg-red-500/10' :
                                    log.level === 'success' ? 'bg-green-500/10' :
                                        log.level === 'warn' ? 'bg-yellow-500/10' :
                                            'bg-dark-bg/30'
                                }`}
                        >
                            <span className="text-dark-text-muted shrink-0">
                                [{formatTime(log.timestamp)}]
                            </span>
                            <LogIcon level={log.level} />
                            {log.nodeName && (
                                <span className="text-wy-400 shrink-0">[{log.nodeName}]</span>
                            )}
                            <span className={`${log.level === 'error' ? 'text-red-400' :
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
        </div>
    );
});

ExecutionLogsPanel.displayName = 'ExecutionLogsPanel';
export default ExecutionLogsPanel;
