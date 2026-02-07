import { prisma } from '@/lib/prisma';
import { triggerClient } from '@/src/trigger/client';
import { type Node, type Edge } from '@xyflow/react';

interface NodeRun {
    nodeId: string;
    type: string;
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
    error?: string;
    startedAt?: Date;
    endedAt?: Date;
}

interface WorkflowRunContext {
    runId: string;
    workflowId: string;
    nodes: Node[];
    edges: Edge[];
    nodeRuns: Map<string, NodeRun>;
}

export class WorkflowEngine {
    private context: WorkflowRunContext;

    constructor(workflowId: string, nodes: Node[], edges: Edge[]) {
        this.context = {
            runId: crypto.randomUUID(),
            workflowId,
            nodes,
            edges,
            nodeRuns: new Map(),
        };
    }

    // Initialize all nodes as PENDING
    private initialize() {
        this.context.nodes.forEach(node => {
            this.context.nodeRuns.set(node.id, {
                nodeId: node.id,
                type: node.type || 'default',
                status: 'PENDING',
            });
        });
    }

    // Get input values from upstream nodes
    private getInputs(nodeId: string): Record<string, unknown> {
        const inputs: Record<string, unknown> = {};
        const incomingEdges = this.context.edges.filter(edge => edge.target === nodeId);

        for (const edge of incomingEdges) {
            const sourceRun = this.context.nodeRuns.get(edge.source);
            if (sourceRun && sourceRun.status === 'SUCCESS' && sourceRun.outputs) {
                // Map the output to the input handle id
                // Default to 'output' if no handle specified
                const handleId = edge.targetHandle || 'input';
                // In most cases, output is in 'output' property
                inputs[handleId] = sourceRun.outputs.output;
            }
        }
        return inputs;
    }

    // Execute a single node
    private async executeNode(nodeId: string): Promise<void> {
        const nodeRun = this.context.nodeRuns.get(nodeId);
        if (!nodeRun) return;

        nodeRun.status = 'RUNNING';
        nodeRun.startedAt = new Date();

        const node = this.context.nodes.find(n => n.id === nodeId);
        if (!node) return;

        try {
            // Merge manual inputs (from node data) with upstream inputs
            const manualInputs = (node.data as Record<string, unknown>) || {};
            const upstreamInputs = this.getInputs(nodeId);
            const inputs = { ...manualInputs, ...upstreamInputs };
            nodeRun.inputs = inputs;

            let outputs: Record<string, unknown> = {};

            console.log(`Executing node ${nodeId} (${node.type}) with inputs:`, inputs);

            // Execution Logic based on Node Type
            // Execution Logic based on Node Type
            switch (node.type) {
                case 'text':
                    // Text Node is pass-through
                    outputs = { output: inputs.text || '' };
                    break;

                case 'upload-image':
                    // Upload Image is pass-through (url in data)
                    outputs = { output: inputs.imageUrl || '' };
                    break;

                case 'upload-video':
                    // Upload Video is pass-through
                    outputs = { output: inputs.videoUrl || '' };
                    break;

                case 'llm':
                    // Run LLM Task
                    const llmResult: any = await triggerClient.triggerAndWait('gemini-generate', {
                        systemPrompt: inputs.system_prompt || inputs.systemPrompt,
                        userMessage: inputs.user_message || inputs.userMessage,
                        imageUrls: inputs.images ? (Array.isArray(inputs.images) ? inputs.images : [inputs.images]) : [],
                        model: inputs.model || 'gemini-1.5-flash',
                    });
                    outputs = { output: (llmResult as any).text || llmResult };
                    break;

                case 'crop-image':
                    // Run Crop Task
                    const cropResult: any = await triggerClient.triggerAndWait('media-process', {
                        operation: 'CROP',
                        inputUrl: inputs.image_url || inputs.imageUrl,
                        params: {
                            x: inputs.x_percent || inputs.xPercent,
                            y: inputs.y_percent || inputs.yPercent,
                            width: inputs.width_percent || inputs.widthPercent,
                            height: inputs.height_percent || inputs.heightPercent,
                        },
                    });
                    outputs = { output: (cropResult as any).url || cropResult };
                    break;

                case 'extract-frame':
                    // Run Extract Frame Task
                    const extractResult: any = await triggerClient.triggerAndWait('media-process', {
                        operation: 'EXTRACT_FRAME',
                        inputUrl: inputs.video_url || inputs.videoUrl,
                        params: {
                            timestamp: inputs.timestamp,
                        },
                    });
                    outputs = { output: (extractResult as any).url || extractResult };
                    break;

                default:
                    console.warn(`Unknown node type: ${node.type}`);
                    outputs = {};
            }

            nodeRun.outputs = outputs;
            nodeRun.status = 'SUCCESS';
            nodeRun.endedAt = new Date();

        } catch (error: any) {
            console.error(`Node ${nodeId} execution failed:`, error);
            nodeRun.status = 'FAILED';
            nodeRun.error = error.message || 'Unknown error';
            nodeRun.endedAt = new Date();
            throw error;
        }
    }

