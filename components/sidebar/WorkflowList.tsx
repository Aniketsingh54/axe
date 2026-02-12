'use client';

import { useEffect, useState } from 'react';
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

interface WorkflowListProps {
    searchQuery?: string;
}

export default function WorkflowList({ searchQuery = '' }: WorkflowListProps) {
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

    const filteredWorkflows = workflows.filter((workflow) =>
        workflow.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-wy-500" />
            </div>
        );
    }

  return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-[11px] font-semibold text-white/56 uppercase tracking-[0.12em]">
                    Saved Workflows
                </h3>
                <button
                    onClick={() => fetchWorkflows(true)}
                    className="text-[10px] text-white/45 hover:text-white/80"
                >
                    Refresh
                </button>
            </div>

            <div className="space-y-2">
                {filteredWorkflows.length === 0 ? (
                    <div className="text-[11px] text-white/45 italic p-2 border border-dashed border-dark-border rounded-md">
                        No workflows match your search.
                    </div>
                ) : (
                    filteredWorkflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className={`w-full text-left p-2.5 rounded-md border transition-all group relative ${currentWorkflowId === workflow.id
                                ? 'bg-[#2b3150] border-[#95a4ff] text-white'
                                : 'bg-[#1f2330] border-dark-border text-white/80 hover:border-white/25 hover:bg-[#252a37]'
                                }`}
                        >
                            <button
                                onClick={() => loadWorkflow(workflow.id, workflow.nodes, workflow.edges)}
                                className="w-full text-left"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-1.5 rounded-md ${currentWorkflowId === workflow.id ? 'bg-[#95a4ff] text-[#0f1220]' : 'bg-[#171a23] text-white/55'
                                            }`}>
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-[12px] font-medium truncate">{workflow.name}</div>
                                            <div className="text-[10px] text-white/45 truncate">
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
                                className="absolute top-2 right-2 p-1 rounded-md bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                title="Delete workflow"
                            >
                                {deletingId === workflow.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
