import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const workflow = await prisma.workflow.findUnique({
            where: { id },
        });

        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        if (workflow.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(workflow);
    } catch (error) {
        console.error('Failed to fetch workflow:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const workflow = await prisma.workflow.findUnique({
            where: { id },
        });

        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        if (workflow.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete associated runs first (cascade)
        await prisma.run.deleteMany({
            where: { workflowId: id },
        });

        // Delete the workflow
        await prisma.workflow.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to delete workflow:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
