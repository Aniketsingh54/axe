import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId, runId } = await params;

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true },
    });

    if (!workflow || workflow.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const run = await prisma.run.findFirst({
      where: { id: runId, workflowId },
      include: {
        results: {
          orderBy: { endedAt: 'asc' },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error('Failed to fetch run:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

