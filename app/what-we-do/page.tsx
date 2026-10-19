import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ShapePanel } from "@/components/ui/ShapePanel";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "What We Do | NICBEN",
  description:
    "Three areas of work: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
};

type PillarIconName = "drafting" | "spanner" | "treasury";

function PillarIcon({
  name,
  className = "",
}: {
  name: PillarIconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "drafting" && (
        <>
          <path d="M3.75 20.25h16.5" />
          <path d="M6.75 20.25 12 3.75l5.25 16.5" />
          <path d="M8.9 14.25h6.2" />
        </>
      )}
      {name === "spanner" && (
        <>
          <path d="M9 3.75h6l1.65 3.75L15 11.25H9L7.35 7.5 9 3.75Z" />
          <path d="M12 11.25v9" />
        </>
      )}
      {name === "treasury" && (
        <>
          <path d="M3.75 9.75 12 4.5l8.25 5.25" />
          <path d="M6.75 10.5v9M10.5 10.5v9M13.5 10.5v9M17.25 10.5v9" />
          <path d="M5.25 20.25h13.5" />
        </>
      )}
    </svg>
  );
}

/**
 * Chamfer cut on the pillar image, per
 * docs/design/nicben_what_we_do/code.html lines 47 / 153 / 171 (a flat 48px
 * diagonal notch painted in the card surface colour). The build previously used
 * a plain `rounded-xl` frame, which dropped the design's signature cut.
 * Decorative only, so it is hidden from assistive technology.
 */
