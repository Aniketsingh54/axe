import Link from 'next/link';
import { ArrowRight, Sparkles, Workflow, PanelLeft } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between">
        <div className="text-sm tracking-wide text-white/85 font-medium">Axe</div>
        <nav className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-white/70 hover:text-white">Sign in</Link>
          <Link
            href="/sign-in?redirect_url=/workflows"
            className="h-9 px-4 rounded-md bg-[#dfe887] text-black text-sm font-semibold inline-flex items-center gap-2"
          >
            Start now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </header>

      <section className="px-8 md:px-16 py-16 md:py-20">
        <p className="text-xs uppercase tracking-[0.16em] text-[#dfe887] mb-5">Workflow Builder</p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight max-w-4xl">
          Build LLM workflows with node-level execution, history, and parallel DAG runs.
        </h1>
        <p className="mt-6 text-white/60 max-w-2xl text-lg">
          Create, run, and inspect multimodal pipelines. Start from templates or build your own.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-in?redirect_url=/workflows"
            className="h-10 px-5 rounded-md bg-[#7078ff] text-white text-sm font-medium inline-flex items-center gap-2"
          >
            Open Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sign-up"
            className="h-10 px-5 rounded-md border border-white/20 text-white/85 text-sm font-medium inline-flex items-center"
          >
            Create account
          </Link>
        </div>
      </section>

      <section className="px-8 md:px-16 pb-16 grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#121622] p-5">
          <Sparkles className="w-5 h-5 text-[#dfe887]" />
          <h3 className="mt-4 text-lg font-medium">Node-by-node execution</h3>
          <p className="mt-2 text-sm text-white/55">Watch each node queue, run, and complete with outputs.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#121622] p-5">
          <Workflow className="w-5 h-5 text-[#95a4ff]" />
          <h3 className="mt-4 text-lg font-medium">Parallel DAG scheduling</h3>
          <p className="mt-2 text-sm text-white/55">Independent branches execute in parallel automatically.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#121622] p-5">
          <PanelLeft className="w-5 h-5 text-[#95a4ff]" />
          <h3 className="mt-4 text-lg font-medium">Workflow library + canvas</h3>
          <p className="mt-2 text-sm text-white/55">Manage files first, then jump into the builder.</p>
        </div>
      </section>
    </main>
  );
}
