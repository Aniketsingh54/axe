import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { id, name, nodes, edges } = body;

        // Use upsert to create or update
        const workflow = await prisma.workflow.upsert({
            where: {
                id: id || 'new', // Use 'new' as a placeholder if no ID provided, though client should gen UUID
            },
            update: {
                name,
                nodes,
                edges,
                updatedAt: new Date(),
            },
            create: {
                id: id,
                userId,
                name: name || 'Untitled Workflow',
                nodes,
                edges,
            },
        });

        return NextResponse.json(workflow);
    } catch (error) {
        console.error('Failed to save workflow:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
