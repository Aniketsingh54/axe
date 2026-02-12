import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Plus, Search, Workflow, Clock3, Sparkles } from 'lucide-react';
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
    <main className="min-h-screen bg-[#0b0e14] text-white">
      <div className="flex min-h-screen w-full">
        <aside className="hidden md:flex w-[270px] shrink-0 border-r border-white/10 bg-[#121621] flex-col">
          <div className="h-16 border-b border-white/10 px-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Axe</p>
              <p className="text-sm font-medium text-white/90">Workflow Studio</p>
            </div>
            <UserButton />
          </div>

          <div className="p-4">
            <Link
              href="/builder"
              className="h-11 rounded-md bg-[#f7ff9e] text-black font-medium text-sm inline-flex items-center justify-center gap-2 w-full"
            >
              <Plus className="w-4 h-4" />
              Create New Workflow
            </Link>
          </div>

          <div className="px-4 pb-4 space-y-2 text-sm">
            <div className="px-3 py-2 rounded-md bg-white/10 text-white">My Workflows</div>
            <div className="px-3 py-2 rounded-md text-white/60">Shared with me</div>
          </div>

          <div className="mt-auto p-4 border-t border-white/10">
            <p className="text-[11px] text-white/40">Axe © 2026</p>
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col">
          <div className="h-16 border-b border-white/10 px-4 md:px-8 flex items-center justify-between bg-[#111622]/90 backdrop-blur">
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles className="w-4 h-4 text-[#f7ff9e]" />
              <span className="text-sm md:text-base">My workflows</span>
            </div>
            <div className="h-10 w-[220px] md:w-[260px] rounded-md border border-white/15 bg-[#161b28] px-3 text-sm text-white/55 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8">
            {workflows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-[#151a27] p-10 text-center">
                <Workflow className="w-9 h-9 mx-auto text-white/45" />
                <p className="mt-4 text-white/75">No workflows yet</p>
                <p className="mt-1 text-sm text-white/45">Create your first workflow to open the canvas.</p>
                <Link
                  href="/builder"
                  className="mt-5 inline-flex h-10 px-4 items-center justify-center rounded-md bg-[#f7ff9e] text-black text-sm font-medium"
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
                      className="rounded-2xl border border-white/10 bg-[#161b28] hover:bg-[#1b2131] transition-colors p-4"
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
          </div>
        </section>
      </div>
    </main>
  );
}
