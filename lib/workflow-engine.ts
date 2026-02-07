import { prisma } from '@/lib/prisma';
import { triggerClient } from '@/src/trigger/client';
import { type Node, type Edge } from '@xyflow/react';

interface NodeRun {
    nodeId: string;
    type: string;
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
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
    triggerType: 'FULL' | 'SINGLE' | 'PARTIAL';
    targetNodeIds?: string[];
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
            triggerType: 'FULL',
        };
    }

    // Initialize all nodes as PENDING (or SKIPPED if not in target set)
    private initialize(targetNodeIds?: string[]) {
        this.context.nodes.forEach(node => {
            const shouldRun = !targetNodeIds || targetNodeIds.includes(node.id);
            this.context.nodeRuns.set(node.id, {
                nodeId: node.id,
                type: node.type || 'default',
                status: shouldRun ? 'PENDING' : 'SKIPPED',
            });
        });
    }

    // Get all upstream nodes (dependencies) for a given node using BFS
    private getUpstreamNodes(targetNodeId: string): string[] {
        const upstreamIds = new Set<string>();
        const queue = [targetNodeId];

        // Always include the target node
        upstreamIds.add(targetNodeId);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const incomingEdges = this.context.edges.filter(e => e.target === currentId);

            for (const edge of incomingEdges) {
                if (!upstreamIds.has(edge.source)) {
                    upstreamIds.add(edge.source);
                    queue.push(edge.source);
                }
            }
        }

        return Array.from(upstreamIds);
    }

    // Get input values from upstream nodes
    private getInputs(nodeId: string): Record<string, unknown> {
        const inputs: Record<string, unknown> = {};
        const incomingEdges = this.context.edges.filter(edge => edge.target === nodeId);

        for (const edge of incomingEdges) {
            const sourceRun = this.context.nodeRuns.get(edge.source);
            if (sourceRun && sourceRun.status === 'SUCCESS' && sourceRun.outputs) {
                const handleId = edge.targetHandle || 'input';
                const outputValue = sourceRun.outputs.output;

                // Handle input aggregation for multiple incoming edges to the same handle
                if (inputs[handleId] !== undefined) {
                    if (Array.isArray(inputs[handleId])) {
                        (inputs[handleId] as any[]).push(outputValue);
                    } else {
                        inputs[handleId] = [inputs[handleId], outputValue];
                    }
                } else {
                    inputs[handleId] = outputValue;
                }
            }
        }
        return inputs;
    }

    // Execute a single node
    private async executeNode(nodeId: string): Promise<void> {
        const nodeRun = this.context.nodeRuns.get(nodeId);
        if (!nodeRun || nodeRun.status === 'SKIPPED') return;

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

    // Execute nodes in topological order (only nodes in targetNodeIds)
    private async runTopological(targetNodeIds?: string[]): Promise<void> {
        const visited = new Set<string>();
        let hasRunningNodes = true;

        while (hasRunningNodes) {
            hasRunningNodes = false;

            // Find runnable nodes:
            // 1. Not visited
            // 2. Status is PENDING (not SKIPPED)
            // 3. All dependencies satisfied (incoming edges -> source SUCCESS or SKIPPED with cached output)
            const runnableNodes = this.context.nodes.filter(node => {
                if (visited.has(node.id)) return false;

                const nodeRun = this.context.nodeRuns.get(node.id);
                if (!nodeRun || nodeRun.status === 'SKIPPED') return false;

                const incomingEdges = this.context.edges.filter(e => e.target === node.id);
                const allDependenciesMet = incomingEdges.every(e => {
                    const sourceRun = this.context.nodeRuns.get(e.source);
                    return sourceRun && (sourceRun.status === 'SUCCESS' || sourceRun.status === 'SKIPPED');
                });

                return allDependenciesMet;
            });

            if (runnableNodes.length === 0) {
                // If unvisited nodes remain but none runnable -> Cycle or disconnected
                const pendingNodes = Array.from(this.context.nodeRuns.values()).filter(r => r.status === 'PENDING');
                if (pendingNodes.length > 0) {
                    console.warn(`${pendingNodes.length} nodes unreachable (cycles or missing dependencies)`);
                    break;
                }
                break; // All done
            }

            // Run them in parallel
            await Promise.all(runnableNodes.map(async (node) => {
                await this.executeNode(node.id);
                visited.add(node.id);
            }));

            if (runnableNodes.length > 0) {
                hasRunningNodes = true;
            }
        }
    }

    // Run a single node with all its dependencies
    public async runNode(targetNodeId: string): Promise<any> {
        // Get all upstream dependencies
        const nodesToRun = this.getUpstreamNodes(targetNodeId);

        this.context.triggerType = 'SINGLE';
        this.context.targetNodeIds = [targetNodeId];

        // Initialize with only target nodes
        this.initialize(nodesToRun);

        // Create Run record in DB
        const runRecord = await prisma.run.create({
            data: {
                id: this.context.runId,
                workflowId: this.context.workflowId,
                status: 'RUNNING',
                triggerType: 'SINGLE',
            },
        });

        try {
            await this.runTopological(nodesToRun);

            // Final status check (only for nodes that ran)
            const ranNodes = Array.from(this.context.nodeRuns.values()).filter(r => r.status !== 'SKIPPED');
            const allSuccess = ranNodes.every(r => r.status === 'SUCCESS');
            const finalStatus = allSuccess ? 'SUCCESS' : 'FAILED';

            // Calculate duration
            const duration = ranNodes.reduce((acc, r) => {
                if (r.startedAt && r.endedAt) {
                    return acc + (r.endedAt.getTime() - r.startedAt.getTime());
                }
                return acc;
            }, 0);

            // Update Run record with results
            await prisma.run.update({
                where: { id: this.context.runId },
                data: {
                    status: finalStatus,
                    duration,
                    results: {
                        create: ranNodes.map(r => ({
                            nodeId: r.nodeId,
                            nodeType: r.type,
                            status: r.status,
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
                triggerType: 'SINGLE',
                targetNodeId,
                results: ranNodes,
            };

        } catch (error) {
            console.error('Single node execution failed:', error);
            await prisma.run.update({
                where: { id: this.context.runId },
                data: { status: 'FAILED' },
            });
            throw error;
        }
    }

    // Main execution loop (Full Workflow)
    public async run(): Promise<any> {
        this.context.triggerType = 'FULL';
        this.initialize();

        // Create Run record in DB (PENDING)
        const runRecord = await prisma.run.create({
            data: {
                id: this.context.runId,
                workflowId: this.context.workflowId,
                status: 'RUNNING',
                triggerType: 'FULL',
            },
        });

        try {
            await this.runTopological();

            // Final status check
            const allSuccess = Array.from(this.context.nodeRuns.values()).every(r => r.status === 'SUCCESS');
            const finalStatus = allSuccess ? 'SUCCESS' : 'FAILED';

            // Calculate duration
            const duration = Array.from(this.context.nodeRuns.values()).reduce((acc, r) => {
                if (r.startedAt && r.endedAt) {
                    return acc + (r.endedAt.getTime() - r.startedAt.getTime());
                }
                return acc;
            }, 0);

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
                triggerType: 'FULL',
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
