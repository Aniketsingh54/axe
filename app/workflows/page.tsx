import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Plus, Search, Workflow, Clock3 } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export default async function WorkflowsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/workflows');
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      nodes: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#05070f] text-white flex">
      <aside className="w-[248px] border-r border-white/10 bg-[#0f131d] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-white/90 font-medium">Workspace</div>
          <UserButton />
        </div>
        <Link
          href="/builder"
          className="h-11 rounded-md bg-[#dfe887] text-black font-medium text-sm inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Workflow
        </Link>
        <div className="mt-6 space-y-2 text-sm text-white/65">
          <div className="px-3 py-2 rounded-md bg-[#1f2534] text-white">My Workflows</div>
          <div className="px-3 py-2 rounded-md hover:bg-white/5">Shared with me</div>
        </div>
        <div className="flex-1" />
      </aside>

      <section className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My workflows</h1>
          <div className="h-10 w-[240px] rounded-md border border-white/15 bg-[#171b27] px-3 text-sm text-white/55 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </div>
        </div>

        {workflows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 bg-[#111523] p-10 text-center">
            <Workflow className="w-9 h-9 mx-auto text-white/45" />
            <p className="mt-4 text-white/75">No workflows yet</p>
            <p className="mt-1 text-sm text-white/45">Create your first workflow to open the canvas.</p>
            <Link
              href="/builder"
              className="mt-5 inline-flex h-10 px-4 items-center justify-center rounded-md bg-[#7078ff] text-white text-sm font-medium"
            >
              Create New Workflow
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workflows.map((workflow) => {
              const nodeCount = Array.isArray(workflow.nodes) ? workflow.nodes.length : 0;
              return (
                <Link
                  key={workflow.id}
                  href={`/builder?workflowId=${workflow.id}`}
                  className="rounded-xl border border-white/10 bg-[#161b28] hover:bg-[#1b2131] transition-colors p-4"
                >
                  <div className="h-36 rounded-lg border border-white/10 bg-[#1f2534] grid place-items-center">
                    <Workflow className="w-7 h-7 text-white/45" />
                  </div>
                  <h3 className="mt-3 text-lg font-medium truncate">{workflow.name || 'Untitled workflow'}</h3>
                  <div className="mt-1 text-sm text-white/45">{nodeCount} node{nodeCount === 1 ? '' : 's'}</div>
                  <div className="mt-3 text-xs text-white/50 flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    Updated {new Date(workflow.updatedAt).toLocaleString()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

