'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { Loader2, FileText, ChevronRight } from 'lucide-react';

interface Workflow {
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
    updatedAt: string;
}

export default function WorkflowList() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const loadWorkflow = useStore((state) => state.loadWorkflow);
    const currentWorkflowId = useStore((state) => state.workflowId);

    const fetchWorkflows = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/workflows');
            if (response.ok) {
                const data = await response.json();
                setWorkflows(data);
            }
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        } finally {
            setIsLoading(false);
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
                    onClick={fetchWorkflows}
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
                        <button
                            key={workflow.id}
                            onClick={() => loadWorkflow(workflow.id, workflow.nodes, workflow.edges)}
                            className={`w-full text-left p-3 rounded-lg border transition-all group ${currentWorkflowId === workflow.id
                                    ? 'bg-wy-500/10 border-wy-500 text-wy-500'
                                    : 'bg-dark-surface border-dark-border text-dark-text hover:border-wy-500/50 hover:bg-dark-bg'
                                }`}
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
                    ))
                )}
            </div>
        </div>
    );
}
