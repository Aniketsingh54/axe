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
    const { workflowId, nodes, edges, targetNodeId, targetNodeIds, asyncExecution } = body;

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

    if (asyncExecution) {
      (async () => {
        try {
          if (targetNodeIds && Array.isArray(targetNodeIds) && targetNodeIds.length > 0) {
            await engine.runNodes(targetNodeIds);
          } else if (targetNodeId) {
            await engine.runNode(targetNodeId);
          } else {
            await engine.run();
          }
        } catch (error) {
          console.error('Async workflow execution failed:', error);
        }
      })();

      return NextResponse.json({
        runId: engine.getRunId(),
        status: 'RUNNING',
      });
    }

    // Run Workflow, Multiple Selected Nodes, or Single Node (sync mode)
    let result;
    if (targetNodeIds && Array.isArray(targetNodeIds) && targetNodeIds.length > 0) {
      result = await engine.runNodes(targetNodeIds);
    } else if (targetNodeId) {
      result = await engine.runNode(targetNodeId);
    } else {
      result = await engine.run();
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Run workflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
