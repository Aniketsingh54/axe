import { NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workflowId, nodes, edges, targetNodeId, targetNodeIds } = body;

    // Validate workflow ownership if ID is provided
    if (workflowId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (workflow && workflow.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Initialize Engine
    const engine = new WorkflowEngine(workflowId || 'temp', nodes, edges);

    // Run Workflow, Multiple Selected Nodes, or Single Node
    let result;
    if (targetNodeIds && Array.isArray(targetNodeIds) && targetNodeIds.length > 0) {
      // Run multiple selected nodes with their dependencies
      result = await engine.runNodes(targetNodeIds);
    } else if (targetNodeId) {
      // Run single node with its dependencies
      result = await engine.runNode(targetNodeId);
    } else {
      // Run full workflow
      result = await engine.run();
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Run workflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}