    // Main execution loop (Topological Sort / Linear)
    public async run(): Promise<any> {
        this.initialize();

        // Create Run record in DB (PENDING)
        const runRecord = await prisma.run.create({
            data: {
                id: this.context.runId,
                workflowId: this.context.workflowId,
                status: 'RUNNING',
                triggerType: 'FULL',
                // Provide empty object for results.create array currently empty
            },
        });

        try {
            const visited = new Set<string>();
            let hasRunningNodes = true;

            while (hasRunningNodes) {
                hasRunningNodes = false;

                // Find runnable nodes:
                // 1. Not visited
                // 2. All dependencies satisfied (incoming edges -> source SUCCESS)
                const runnableNodes = this.context.nodes.filter(node => {
                    if (visited.has(node.id)) return false;

                    const incomingEdges = this.context.edges.filter(e => e.target === node.id);
                    const allDependenciesMet = incomingEdges.every(e => {
                        const sourceRun = this.context.nodeRuns.get(e.source);
                        return sourceRun && sourceRun.status === 'SUCCESS';
                    });

                    return allDependenciesMet;
                });

                if (runnableNodes.length === 0) {
                    // If unvisited nodes remain but none runnable -> Cycle or disconnected
                    const unvisitedCount = this.context.nodes.length - visited.size;
                    if (unvisitedCount > 0) {
                        console.warn(`${unvisitedCount} nodes unreachable (cycles or missing dependencies)`);
                        break;
                    }
                    break; // All done
                }

                // Run them
                for (const node of runnableNodes) {
                    await this.executeNode(node.id);
                    visited.add(node.id);
                    hasRunningNodes = true;
                }
            }

            // Final status check
            const allSuccess = Array.from(this.context.nodeRuns.values()).every(r => r.status === 'SUCCESS');
            const finalStatus = allSuccess ? 'SUCCESS' : 'FAILED';
            const endTime = new Date();

            // Calculate duration
            // (Mock duration for now, can improve)
            const duration = 0;

            // Update Run record with results
            await prisma.run.update({
                where: { id: this.context.runId },
                data: {
                    status: finalStatus,
                    duration,
                    results: {
                        create: Array.from(this.context.nodeRuns.values()).map(r => ({
                            nodeId: r.nodeId,
                            nodeType: r.type,
                            status: r.status,
                            // Convert data to JSON compatible format
                            input: (r.inputs || {}) as any,
                            output: (r.outputs || {}) as any,
                            error: r.error,
                            startedAt: r.startedAt || new Date(),
                            endedAt: r.endedAt || new Date(),
                        })),
                    },
                },
            });

            return {
                runId: this.context.runId,
                status: finalStatus,
                results: Array.from(this.context.nodeRuns.values()),
            };

        } catch (error) {
            console.error('Workflow execution failed:', error);
            await prisma.run.update({
                where: { id: this.context.runId },
                data: { status: 'FAILED' },
            });
            throw error;
        }
    }
}
