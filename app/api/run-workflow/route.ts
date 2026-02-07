import { NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { workflowId, nodes, edges, targetNodeId } = body;

    // Validate workflow ownership if ID is provided
    if (workflowId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow || workflow.userId !== userId) {
        // Allow running if it's a new unsaved workflow (workflowId might be temporary or missing)
        // But if provided, it must be valid.
        if (workflow && workflow.userId !== userId) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }
    }

    // Initialize Engine
    const engine = new WorkflowEngine(workflowId || 'temp', nodes, edges);

    // Run Workflow or Single Node
    let result;
    if (targetNodeId) {
      // Run single node with its dependencies
      result = await engine.runNode(targetNodeId);
    } else {
      // Run full workflow
      result = await engine.run();
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Run workflow error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}