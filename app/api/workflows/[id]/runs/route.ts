import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: workflowId } = await params;

        // Verify ownership
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
        });

        if (!workflow || workflow.userId !== userId) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Fetch runs with results
        const runs = await prisma.run.findMany({
            where: { workflowId },
            orderBy: { createdAt: 'desc' },
            include: {
                results: true, // Include node results for detail view
            },
        });

        return NextResponse.json(runs);

    } catch (error) {
        console.error('Failed to fetch runs:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
