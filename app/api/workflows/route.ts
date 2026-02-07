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
        let workflow;

        if (id) {
            // Update existing workflow
            workflow = await prisma.workflow.update({
                where: { id },
                data: {
                    name,
                    nodes,
                    edges,
                },
            });
        } else {
            // Create new workflow
            workflow = await prisma.workflow.create({
                data: {
                    userId,
                    name: name || 'Untitled Workflow',
                    nodes,
                    edges,
                },
            });
        }

        return NextResponse.json(workflow);
    } catch (error) {
        console.error('Failed to save workflow:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
