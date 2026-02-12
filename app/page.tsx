"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
];

const videoProps = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: "metadata" as const,
  poster: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6835ce8a653081a97d92eebd_VIDEO_hero_Desktop.avif",
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFooterCompact, setIsFooterCompact] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
    );

    revealTargets.forEach((el) => observer.observe(el));

    const parallaxNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsScrolled(y > 52);

        if (footerRef.current) {
          const footerTop = footerRef.current.getBoundingClientRect().top;
          setIsFooterCompact(footerTop < window.innerHeight * 0.28);
        }

        parallaxNodes.forEach((node) => {
          const speed = Number(node.dataset.parallax ?? "0");
          const offset = Math.max(-32, Math.min(36, y * speed));
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

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-black">
      <header className="relative z-20 border-b border-black/8 bg-[#dfe3e8] px-4 md:px-8">
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
            <a href="#collective" className="hover:text-black">
              Collective
            </a>
            <a href="#enterprise" className="hover:text-black">
              Enterprise
            </a>
            <a href="#pricing" className="hover:text-black">
              Pricing
            </a>
            <a href="#demo" className="hover:text-black">
              Request a Demo
            </a>
            <Link href="/sign-in?redirect_url=/workflows" className="hover:text-black">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <Link
        href="/sign-in?redirect_url=/workflows"
        className={`group fixed right-0 z-40 hidden items-center justify-center bg-[#eef79e] leading-none text-black transition-all duration-300 ease-out hover:bg-[#f7ffbf] sm:inline-flex ${
          isScrolled
            ? "top-2 h-[56px] w-[160px] rounded-bl-lg text-[34px] tracking-[-0.03em]"
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
            <h1 className="text-[clamp(78px,10vw,132px)] font-medium leading-[0.88] tracking-[-0.045em]">Axe</h1>
            <div>
              <h2 className="text-[clamp(78px,10vw,132px)] font-medium leading-[0.88] tracking-[-0.05em]">
                Artistic Intelligence
              </h2>
              <p className="mt-8 max-w-[650px] text-[38px] leading-[1.03] tracking-[-0.015em] text-black/70 max-lg:text-[24px] max-md:text-[18px]">
                Turn your creative vision into scalable workflows. Access all AI models and professional editing tools
                in one node based platform.
              </p>
            </div>
          </div>

          <div
            className="relative mt-16 grid grid-cols-12 gap-4 rounded-2xl bg-[linear-gradient(180deg,#f7f7f5_0%,#edeceb_45%,#dbe1dd_100%)] p-4 pb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            data-reveal
          >
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
              viewBox="0 0 1200 620"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M150 132 C 275 132, 290 175, 390 200" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M180 430 C 285 430, 305 252, 390 206" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M560 200 C 650 205, 680 220, 770 218" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M560 205 C 650 240, 700 300, 770 355" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M890 218 C 975 220, 1000 150, 1050 140" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <path d="M890 355 C 980 332, 1005 242, 1050 184" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
              <circle cx="150" cy="132" r="5.3" fill="#e5e5e5" stroke="#fff" />
              <circle cx="180" cy="430" r="5.3" fill="#e5e5e5" stroke="#fff" />
              <circle cx="390" cy="200" r="5.3" fill="#e5e5e5" stroke="#fff" />
              <circle cx="560" cy="205" r="5.3" fill="#e5e5e5" stroke="#fff" />
              <circle cx="770" cy="218" r="5.3" fill="#e5e5e5" stroke="#fff" />
              <circle cx="770" cy="355" r="5.3" fill="#e5e5e5" stroke="#fff" />
              <circle cx="1050" cy="140" r="5.3" fill="#e5e5e5" stroke="#fff" />
            </svg>

            <article
              className="col-span-3 overflow-hidden rounded-xl border border-black/8 bg-[#adb5bc] max-lg:col-span-5 max-md:col-span-6"
              data-parallax="0.015"
            >
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">3D Rodin 2.0</div>
              <img
                src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681cd65ba87c69df161752e5_3d_card.avif"
                alt="3D model card"
                className="h-[232px] w-full object-cover"
              />
            </article>

            <article
              className="col-span-6 row-span-2 overflow-hidden rounded-xl border border-black/8 bg-[#dbd7d6] max-lg:col-span-7 max-md:col-span-12"
              data-parallax="0.009"
            >
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Image Stable Diffusion</div>
              <img
                src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681cd7cbc22419b32bb9d8d8_hcard%20-%20STABLE%20DIFFUSION.avif"
                alt="Stable diffusion card"
                className="h-[560px] w-full object-cover max-md:h-[420px]"
              />
            </article>

            <article
              className="col-span-3 rounded-xl border border-black/8 bg-[#f4f4f4] p-3 text-black/60 max-lg:col-span-7 max-md:col-span-12"
              data-parallax="0.011"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-black/80">Text</div>
              <p className="mt-2 text-[13px] leading-tight">
                A Great-Tailed Grackle bird is flying from background and settling on the model&apos;s shoulder.
              </p>
            </article>

            <article
              className="col-span-3 overflow-hidden rounded-xl border border-black/8 bg-[#bbc5b8] max-lg:col-span-5 max-md:col-span-6"
              data-parallax="0.02"
            >
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Color Reference</div>
              <img
                src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681cd77722078ff43fe428f3_hcard-color%20reference.avif"
                alt="Color reference card"
                className="h-[110px] w-full object-cover"
              />
            </article>

            <article
              className="col-span-3 row-span-2 overflow-hidden rounded-xl border border-black/8 bg-[#ddd8d8] max-lg:col-span-5 max-md:col-span-6"
              data-parallax="0.013"
            >
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Video Minimax Video</div>
              <video
                src="https://assets.weavy.ai/homepage/hero/hero_video.mp4"
                {...videoProps}
                className="h-[560px] w-full object-cover max-md:h-[420px]"
              />
            </article>

            <article
              className="col-span-3 overflow-hidden rounded-xl border border-black/8 bg-[#c7cebe] max-lg:col-span-7 max-md:col-span-6"
              data-parallax="0.02"
            >
              <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-black/80">Image Flux Pro 1.1</div>
              <img
                src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6837510acbe777269734b387_bird_desktop.avif"
                alt="Bird reference card"
                className="h-[266px] w-full object-cover"
              />
            </article>
          </div>
        </div>
      </section>

      <section id="collective" className="bg-[#060b1a] px-4 py-20 text-white md:px-8" data-reveal>
        <div className="mx-auto grid max-w-[1520px] gap-10 md:grid-cols-[1fr_1.1fr]">
          <h3 className="text-[54px] leading-[0.92] tracking-[-0.03em] md:text-[90px]">
            Use all AI models, together at last
          </h3>
          <div className="grid gap-2 text-[42px] leading-[0.92] tracking-[-0.03em] md:text-[74px]">
            {models.map((model, idx) => (
              <div key={model} className={idx === 0 ? "text-[#edf79f]" : "text-white/94"}>
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enterprise" className="bg-[#efefef] px-4 py-20 text-black md:px-8" data-reveal>
        <div className="mx-auto max-w-[1520px]">
          <div className="text-[15px] text-black/68">Maximize your team ability, by automatically generating a simplified UI</div>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <h3 className="text-[52px] leading-none tracking-[-0.04em] md:text-[92px]">From Workflow</h3>
            <div className="h-14 w-24 rounded-full bg-[#e5ef91] p-2">
              <div className="h-10 w-10 rounded-full bg-black" />
            </div>
            <h3 className="text-[52px] leading-none tracking-[-0.04em] text-black/35 md:text-[92px]">to App Mode</h3>
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl border border-black/10">
            <video src="/samples/sample-demo.mp4" {...videoProps} className="h-[260px] w-full object-cover md:h-[520px]" />
          </div>
        </div>
      </section>

      <footer
        ref={footerRef}
        id="pricing"
        className="relative overflow-hidden border-t border-white/10 bg-[#292b33] px-4 pb-14 pt-16 text-white md:px-8 md:pt-24"
        data-reveal
      >
        <Link
          href="/sign-in?redirect_url=/workflows"
          className={`absolute right-0 top-0 z-20 hidden items-center justify-center bg-[#eef79e] leading-none text-black transition-all duration-300 ease-out hover:bg-[#f7ffbf] sm:inline-flex ${
            isFooterCompact
              ? "h-[58px] w-[162px] rounded-bl-lg text-[34px] tracking-[-0.03em]"
              : "h-[106px] w-[242px] text-[56px] tracking-[-0.04em]"
          }`}
        >
          Start Now
        </Link>

        <div className="mx-auto max-w-[1520px]">
          <div className="max-w-5xl text-[52px] leading-[0.9] tracking-[-0.04em] md:text-[112px]">
            Artificial Intelligence + Human Creativity
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="max-w-md text-[14px] text-white/88">
                We bridge the gap between AI capabilities and human creativity while preserving craftsmanship in modern
                digital workflows.
              </p>
              <div className="mt-10 text-[12px] text-white/58">AXE © 2026. All rights reserved.</div>
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
      </footer>

      <style jsx>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(22px);
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
