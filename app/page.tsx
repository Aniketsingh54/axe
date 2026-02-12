import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const models = [
  "GPT img 1",
  "Wan",
  "SD 3.5",
  "Runway Gen-4",
  "Imagen 3",
  "Veo 3",
  "Recraft V3",
  "Kling",
  "Flux Pro 1.1 Ultra",
  "Minimax video",
  "Ideogram V3",
  "Luma ray 2",
  "Hunyuan",
  "Bria",
];

const tools = [
  "Invert",
  "Outpaint",
  "Crop",
  "Inpaint",
  "Mask extractor",
  "Upscale",
  "Z depth extractor",
  "Image describer",
  "Channels",
  "Painter",
  "Relight",
];

const workflows = [
  "Multiple Models",
  "Wan LoRa Inflate",
  "ControlNet - Structure Reference",
  "Camera Angle Control",
  "Relight 2.0 Human",
  "Weavy Logo",
  "Relight - Product",
  "Wan Lora - Rotate",
];

const videoProps = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: "metadata" as const,
  poster: "/samples/sample-product.png",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090b12] text-white">
      <div className="h-10 border-b border-white/10 bg-[#060810] px-4 text-center text-[13px] text-white/90 md:px-8">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-center">
          Axe is now a part of Figma
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1320]/90 px-4 backdrop-blur md:px-8">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded bg-[#edf79f] text-xs font-bold text-black">
              A
            </div>
            <div className="text-[12px] leading-tight tracking-[0.08em] text-white/85">
              AXE
              <br />
              ARTISTIC INTELLIGENCE
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-[12px] uppercase tracking-[0.08em] text-white/70 lg:flex">
            <a href="#collective" className="hover:text-white">
              Collective
            </a>
            <a href="#enterprise" className="hover:text-white">
              Enterprise
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#demo" className="hover:text-white">
              Request a Demo
            </a>
            <Link href="/sign-in?redirect_url=/workflows" className="hover:text-white">
              Sign In
            </Link>
          </nav>

          <Link
            href="/sign-in?redirect_url=/workflows"
            className="group relative inline-flex h-11 items-center gap-2 overflow-hidden bg-[#eef79e] px-5 text-[14px] font-medium text-black shadow-[0_8px_28px_rgba(238,247,158,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f8ffbe] hover:shadow-[0_12px_34px_rgba(238,247,158,0.33)] md:text-[16px]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-[125%] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-[125%]" />
            <span className="relative">Start Now</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_8%,#213064_0%,#090b12_38%)]">
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#9aa8ff_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="relative mx-auto max-w-[1320px] px-4 pb-20 pt-14 md:px-8 md:pt-20">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <h1 className="text-[56px] font-medium leading-[0.9] tracking-[-0.04em] md:text-[108px]">
              Axe
            </h1>
            <div>
              <h2 className="text-[56px] font-medium leading-[0.9] tracking-[-0.04em] md:text-[108px]">
                Artistic Intelligence
              </h2>
              <p className="mt-7 max-w-2xl text-[17px] leading-tight text-white/72">
                Turn your creative vision into scalable workflows. Access all AI models and professional editing
                tools in one node based platform.
              </p>
            </div>
          </div>

          <div className="mt-12 grid auto-rows-[110px] gap-4 md:auto-rows-[150px] md:grid-cols-4">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 md:row-span-2">
              <Image
                src="/samples/sample-product.png"
                alt="creative preview"
                width={1280}
                height={720}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#161d2b] md:col-span-2 md:row-span-3">
              <video
                src="/samples/sample-demo.mp4"
                {...videoProps}
                className="h-full w-full object-cover opacity-90 [transform:translateZ(0)]"
              />
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/95 p-4 text-black md:p-5">
              <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-black/55">Text Prompt</div>
              <p className="text-[13px] leading-tight text-black/70">
                A product hero render with rich texture, dramatic depth, and studio quality relighting.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#cdd6a9]/75">
              <Image
                src="/samples/sample-product.png"
                alt="generated variation"
                width={1280}
                height={720}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-black md:col-span-2">
              <Image
                src="/samples/sample-product.png"
                alt="composited output"
                width={1280}
                height={720}
                className="h-full w-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="collective" className="relative overflow-hidden bg-[#060b1a] py-16 md:py-24">
        <video
          src="/samples/sample-demo.mp4"
          {...videoProps}
          className="absolute inset-0 h-full w-full object-cover opacity-35 [transform:translateZ(0)]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,26,0.9),rgba(6,11,26,0.4),rgba(6,11,26,0.9))]" />
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-4 md:grid-cols-2 md:px-8">
          <div className="max-w-xl">
            <h3 className="text-[54px] font-medium leading-[0.92] tracking-[-0.03em] md:text-[84px]">
              Use all AI models, together at last
            </h3>
            <p className="mt-6 text-[18px] leading-tight text-white/78">
              AI models and professional editing tools in one node-based platform. Turn creative vision into scalable
              workflows without compromising quality.
            </p>
          </div>

          <div className="grid gap-2 text-[38px] leading-[0.92] tracking-[-0.03em] text-white/90 md:text-[62px]">
            {models.map((model, idx) => (
              <div key={model} className={idx === 0 ? "text-[#edf79f]" : ""}>
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080b13] py-16 md:py-22">
        <div className="mx-auto max-w-[1320px] px-4 md:px-8">
          <div className="text-center">
            <h3 className="text-[36px] font-medium leading-[1] tracking-[-0.03em] md:text-[62px]">
              With all the professional tools you rely on
            </h3>
            <div className="mt-2 text-[18px] text-white/70">In one seamless workflow</div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-[#111624] p-6 md:p-8">
            <div className="grid grid-cols-2 gap-3 text-[14px] md:grid-cols-4 lg:grid-cols-6">
              {tools.map((tool) => (
                <div
                  key={tool}
                  className="rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-center text-white/86"
                >
                  {tool}
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/15">
              <video
                src="/samples/sample-demo.mp4"
                {...videoProps}
                className="h-[230px] w-full object-cover [transform:translateZ(0)] md:h-[420px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d111d] py-16 md:py-22">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 md:grid-cols-[1fr_1.1fr] md:px-8">
          <div>
            <h3 className="text-[44px] font-medium leading-[0.95] tracking-[-0.03em] md:text-[68px]">Control the Outcome</h3>
            <p className="mt-5 max-w-xl text-[18px] text-white/76">
              Layers, type, and blends all the tools to bring your wildest ideas to life. Your creativity, our
              compositing power.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
              <Image src="/samples/sample-product.png" alt="layer editor" width={1280} height={720} className="h-full w-full object-cover" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
              <video
                src="/samples/sample-demo.mp4"
                {...videoProps}
                className="h-full w-full object-cover [transform:translateZ(0)]"
              />
            </div>
            <div className="col-span-2 overflow-hidden rounded-2xl border border-white/15 bg-black/30">
              <Image src="/samples/sample-product.png" alt="final output board" width={1280} height={720} className="h-[230px] w-full object-cover md:h-[300px]" />
            </div>
          </div>
        </div>
      </section>

      <section id="enterprise" className="bg-[#efefef] py-16 text-black md:py-24">
        <div className="mx-auto max-w-[1320px] px-4 md:px-8">
          <div className="mb-6 text-[15px] text-black/70">
            Maximize your team ability, by automatically generating a simplified UI
          </div>
          <div className="flex flex-wrap items-center gap-5 md:gap-9">
            <h3 className="text-[50px] font-medium leading-none tracking-[-0.04em] md:text-[88px]">From Workflow</h3>
            <div className="h-14 w-24 rounded-full bg-[#e5ef91] p-2">
              <div className="h-10 w-10 rounded-full bg-black" />
            </div>
            <h3 className="text-[50px] font-medium leading-none tracking-[-0.04em] text-black/36 md:text-[88px]">
              to App Mode
            </h3>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-black/10">
            <video
              src="/samples/sample-demo.mp4"
              {...videoProps}
              className="h-[280px] w-full object-cover [transform:translateZ(0)] md:h-[520px]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#0a0d15] py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-4 md:px-8">
          <h3 className="text-[44px] font-medium leading-[0.95] tracking-[-0.03em] md:text-[70px]">Explore Our Workflows</h3>
          <p className="mt-4 max-w-3xl text-[18px] text-white/76">
            From multi-layer compositing to matte manipulation, Axe keeps up with your creativity with all the
            editing tools you recognize and rely on.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {workflows.map((workflow) => (
              <article key={workflow} className="overflow-hidden rounded-2xl border border-white/12 bg-[#141926]">
                <Image
                  src="/samples/sample-product.png"
                  alt={workflow}
                  width={800}
                  height={450}
                  className="h-[180px] w-full object-cover"
                />
                <div className="p-4">
                  <h4 className="text-[17px] text-white/92">{workflow}</h4>
                  <Link
                    href="/builder"
                    className="mt-4 inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.09em] text-[#eef79e] hover:text-[#f8ffbe]"
                  >
                    Try
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer id="pricing" className="relative overflow-hidden bg-[#2a2d36] text-white">
        <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-16 md:px-8 md:pt-24">
          <div className="max-w-4xl text-[50px] leading-[0.92] tracking-[-0.04em] md:text-[96px]">
            Artificial Intelligence + Human Creativity
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="max-w-md text-[14px] text-white/85">
                Axe is a new way to create. We&apos;re bridging the gap between AI capabilities and human creativity,
                to continue the tradition of craft in artistic expression.
              </p>
              <div className="mt-8 text-[12px] text-white/60">AXE © 2026. All rights reserved.</div>
            </div>

            <div id="demo" className="grid grid-cols-2 gap-8 text-[13px] text-white/78">
              <div className="space-y-2">
                <div className="text-[11px] uppercase text-white/45">Get Started</div>
                <a href="#demo" className="block hover:text-white">
                  Request a Demo
                </a>
                <a href="#pricing" className="block hover:text-white">
                  Pricing
                </a>
                <a href="#enterprise" className="block hover:text-white">
                  Enterprise
                </a>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] uppercase text-white/45">Resources</div>
                <Link href="/workflows" className="block hover:text-white">
                  Workflow Library
                </Link>
                <Link href="/builder" className="block hover:text-white">
                  Builder
                </Link>
                <Link href="/sign-in?redirect_url=/workflows" className="block hover:text-white">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/sign-in?redirect_url=/workflows"
          className="group relative m-4 inline-flex h-[60px] items-center gap-2 overflow-hidden bg-[#eef79e] px-7 text-[21px] font-medium text-black shadow-[0_10px_32px_rgba(238,247,158,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f8ffbe] hover:shadow-[0_14px_36px_rgba(238,247,158,0.35)] md:absolute md:bottom-6 md:right-6 md:m-0 md:text-[28px]"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-[125%] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-[125%]" />
          <span className="relative">Start Now</span>
          <ArrowRight className="relative h-6 w-6 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </footer>
    </main>
  );
}
