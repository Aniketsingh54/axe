"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  "Minimax image 01",
  "Hunyuan",
  "Bria",
];

const toolChips = [
  { label: "Crop", left: "14%", top: "36%", dx: -24, dy: -22 },
  { label: "Invert", left: "31%", top: "43%", dx: -18, dy: 16 },
  { label: "Outpaint", left: "25%", top: "51%", dx: 14, dy: -12 },
  { label: "Inpaint", left: "16%", top: "59%", dx: -20, dy: 18 },
  { label: "Mask Extractor", left: "31%", top: "66%", dx: -16, dy: 10 },
  { label: "Upscale", left: "25%", top: "74%", dx: -24, dy: 10 },
  { label: "Image Describer", left: "68%", top: "53%", dx: 14, dy: -12 },
  { label: "Channels", left: "75%", top: "47%", dx: 26, dy: 8 },
  { label: "Painter", left: "79%", top: "36%", dx: 20, dy: -14 },
  { label: "Relight", left: "77%", top: "66%", dx: 22, dy: 16 },
  { label: "Z Depth Extractor", left: "63%", top: "74%", dx: 24, dy: 8 },
] as const;

const workflowCards = [
  {
    src: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681f925d9ecbfaf69c5dc15e_Workflow%2001.avif",
    title: "Multiple Models",
  },
  {
    src: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681f925d9ecbfaf69c5dc164_Workflow%2003.avif",
    title: "Wan LoRa Inflate",
  },
  {
    src: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681f925d9ecbfaf69c5dc16a_Workflow%2002.avif",
    title: "ControlNet - Structure",
  },
  {
    src: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681f925d9ecbfaf69c5dc170_Workflow%2004.avif",
    title: "Camera Angle Control",
  },
  {
    src: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6825b0ac04c55a803826a6e5_Relight%20-%20Product.avif",
    title: "Relight - Product",
  },
  {
    src: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6825b0acc901ee5c718efc90_Wan%20Lora%20-%20Rotate.avif",
    title: "Wan LoRa - Rotate",
  },
];

const socialLinks = ["in", "ig", "x", "yt"];