function Chamfer({ corner }: { corner: "tr" | "tl" }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 h-12 w-12 bg-surface pointer-events-none transition-colors duration-300 group-hover:bg-tint-50 ${
        corner === "tr" ? "right-0 chamfer-tr" : "left-0 chamfer-tl"
      }`}
    />
  );
}

export default function WhatWeDoPage() {
  return (
    <main className="min-h-screen">
      {/* 1. HERO SECTION */}
      <SectionWrapper background="surface" className="pt-8 sm:pt-12 pb-16 lg:pb-20 relative overflow-hidden">
        {/* Faint architectural grid with subtle shimmer */}
        <div
          className="absolute inset-0 pointer-events-none texture-grid opacity-75 motion-safe:animate-pulse"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <Reveal from="bottom" speed="base">
            <h1 className="text-display font-extrabold tracking-tight text-ink-950 mt-6 leading-tight heading-spark">
              What we do
            </h1>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={120}>
            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
              NICBEN works in three areas. Each is run as part of one privately owned
              Texas company.
            </p>
          </Reveal>

          {/* docs/03-copy-deck.md:44 fact card wording */}
          <Reveal from="bottom" speed="base" delay={240}>
            <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface border border-line text-xs font-semibold text-text-600 shadow-sm transition-transform duration-200 hover:scale-105 motion-reduce:hover:scale-100">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              <span>Texas LLC · Project-based · Serving clients in various U.S. states</span>
            </div>
          </Reveal>
        </div>
      </SectionWrapper>

      {/*
        2. THREE PILLAR FEATURE BLOCKS — D-001 equal recognition.
        Alternating layout with staggered entries, tactile hover lifts, chamfer highlight,
        and living icon scaling.
      */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="space-y-12 lg:space-y-16">
          {/* PILLAR 01: Project Management & Contracting (visual left, content right) */}
          <div className="group card-lift w-full bg-surface rounded-2xl border border-line hover:border-brand-500 transition-all duration-300 shadow-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Column — slides in from left */}
            <div className="lg:col-span-6">
              <Reveal from="left" speed="medium" threshold={0.2} margin="0px 0px -12% 0px" className="relative w-full rounded-xl overflow-hidden">
                <div className="overflow-hidden rounded-xl transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                  <ShapePanel
                    className="w-full h-[320px] sm:h-[400px] shadow-sm"
                    motif="blueprint"
                  />
                </div>
                <Chamfer corner="tr" />
              </Reveal>
            </div>

            {/* Content Column — fades up */}
            <div className="lg:col-span-6">
              <Reveal from="bottom" speed="medium" delay={140} threshold={0.2} margin="0px 0px -12% 0px" className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                      <PillarIcon name="drafting" className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                      Pillar 01
                    </span>
                  </div>

                  <h2 className="text-h2 font-bold text-ink-950 tracking-tight leading-snug">
                    Project Management &amp; Contracting
                  </h2>

                  <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
                    We coordinate construction-related projects, engaging qualified
                    contractors and technicians to carry out the work at your
                    location.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    withArrow
                    href="/what-we-do/project-management-contracting"
                  >
                    Project management and contracting
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>

          {/* PILLAR 02: Property Improvement & Maintenance (content left, visual right) */}
          <div className="group card-lift w-full bg-surface rounded-2xl border border-line hover:border-brand-500 transition-all duration-300 shadow-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Content Column (order 2 on mobile, order 1 on desktop) */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <Reveal from="bottom" speed="medium" delay={140} threshold={0.2} margin="0px 0px -12% 0px" className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                      <PillarIcon name="spanner" className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                      Pillar 02
                    </span>
                  </div>

                  <h2 className="text-h2 font-bold text-ink-950 tracking-tight leading-snug">
                    Property Improvement &amp; Maintenance
                  </h2>

                  <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
                    Improvement, renovation, plumbing and maintenance for residential
                    and commercial properties, carried out by qualified contractors
                    and technicians.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    withArrow
                    href="/what-we-do/property-improvement-maintenance"
                  >
                    Property improvement and maintenance
                  </Button>
                </div>
              </Reveal>
            </div>

            {/* Visual Column — slides in from right */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <Reveal from="right" speed="medium" threshold={0.2} margin="0px 0px -12% 0px" className="relative w-full rounded-xl overflow-hidden">
                <div className="overflow-hidden rounded-xl transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                  <ShapePanel
                    className="w-full h-[320px] sm:h-[400px] shadow-sm"
                    motif="drafting"
                  />
                </div>
                <Chamfer corner="tl" />
              </Reveal>
            </div>
          </div>

          {/* PILLAR 03: Corporate Treasury & Investments (visual left, content right) */}
          <div className="group card-lift w-full bg-surface rounded-2xl border border-line hover:border-brand-500 transition-all duration-300 shadow-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Column — slides in from left */}
            <div className="lg:col-span-6">
              <Reveal from="left" speed="medium" threshold={0.2} margin="0px 0px -12% 0px" className="relative w-full rounded-xl overflow-hidden">
                <div className="overflow-hidden rounded-xl transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                  <ShapePanel
                    className="w-full h-[320px] sm:h-[400px] shadow-sm"
                    motif="arcs"
                  />
                </div>
                <Chamfer corner="tr" />
              </Reveal>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-6">
              <Reveal from="bottom" speed="medium" delay={140} threshold={0.2} margin="0px 0px -12% 0px" className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                      <PillarIcon name="treasury" className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                      Pillar 03
                    </span>
                  </div>

                  <h2 className="text-h2 font-bold text-ink-950 tracking-tight leading-snug">
                    Corporate Treasury &amp; Investments
                  </h2>

                  <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
                    NICBEN manages its own corporate treasury and evaluates investment
                    opportunities using company-owned funds, solely for the
                    company&apos;s benefit.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    withArrow
                    href="/what-we-do/treasury-investments"
                  >
                    Corporate treasury and investments
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 4. CTA BAND */}
      <Reveal from="bottom" speed="base" threshold={0.2}>
        <SectionWrapper background="ink" className="border-t border-ink-950/40">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-h2 font-extrabold text-surface tracking-tight leading-tight heading-spark">
              Have a project or an enquiry? Talk to us.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-on-dark/80">
              Reach us by email, phone or message.
            </p>
            <div className="mt-8">
              <Button variant="accent" withArrow href="/contact">
                Get in Touch
              </Button>
            </div>
          </div>
        </SectionWrapper>
      </Reveal>
    </main>
  );
}
