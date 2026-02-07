'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/hooks/useStore';
import { Loader2, FileText, ChevronRight, Trash2 } from 'lucide-react';

interface Workflow {
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
    updatedAt: string;
}

// Simple in-memory cache
let workflowCache: { data: Workflow[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 30000; // 30 seconds

export default function WorkflowList() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const loadWorkflow = useStore((state) => state.loadWorkflow);
    const currentWorkflowId = useStore((state) => state.workflowId);
    const clearWorkflow = useStore((state) => state.clearWorkflow);

    const fetchWorkflows = async (force = false) => {
        const now = Date.now();

        // Use cache if valid and not forced
        if (!force && workflowCache.data && (now - workflowCache.timestamp) < CACHE_TTL) {
            setWorkflows(workflowCache.data);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/workflows');
            if (response.ok) {
                const data = await response.json();
                setWorkflows(data);
                workflowCache = { data, timestamp: now };
            }
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWorkflow = async (e: React.MouseEvent, workflowId: string) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this workflow?')) {
            return;
        }

        setDeletingId(workflowId);
        try {
            const response = await fetch(`/api/workflows/${workflowId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Clear canvas if this was the current workflow
                if (currentWorkflowId === workflowId) {
                    clearWorkflow();
                }
                // Force refresh the list
                await fetchWorkflows(true);
            } else {
                alert('Failed to delete workflow');
            }
        } catch (error) {
            console.error('Failed to delete workflow:', error);
            alert('Failed to delete workflow');
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, [currentWorkflowId]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-wy-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider">
                    Saved Workflows
                </h3>
                <button
                    onClick={() => fetchWorkflows(true)}
                    className="text-[10px] text-wy-500 hover:text-wy-400"
                >
                    Refresh
                </button>
            </div>

            <div className="space-y-2">
                {workflows.length === 0 ? (
                    <div className="text-[11px] text-dark-text-muted italic p-2 border border-dashed border-dark-border rounded">
                        No workflows found. Save one to see it here!
                    </div>
                ) : (
                    workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className={`w-full text-left p-3 rounded-lg border transition-all group relative ${currentWorkflowId === workflow.id
                                ? 'bg-wy-500/10 border-wy-500 text-wy-500'
                                : 'bg-dark-surface border-dark-border text-dark-text hover:border-wy-500/50 hover:bg-dark-bg'
                                }`}
                        >
                            <button
                                onClick={() => loadWorkflow(workflow.id, workflow.nodes, workflow.edges)}
                                className="w-full text-left"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-md ${currentWorkflowId === workflow.id ? 'bg-wy-500 text-white' : 'bg-dark-bg text-dark-text-muted'
                                            }`}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-xs font-medium truncate">{workflow.name}</div>
                                            <div className="text-[10px] text-dark-text-muted truncate">
                                                Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-3 h-3 transition-transform ${currentWorkflowId === workflow.id ? 'translate-x-0' : '-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                                        }`} />
                                </div>
                            </button>

                            {/* Delete button - shows on hover */}
                            <button
                                onClick={(e) => handleDeleteWorkflow(e, workflow.id)}
                                disabled={deletingId === workflow.id}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                title="Delete workflow"
                            >
                                {deletingId === workflow.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