const videoProps = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: "metadata" as const,
  poster:
    "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6835ce8a653081a97d92eebd_VIDEO_hero_Desktop.avif",
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function sectionProgress(el: HTMLElement | null) {
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return clamp((vh - rect.top) / (vh + rect.height));
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [collectiveProgress, setCollectiveProgress] = useState(0);
  const [toolsProgress, setToolsProgress] = useState(0);
  const [outcomeProgress, setOutcomeProgress] = useState(0);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [workflowsProgress, setWorkflowsProgress] = useState(0);
  const [footerProgress, setFooterProgress] = useState(0);

  const collectiveRef = useRef<HTMLElement | null>(null);
  const toolsRef = useRef<HTMLElement | null>(null);
  const outcomeRef = useRef<HTMLElement | null>(null);
  const workflowRef = useRef<HTMLElement | null>(null);
  const workflowsRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef({ c: 0, t: 0, o: 0, w: 0, s: 0, f: 0 });

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const parallaxNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
    );

    revealTargets.forEach((el) => observer.observe(el));

    const syncState = (key: keyof typeof progressRef.current, next: number, set: (v: number) => void) => {
      if (Math.abs(progressRef.current[key] - next) > 0.014) {
        progressRef.current[key] = next;
        set(next);
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsScrolled(y > 64);

        const c = sectionProgress(collectiveRef.current);
        const t = sectionProgress(toolsRef.current);
        const o = sectionProgress(outcomeRef.current);
        const w = sectionProgress(workflowRef.current);
        const s = sectionProgress(workflowsRef.current);
        const f = sectionProgress(footerRef.current);

        syncState("c", c, setCollectiveProgress);
        syncState("t", t, setToolsProgress);
        syncState("o", o, setOutcomeProgress);
        syncState("w", w, setWorkflowProgress);
        syncState("s", s, setWorkflowsProgress);
        syncState("f", f, setFooterProgress);

        parallaxNodes.forEach((node) => {
          const speed = Number(node.dataset.parallax ?? "0");
          const offset = Math.max(-28, Math.min(44, y * speed));
          node.style.transform = `translate3d(0, ${offset}px, 0)`;
        });

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const activeModelIndex = useMemo(
    () => Math.max(0, Math.min(models.length - 1, Math.round(collectiveProgress * (models.length - 1)))),
    [collectiveProgress]
  );

  const mergeProgress = clamp((workflowProgress - 0.18) / 0.48);
  const scatterOpacity = clamp(1 - mergeProgress * 1.2);
  const mergeOpacity = clamp((mergeProgress - 0.1) / 0.9);
  const footerCtaVisible = footerProgress > 0.22;

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-black">
      <header className="relative z-30 border-b border-black/8 bg-[#dfe3e8] px-4 md:px-8">
        <div className="mx-auto flex h-[58px] max-w-[1520px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[linear-gradient(180deg,#1f1f1f_0_45%,transparent_45%_55%,#1f1f1f_55%_100%)]" />
            <div className="border-r border-black/25 pr-4 text-[15px] uppercase tracking-[0.03em]">AXE</div>
            <div className="text-[15px] uppercase leading-[0.95] tracking-[0.03em]">
              ARTISTIC
              <br />
              INTELLIGENCE
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-[13px] uppercase tracking-[0.04em] text-black/70 lg:flex">
            <a href="#collective" className="hover:text-black">Collective</a>
            <a href="#enterprise" className="hover:text-black">Enterprise</a>
            <a href="#pricing" className="hover:text-black">Pricing</a>
            <a href="#demo" className="hover:text-black">Request a Demo</a>
            <Link href="/sign-in?redirect_url=/workflows" className="hover:text-black">Sign In</Link>
          </nav>
        </div>
      </header>

      <Link
        href="/sign-in?redirect_url=/workflows"
        className={`fixed right-0 z-40 hidden items-center justify-center bg-[#eef79e] leading-none text-black transition-all duration-300 ease-out hover:bg-[#f7ffbf] sm:inline-flex ${
          isScrolled
            ? "top-2 h-[34px] w-[92px] rounded-bl-lg text-[14px] tracking-[-0.01em]"
            : "top-[58px] h-[112px] w-[255px] text-[56px] tracking-[-0.04em]"
        }`}
      >
        Start Now
      </Link>

      <section
        className="relative overflow-hidden px-4 pb-8 pt-14 md:px-8 md:pt-20"
        style={{
          backgroundImage:
            "linear-gradient(0deg, #ffffff4d 34%, #c1cdd559 71%), url('https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681ccdbeb607e939f7db68fa_BG%20NET%20Hero.avif')",
          backgroundPosition: "0 0, 50%",
          backgroundSize: "auto, cover",
        }}
      >
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative mx-auto max-w-[1520px]">
          <div className="grid gap-8 md:grid-cols-[0.92fr_1.08fr]">
            <h1 className="text-[clamp(78px,10vw,132px)] font-medium leading-[0.88] tracking-[-0.045em]" data-reveal>
              Axe
            </h1>
            <div>
              <h2 className="text-[clamp(78px,10vw,132px)] font-medium leading-[0.88] tracking-[-0.05em]" data-reveal style={{ transitionDelay: "100ms" }}>
                Artistic Intelligence
              </h2>
              <p className="mt-8 max-w-[650px] text-[38px] leading-[1.03] tracking-[-0.015em] text-black/70 max-lg:text-[24px] max-md:text-[18px]" data-reveal style={{ transitionDelay: "180ms" }}>
                Turn your creative vision into scalable workflows. Access all AI models and professional editing tools in one node based platform.
              </p>
            </div>
          </div>

          <div className="relative mt-16 grid grid-cols-12 gap-4 rounded-2xl bg-[linear-gradient(180deg,#f7f7f5_0%,#edeceb_45%,#dbe1dd_100%)] p-4 pb-6" data-reveal>
            <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 1200 620" preserveAspectRatio="none" aria-hidden="true">
              <path d="M150 132 C 275 132, 290 175, 390 200" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M180 430 C 285 430, 305 252, 390 206" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M560 200 C 650 205, 680 220, 770 218" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M560 205 C 650 240, 700 300, 770 355" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M890 218 C 975 220, 1000 150, 1050 140" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M890 355 C 980 332, 1005 242, 1050 184" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
            </svg>

            <article className="col-span-3 overflow-hidden rounded-xl border border-black/8 bg-[#adb5bc] max-lg:col-span-5 max-md:col-span-6" data-parallax="0.014">
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">3D Rodin 2.0</div>
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681cd65ba87c69df161752e5_3d_card.avif" alt="3D model card" className="h-[232px] w-full object-cover" />
            </article>

            <article className="col-span-6 row-span-2 overflow-hidden rounded-xl border border-black/8 bg-[#dbd7d6] max-lg:col-span-7 max-md:col-span-12" data-parallax="0.009">
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Image Stable Diffusion</div>
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681cd7cbc22419b32bb9d8d8_hcard%20-%20STABLE%20DIFFUSION.avif" alt="Stable diffusion card" className="h-[560px] w-full object-cover max-md:h-[420px]" />
            </article>

            <article className="col-span-3 rounded-xl border border-black/8 bg-[#f4f4f4] p-3 text-black/60 max-lg:col-span-7 max-md:col-span-12" data-parallax="0.01">
              <div className="text-[11px] uppercase tracking-[0.2em] text-black/80">Text</div>
              <p className="mt-2 text-[13px] leading-tight">A Great-Tailed Grackle bird is flying from background and settling on the model&apos;s shoulder.</p>
            </article>

            <article className="col-span-3 overflow-hidden rounded-xl border border-black/8 bg-[#bbc5b8] max-lg:col-span-5 max-md:col-span-6" data-parallax="0.018">
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Color Reference</div>
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681cd77722078ff43fe428f3_hcard-color%20reference.avif" alt="Color reference card" className="h-[110px] w-full object-cover" />
            </article>

            <article className="col-span-3 row-span-2 overflow-hidden rounded-xl border border-black/8 bg-[#ddd8d8] max-lg:col-span-5 max-md:col-span-6" data-parallax="0.012">
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Video Minimax Video</div>
              <video src="https://assets.weavy.ai/homepage/hero/hero_video.mp4" {...videoProps} className="h-[560px] w-full object-cover max-md:h-[420px]" />
            </article>

            <article className="col-span-3 overflow-hidden rounded-xl border border-black/8 bg-[#c7cebe] max-lg:col-span-7 max-md:col-span-6" data-parallax="0.018">
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Image Flux Pro 1.1</div>
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6837510acbe777269734b387_bird_desktop.avif" alt="Bird reference card" className="h-[266px] w-full object-cover" />
            </article>
          </div>
        </div>
      </section>

      <section
        ref={collectiveRef}
        id="collective"
        className="relative overflow-hidden px-4 py-20 text-white md:px-8"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(20,28,40,0.64), rgba(20,28,40,0.22), rgba(20,28,40,0.56)), url('https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6825887e82ac8a8bb8139ebd_GPT%20img%201.avif')",
          backgroundPosition: "50% 50%",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto grid max-w-[1520px] gap-10 md:grid-cols-[1fr_1.15fr]">
          <div>
            <h3 className="max-w-[530px] text-[70px] leading-[0.88] tracking-[-0.035em] max-lg:text-[48px]" data-reveal>
              Use all AI models, together at last
            </h3>
            <p className="mt-8 max-w-[530px] text-[32px] leading-[1.04] tracking-[-0.02em] text-white/82 max-lg:text-[20px]" data-reveal>
              AI models and professional editing tools in one node-based platform. Turn creative vision into scalable workflows without compromising quality.
            </p>
          </div>

          <div className="grid gap-1 text-[76px] leading-[0.92] tracking-[-0.04em] max-lg:text-[48px]" style={{ transform: `translateY(${(0.5 - collectiveProgress) * 110}px)` }}>
            {models.map((model, idx) => (
              <div key={model} className={idx === activeModelIndex ? "text-[#edf79f]" : "text-white/94"} style={{ opacity: idx < activeModelIndex - 2 || idx > activeModelIndex + 6 ? 0.45 : 1, transition: "color 220ms ease, opacity 220ms ease" }}>
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={toolsRef} className="relative overflow-hidden bg-[#f7f8f8] px-4 py-24 md:px-8" data-reveal>
        <div className="mx-auto max-w-[1520px]">
          <div className="text-center">
            <h2 className="text-[clamp(64px,9vw,118px)] leading-[0.9] tracking-[-0.05em]">With all the professional tools you rely on</h2>
            <p className="mt-5 text-[32px] text-black/70 max-md:text-[20px]">In one seamless workflow</p>
          </div>

          <div className="relative mx-auto mt-16 h-[600px] w-full max-w-[1180px] max-lg:h-[520px]">
            <img
              src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68223c9e9705b88c35e76dec_Default%402x.avif"
              alt="Tools preview"
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-[0_20px_45px_rgba(0,0,0,0.12)] max-lg:h-[320px] max-lg:w-[320px]"
              style={{
                opacity: clamp((toolsProgress - 0.02) / 0.7),
                transform: `translate(-50%, calc(-50% + ${(1 - toolsProgress) * 42}px)) scale(${0.9 + toolsProgress * 0.12})`,
              }}
            />

            {toolChips.map((chip, idx) => (
              <div
                key={chip.label}
                className="absolute rounded-md bg-white px-3 py-1.5 text-[14px] text-black/78 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                style={{
                  left: chip.left,
                  top: chip.top,
                  opacity: clamp((toolsProgress - 0.08) * 1.5),
                  transform: `translate3d(${(1 - toolsProgress) * chip.dx}px, ${(1 - toolsProgress) * chip.dy}px, 0) scale(${0.94 + toolsProgress * 0.1})`,
                  transitionDelay: `${idx * 35}ms`,
                }}
              >
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={outcomeRef} className="relative overflow-hidden bg-[#f7f8f8] px-4 pb-20 pt-8 md:px-8" data-reveal>
        <div className="mx-auto max-w-[1520px]">
          <div className="text-center">
            <h2 className="text-[clamp(64px,9vw,114px)] leading-[0.9] tracking-[-0.05em]">Control the Outcome</h2>
            <p className="mx-auto mt-5 max-w-[960px] text-[32px] text-black/70 max-md:text-[20px]">Layers, type, and blends all the tools to bring your wildest ideas to life. Your creativity, our compositing power.</p>
          </div>

          <div className="relative mx-auto mt-12 w-full max-w-[1320px] overflow-hidden rounded-2xl border border-black/10">
            <img
              src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682ee0eea4106dbd4133065d_Weavy%20UI.avif"
              alt="Outcome editor"
              className="w-full"
              style={{
                transform: `translateY(${(1 - outcomeProgress) * 44}px) scale(${0.95 + outcomeProgress * 0.05})`,
                opacity: clamp((outcomeProgress - 0.04) / 0.7),
              }}
            />
          </div>
        </div>
      </section>

      <section ref={workflowRef} id="enterprise" className="relative overflow-hidden bg-[#f7f8f8] px-4 py-20 md:px-8" data-reveal>
        <div className="mx-auto max-w-[1520px]">
          <div className="text-[15px] text-black/68">Maximize your team ability, by automatically generating a simplified UI</div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <h3 className="text-[88px] leading-none tracking-[-0.05em] text-black/30 max-lg:text-[64px]">From Workflow</h3>
            <div className="h-14 w-24 rounded-full bg-[#e5ef91] p-2"><div className="h-10 w-10 rounded-full bg-black" /></div>
            <h3 className="text-[88px] leading-none tracking-[-0.05em] text-black max-lg:text-[64px]">to App Mode</h3>
          </div>

          <div className="relative mt-12 min-h-[620px] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#f3f5f5_0%,#edf1f1_100%)] max-lg:min-h-[520px]">
            <div
              className="absolute inset-0"
              style={{
                opacity: scatterOpacity,
                transform: `translateY(${mergeProgress * -16}px) scale(${1 - mergeProgress * 0.04})`,
                pointerEvents: "none",
              }}
            >
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b7678811e48ff42f7db_Frame%20427321160.avif" alt="Prompt card" className="absolute left-[9%] top-[36%] w-[240px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:w-[180px]" />
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b76a834003529b7f5d7_Group%207798.avif" alt="Image card" className="absolute left-[45%] top-[20%] w-[126px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:w-[92px]" />
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b761ffbb948a3e6f9e0_Frame%20427321155.avif" alt="Color style reference" className="absolute left-[62%] top-[26%] w-[156px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:w-[112px]" />
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b7668cc066c00b3d2a2_Frame%20427321159.avif" alt="Image reference" className="absolute left-[20%] top-[72%] w-[126px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:w-[92px]" />
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b764367eac325e77daa_Frame%20427321158.avif" alt="Gemini V2" className="absolute left-[35%] top-[74%] w-[126px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:w-[92px]" />
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b76e100d9cf8cc06b34_Frame%20427321157.avif" alt="Purple tree" className="absolute left-[50%] top-[75%] w-[126px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:w-[92px]" />
              <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b763488bd282a6e4f3f_Frame%20427321156.avif" alt="Output card" className="absolute left-[68%] top-[45%] w-[340px] rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.08)] max-lg:left-[62%] max-lg:w-[220px]" />
            </div>

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: mergeOpacity,
                transform: `translateY(${(1 - mergeOpacity) * 56}px) scale(${0.93 + mergeOpacity * 0.07})`,
                pointerEvents: "none",
              }}
            >
              <div className="grid w-[860px] grid-cols-[230px_1fr] overflow-hidden rounded-xl bg-white shadow-[0_18px_42px_rgba(0,0,0,0.08)] max-lg:w-[92%] max-lg:grid-cols-[190px_1fr]">
                <div>
                  <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b7678811e48ff42f7db_Frame%20427321160.avif" alt="Prompt" className="w-full" />
                  <div className="grid h-[100px] place-items-center border-r border-black/6 text-[36px] tracking-[-0.02em] text-black/88 max-lg:text-[24px]">RUN</div>
                </div>
                <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b763488bd282a6e4f3f_Frame%20427321156.avif" alt="Output" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={workflowsRef} className="bg-[#202228] px-4 py-20 text-white md:px-8" data-reveal>
        <div className="mx-auto max-w-[1520px] overflow-hidden">
          <h2 className="text-[clamp(62px,8vw,108px)] leading-[0.9] tracking-[-0.04em]">Explore Our Workflows</h2>
          <p className="mt-5 max-w-[900px] text-[30px] text-white/76 max-md:text-[19px]">From multi-layer compositing to matte manipulation, Axe keeps up with your creativity with all the editing tools you recognize and rely on.</p>

          <div className="mt-12" style={{ transform: `translateX(${(1 - workflowsProgress) * 110}px)` }}>
            <div className="mb-5 flex items-center gap-2 text-white/75">
              <button className="grid h-10 w-10 place-items-center rounded-md border border-white/25">←</button>
              <button className="grid h-10 w-10 place-items-center rounded-md border border-white/25">→</button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {workflowCards.map((card, idx) => (
                <article key={card.title} className="min-w-[320px] max-w-[320px] rounded-xl bg-[#13151b] p-2" style={{ opacity: clamp(workflowsProgress + idx * 0.08) }}>
                  <div className="mb-2 text-[14px] text-white/86">{card.title}</div>
                  <img src={card.src} alt={card.title} className="h-[190px] w-full rounded-lg object-cover" />
                  <a className="mt-2 inline-block rounded-sm bg-[#eef79e] px-3 py-1 text-[13px] text-black" href="/builder">Try</a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer ref={footerRef} id="pricing" className="relative overflow-hidden bg-[#202228] px-4 pb-20 pt-4 text-white md:px-8" data-reveal>
        <div className="mx-auto max-w-[1520px]">
          <div className="relative overflow-hidden rounded-[28px] bg-[#adb4a6] px-8 pb-12 pt-10 text-white md:px-14 md:pt-14" style={{ transform: `translateY(${(1 - footerProgress) * 44}px)` }}>
            <img src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682231a73b5be7ff98f935ac_footer%20Node.svg" alt="Footer node" className="pointer-events-none absolute right-0 top-1/2 w-[180px] -translate-y-1/2 translate-x-[72%] opacity-80" />

            <div className="grid max-w-[980px] grid-cols-[auto_auto_auto] items-end gap-4 text-[clamp(56px,7vw,104px)] leading-[0.9] tracking-[-0.04em]">
              <div>Artificial Intelligence</div>
              <div className="text-white/70">+</div>
              <div>Human Creativity</div>
            </div>

            <div className="mt-12 grid gap-9 md:grid-cols-[1.1fr_1fr]">
              <div>
                <div className="mb-4 text-[16px] uppercase tracking-[0.08em]">AXE | Artistic Intelligence</div>
                <p className="max-w-md text-[14px] text-white/88">Axe is a new way to create. We&apos;re bridging the gap between AI capabilities and human creativity to continue the tradition of craft in artistic expression.</p>
                <div className="mt-8 text-[12px] text-white/75">AXE © 2026. All rights reserved.</div>
              </div>

              <div id="demo" className="grid grid-cols-4 gap-6 text-[13px] text-white/86">
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-white/75">Get Started</div>
                  <a href="#demo" className="block hover:text-white">Request a Demo</a>
                  <a href="#pricing" className="block hover:text-white">Pricing</a>
                  <a href="#enterprise" className="block hover:text-white">Enterprise</a>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-white/75">Company</div>
                  <a href="#collective" className="block hover:text-white">About</a>
                  <a href="#pricing" className="block hover:text-white">Terms</a>
                  <a href="#pricing" className="block hover:text-white">Privacy</a>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-white/75">Connect</div>
                  <a href="#collective" className="block hover:text-white">Collective</a>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-white/75">Resources</div>
                  <Link href="/workflows" className="block hover:text-white">Workflows</Link>
                  <Link href="/builder" className="block hover:text-white">Builder</Link>
                  <Link href="/sign-in?redirect_url=/workflows" className="block hover:text-white">Sign In</Link>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a key={social} href="#" className="grid h-8 w-8 place-items-center rounded-full border border-white/45 text-[10px] uppercase text-white/86">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <Link
        href="/sign-in?redirect_url=/workflows"
        className={`fixed bottom-3 right-3 z-40 hidden items-center justify-center bg-[#eef79e] text-black transition-all duration-300 ease-out hover:bg-[#f7ffbf] md:inline-flex ${
          footerCtaVisible
            ? "h-[112px] w-[280px] text-[62px] tracking-[-0.04em]"
            : "pointer-events-none h-[92px] w-[220px] translate-y-14 opacity-0 text-[48px]"
        }`}
      >
        Start Now
      </Link>

      <style jsx>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
