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

const FAILED_DEP_SKIP_REASON = 'Skipped due to failed dependency';

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

    public getRunId(): string {
        return this.context.runId;
    }

    private async persistNodeResult(nodeRun: NodeRun) {
        if (!nodeRun.startedAt || !nodeRun.endedAt) return;
        if (nodeRun.status !== 'SUCCESS' && nodeRun.status !== 'FAILED') return;

        try {
            await prisma.nodeResult.create({
                data: {
                    runId: this.context.runId,
                    nodeId: nodeRun.nodeId,
                    nodeType: nodeRun.type,
                    status: nodeRun.status,
                    input: (nodeRun.inputs || {}) as any,
                    output: (nodeRun.outputs || {}) as any,
                    error: nodeRun.error,
                    startedAt: nodeRun.startedAt,
                    endedAt: nodeRun.endedAt,
                },
            });
        } catch (error) {
            console.error(`Failed to persist node result for ${nodeRun.nodeId}:`, error);
        }
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
            await this.persistNodeResult(nodeRun);

        } catch (error: any) {
            console.error(`Node ${nodeId} execution failed:`, error);
            nodeRun.status = 'FAILED';
            nodeRun.error = error.message || 'Unknown error';
            nodeRun.endedAt = new Date();
            await this.persistNodeResult(nodeRun);
        }
    }

    private getIncomingRuns(nodeId: string): NodeRun[] {
        const incomingEdges = this.context.edges.filter((edge) => edge.target === nodeId);
        return incomingEdges
            .map((edge) => this.context.nodeRuns.get(edge.source))
            .filter((run): run is NodeRun => Boolean(run));
    }

    private isFailedDependency(run: NodeRun): boolean {
        return run.status === 'FAILED' || (
            run.status === 'SKIPPED' &&
            typeof run.error === 'string' &&
            run.error.startsWith(FAILED_DEP_SKIP_REASON)
        );
    }

    // Execute nodes in dependency order with parallel waves.
    private async runTopological(targetNodeIds?: string[]): Promise<void> {
        while (true) {
            let madeProgress = false;
            const pendingNodes = this.context.nodes.filter((node) => {
                const nodeRun = this.context.nodeRuns.get(node.id);
                return nodeRun?.status === 'PENDING';
            });

            if (pendingNodes.length === 0) {
                break;
            }

            // Mark nodes that can never run because one or more dependencies failed.
            for (const node of pendingNodes) {
                const nodeRun = this.context.nodeRuns.get(node.id);
                if (!nodeRun) continue;

                const depRuns = this.getIncomingRuns(node.id);
                const depsSettled = depRuns.every((dep) =>
                    dep.status === 'SUCCESS' || dep.status === 'FAILED' || dep.status === 'SKIPPED'
                );
                const hasFailedDep = depRuns.some((dep) => this.isFailedDependency(dep));

                if (depsSettled && hasFailedDep) {
                    nodeRun.status = 'SKIPPED';
                    nodeRun.error = `${FAILED_DEP_SKIP_REASON} for node ${node.id}`;
                    madeProgress = true;
                }
            }

            const runnableNodes = this.context.nodes.filter((node) => {
                const nodeRun = this.context.nodeRuns.get(node.id);
                if (!nodeRun || nodeRun.status !== 'PENDING') return false;

                const depRuns = this.getIncomingRuns(node.id);
                return depRuns.every((dep) =>
                    dep.status === 'SUCCESS' || (dep.status === 'SKIPPED' && !this.isFailedDependency(dep))
                );
            });

            if (runnableNodes.length > 0) {
                // Execute each topological wave in parallel.
                await Promise.all(runnableNodes.map((node) => this.executeNode(node.id)));
                madeProgress = true;
            }

            if (!madeProgress) {
                // Cycles or disconnected dependency state.
                const unresolved = Array.from(this.context.nodeRuns.values()).filter((run) => run.status === 'PENDING');
                unresolved.forEach((run) => {
                    run.status = 'SKIPPED';
                    run.error = 'Skipped due to unresolved dependencies (possible cycle)';
                });
                break;
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
        await prisma.run.create({
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
        await prisma.run.create({
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

    // Run multiple selected nodes with their dependencies
    public async runNodes(targetNodeIds: string[]): Promise<any> {
        // Get all upstream dependencies for all target nodes
        const allNodesToRun = new Set<string>();
        for (const nodeId of targetNodeIds) {
            const upstream = this.getUpstreamNodes(nodeId);
            for (const id of upstream) {
                allNodesToRun.add(id);
            }
        }

        const nodesToRun = Array.from(allNodesToRun);

        this.context.triggerType = 'PARTIAL';
        this.context.targetNodeIds = targetNodeIds;

        // Initialize with only target nodes
        this.initialize(nodesToRun);

        // Create Run record in DB
        await prisma.run.create({
            data: {
                id: this.context.runId,
                workflowId: this.context.workflowId,
                status: 'RUNNING',
                triggerType: 'PARTIAL',
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
                },
            });

            return {
                runId: this.context.runId,
                status: finalStatus,
                triggerType: 'PARTIAL',
                targetNodeIds,
                results: ranNodes,
            };

        } catch (error) {
            console.error('Partial execution failed:', error);
            await prisma.run.update({
                where: { id: this.context.runId },
                data: { status: 'FAILED' },
            });
            throw error;
        }
    }
}
