import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const models = [
  'GPT img 1',
  'Wan',
  'SD 3.5',
  'Runway Gen-4',
  'Imagen 3',
  'Veo 3',
  'Recraft V3',
  'Kling',
  'Flux Pro 1.1 Ultra',
  'Minimax video',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0d12] text-white">
      <div className="h-10 bg-[#080d19] border-b border-white/10 px-4 md:px-8 flex items-center justify-center text-[13px] text-white/90">
        <span className="font-medium">Axe is now a part of Figma</span>
      </div>

      <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-[#101420]/90 backdrop-blur-sm px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#f5f89a] text-black grid place-items-center text-[12px] font-bold">A</div>
          <div className="text-[13px] leading-tight text-white/85 tracking-wide">AXE<br />ARTISTIC INTELLIGENCE</div>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-[12px] uppercase tracking-[0.08em] text-white/70">
          <a href="#collective" className="hover:text-white">Collective</a>
          <a href="#enterprise" className="hover:text-white">Enterprise</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#demo" className="hover:text-white">Request a Demo</a>
          <Link href="/sign-in?redirect_url=/workflows" className="hover:text-white">Sign in</Link>
        </nav>
        <Link
          href="/sign-in?redirect_url=/workflows"
          className="h-12 px-6 md:px-8 bg-[#eef79e] text-black text-[15px] md:text-[18px] font-medium inline-flex items-center gap-2 hover:bg-[#f7ffbf] transition-colors"
        >
          Start Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#1f2c66_0%,#0b0d12_38%)]">
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#aeb9ff_0.8px,transparent_0.8px)] [background-size:12px_12px]" />
        <div className="relative max-w-[1320px] mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24">
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-10 md:gap-14">
            <div>
              <h1 className="text-[52px] md:text-[96px] leading-[0.92] tracking-[-0.03em] font-medium">Axe</h1>
            </div>
            <div>
              <h2 className="text-[52px] md:text-[96px] leading-[0.92] tracking-[-0.035em] font-medium">Artistic Intelligence</h2>
              <p className="mt-6 md:mt-8 max-w-xl text-[17px] text-white/72 leading-tight">
                Turn your creative vision into scalable workflows. Access all AI models and professional editing tools in one node based platform.
              </p>
            </div>
          </div>

          <div className="mt-12 md:mt-18 grid gap-4 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[150px]">
            <div className="md:row-span-2 rounded-2xl overflow-hidden border border-white/15 bg-[#b8c0c7]/30">
              <Image src="/samples/sample-product.png" alt="3d model" width={1280} height={720} className="w-full h-full object-cover" />
            </div>
            <div className="md:col-span-2 md:row-span-3 rounded-2xl overflow-hidden border border-white/15 bg-[#151b2a]">
              <Image src="/samples/sample-product.png" alt="main preview" width={1280} height={720} className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/90 text-black p-4 md:p-5">
              <div className="text-[11px] uppercase tracking-[0.12em] text-black/55 mb-2">Text</div>
              <p className="text-[13px] md:text-[14px] leading-tight text-black/70">
                A Great-Tailed Grackle bird is flying from the background and settling on the model&apos;s shoulder.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#b5bf99]/70">
              <Image src="/samples/sample-product.png" alt="secondary preview" width={1280} height={720} className="w-full h-full object-cover" />
            </div>
            <div className="md:col-span-2 rounded-2xl overflow-hidden border border-white/15 bg-black">
              <video src="/samples/sample-demo.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover opacity-90" />
            </div>
          </div>
        </div>
      </section>

      <section id="collective" className="relative min-h-[85vh] bg-[#060b1a] overflow-hidden">
        <video src="/samples/sample-demo.mp4" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,26,0.82),rgba(6,11,26,0.25),rgba(6,11,26,0.82))]" />
        <div className="relative max-w-[1320px] mx-auto px-4 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-10">
          <div className="max-w-[480px]">
            <h3 className="text-[56px] md:text-[84px] leading-[0.92] tracking-[-0.03em] font-medium">
              Use all AI models, together at last
            </h3>
            <p className="mt-6 text-[18px] text-white/80 leading-tight">
              AI models and professional editing tools in one node-based platform. Turn creative vision into scalable workflows without compromising quality.
            </p>
          </div>
          <div className="text-[48px] md:text-[74px] leading-[0.94] tracking-[-0.03em] text-white/92">
            {models.map((model, idx) => (
              <div key={model} className={idx === 0 ? 'text-[#edf79f]' : ''}>{model}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="enterprise" className="bg-[#efefef] text-black py-16 md:py-24">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <div className="text-[15px] text-black/70 mb-5">Maximize your team ability, by automatically generating a simplified UI</div>
          <div className="flex flex-wrap items-center gap-5 md:gap-10">
            <h3 className="text-[54px] md:text-[88px] tracking-[-0.04em] leading-none font-medium">From Workflow</h3>
            <div className="w-26 h-14 bg-[#e5ef91] rounded-full p-2">
              <div className="w-10 h-10 rounded-full bg-black" />
            </div>
            <h3 className="text-[54px] md:text-[88px] tracking-[-0.04em] leading-none font-medium text-black/35">to App Mode</h3>
          </div>
          <div className="mt-10 rounded-3xl border border-black/10 overflow-hidden">
            <Image src="/samples/sample-product.png" alt="workflow to app mode preview" width={1280} height={720} className="w-full h-[260px] md:h-[500px] object-cover" />
          </div>
        </div>
      </section>

      <footer id="pricing" className="relative bg-[#2a2a2f] text-white overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-14">
          <div className="text-[56px] md:text-[94px] tracking-[-0.035em] leading-[0.9] max-w-4xl">
            Artificial Intelligence + Human Creativity
          </div>
          <div className="mt-12 grid md:grid-cols-[1.2fr_1fr] gap-8">
            <div>
              <div className="text-white/90 text-[14px] max-w-md">
                Axe is a new way to create. We bridge the gap between AI capabilities and human creativity, while preserving craftsmanship in modern digital workflows.
              </div>
              <div className="mt-12 text-[12px] text-white/60">AXE © 2026. ALL RIGHTS RESERVED.</div>
            </div>
            <div id="demo" className="grid grid-cols-2 gap-6 text-[13px] text-white/75">
              <div className="space-y-2">
                <div className="text-white/45 uppercase text-[11px]">Get Started</div>
                <a className="block hover:text-white" href="#demo">Request a Demo</a>
                <a className="block hover:text-white" href="#pricing">Pricing</a>
                <a className="block hover:text-white" href="#enterprise">Enterprise</a>
              </div>
              <div className="space-y-2">
                <div className="text-white/45 uppercase text-[11px]">Resources</div>
                <Link className="block hover:text-white" href="/workflows">Workflow Library</Link>
                <Link className="block hover:text-white" href="/builder">Builder</Link>
                <Link className="block hover:text-white" href="/sign-in?redirect_url=/workflows">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/sign-in?redirect_url=/workflows"
          className="md:absolute bottom-6 right-6 h-16 px-7 bg-[#eef79e] text-black text-[24px] md:text-[28px] font-medium inline-flex items-center gap-3 hover:bg-[#f7ffbf] transition-colors m-4 md:m-0"
        >
          Start Now
          <ArrowRight className="w-6 h-6" />
        </Link>
      </footer>
    </main>
  );
}
