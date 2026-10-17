import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "What We Do | NICBEN",
  description:
    "Three areas of work: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
};

export default function WhatWeDoPage() {
  return (
    <main className="min-h-screen">
      {/* 1. HERO SECTION */}
      <SectionWrapper background="tint-50" className="pt-8 sm:pt-12 pb-16 lg:pb-20 relative overflow-hidden">
        {/* Architectural drafting grid background accent */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0A5F77 1px, transparent 1px), linear-gradient(to bottom, #0A5F77 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <EyebrowChip dotColor="teal">Overview</EyebrowChip>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-950 mt-6 leading-tight heading-spark">
            What we do
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            NICBEN works in three areas. Each is run as part of one privately owned
            Texas company.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface border border-line text-xs font-semibold text-text-600 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
            <span>Texas LLC · Project-Based Execution · Corporate Treasury</span>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. THREE PILLAR FEATURE BLOCKS (Strict Equal Weight Rule from docs/design/what_we_do) */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="space-y-12 lg:space-y-16">
          {/* PILLAR 01: Project Management & Contracting (Image Left, Content Right) */}
          <div className="w-full bg-surface rounded-2xl border border-line shadow-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Column */}
            <div className="lg:col-span-6 relative w-full h-[320px] sm:h-[400px] rounded-xl overflow-hidden bg-tint-100 shadow-sm group">
              <img
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                alt="Commercial construction site engineering review with technical blueprints and structural framing"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKib9Qh2cYQ5lyHuy2OEx2ERxjNFhvbRtWDxqSQ1EHr9xKRpzSmjCdMHRlXuxNUeE0Eyog1RNIsf-ofD7zoXcVKEy9_8sSiwA1Ue1n88jqzv3yZQ1pMarffjIbCxbCygYRDOeBRrVWdiNSMm7-Q1g64U7lfS1OUOuXMr89dG0u8cYH1DVlCMIBaia3irfjsmIRol7vGeL0D9XVJoDnlPjwwzeFOhN29eWeav8fLCUrP_cdQ_N5s0MzUg"
              />
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-ink-950/80 backdrop-blur-sm rounded text-surface text-[11px] font-semibold tracking-wider uppercase">
                SEC. 01 / SPEC
              </div>
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface/95 backdrop-blur-md rounded-pill shadow-card border border-line">
                <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink-950 uppercase tracking-wider">
                  Field Coordination
                </span>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tint-100 rounded-pill">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-700 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-brand-700 tracking-widest uppercase">
                    Pillar 01
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink-950 tracking-tight leading-snug">
                  Project Management &amp; Contracting
                </h2>

                <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
                  We coordinate construction-related projects, engaging qualified
                  contractors and technicians to carry out the work at your
                  location.
                </p>

                {/* Capabilities list */}
                <ul className="space-y-2.5 pt-2 border-t border-line/60">
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Project coordination and timeline oversight</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Engaging vetted, qualified contractors and technicians</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Material procurement and field supervision</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Transparent milestone management and handover</span>
                  </li>
                </ul>
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
            </div>
          </div>

          {/* PILLAR 02: Property Improvement & Maintenance (Content Left, Image Right) */}
          <div className="w-full bg-tint-50 rounded-2xl border border-line shadow-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Content Column (order 2 on mobile, order 1 on desktop) */}
            <div className="lg:col-span-6 order-2 lg:order-1 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface rounded-pill border border-line">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-700 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-brand-700 tracking-widest uppercase">
                    Pillar 02
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink-950 tracking-tight leading-snug">
                  Property Improvement &amp; Maintenance
                </h2>

                <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
                  Improvement, renovation, plumbing and maintenance for residential
                  and commercial properties, carried out by qualified contractors
                  and technicians.
                </p>

                {/* Capabilities list */}
                <ul className="space-y-2.5 pt-2 border-t border-line/60">
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Residential and commercial property renovations</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Complete plumbing diagnostics, repairs, and installations</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Preventive structural maintenance and property upkeep</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-600">
                    <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                    <span>Turnkey interior finishes and space enhancements</span>
                  </li>
                </ul>
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
            </div>

            {/* Visual Column (order 1 on mobile, order 2 on desktop) */}
            <div className="lg:col-span-6 order-1 lg:order-2 relative w-full h-[320px] sm:h-[400px] rounded-xl overflow-hidden bg-tint-100 shadow-sm group">
              <img
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                alt="Master mechanical plumbing and technical building finish installation in commercial facility"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2mAjoiNAZmpJx76feysGjvCmg-iTUAsjL9k2Q_TZKEPSkgc32pztBzptT-jpPykAeqeNRv3ag3inXDCHXeZGnodb14_19A0zD4oy1Bhxjh_lLd2wJdTFvos1KyEimc2COmp_hMiSDQQTNBHjppICxoCDGu2jaXUJkVY0u2g-eNVQ8_Xpe4fiU4jTIgp_MNt2WxaWWHikZX4lkKPvQpOex-l2tGHEReSusC9LFelTXHl2WBXLS55p6uA"
              />
              <div className="absolute top-4 right-4 px-2.5 py-1 bg-ink-950/80 backdrop-blur-sm rounded text-surface text-[11px] font-semibold tracking-wider uppercase">
                SEC. 02 / TRADE
              </div>
              <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface/95 backdrop-blur-md rounded-pill shadow-card border border-line">
                <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink-950 uppercase tracking-wider">
                  Residential &amp; Commercial
                </span>
              </div>
            </div>
          </div>

          {/* PILLAR 03: Corporate Treasury & Investments (Image Left, Content Right) */}
          <div className="w-full bg-ink-950 rounded-2xl border border-surface/10 shadow-float p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-surface">
            {/* Visual Column */}
            <div className="lg:col-span-6 relative w-full h-[320px] sm:h-[400px] rounded-xl overflow-hidden bg-ink-950 shadow-inner group">
              <img
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-90"
                alt="Institutional boardroom with minimalist stone accents and structural glass overlooking metro district"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCHfur9FyhSiu0MYYoL1LyRC99sfYJroGxdGjnkKmKliv1wGq0AL8nS-pjj6GRuYhLytmI7jsjAE7LU1be1Uh-k6FTzTRc3oFndm2rSg7tOFk6tuxCTB4ToBxNI-Kq9tItzv4PP5kOyOYe-Yx0LJzLlwSLBgteVpuG85JVjdtyhB1qnKYkhXdZe-h6sQoq9cj6pbSze2lchC357oKaZPlbjlHzB7q5Hbaynt3abcS8logwi58Ib3URKA"
              />
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-surface/20 backdrop-blur-sm rounded text-surface text-[11px] font-semibold tracking-wider uppercase">
                SEC. 03 / ASSETS
              </div>
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-ink-950/95 backdrop-blur-md rounded-pill shadow-card border border-surface/20">
                <span className="w-2 h-2 rounded-full bg-accent-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-surface uppercase tracking-wider">
                  Company-Owned Capital
                </span>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface/10 rounded-pill">
                  <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-accent-300 tracking-widest uppercase">
                    Pillar 03
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface tracking-tight leading-snug">
                  Corporate Treasury &amp; Investments
                </h2>

                <p className="text-base sm:text-lg text-text-on-dark/80 leading-relaxed font-normal">
                  NICBEN manages its own corporate treasury and evaluates investment
                  opportunities using company-owned funds, solely for the
                  company&apos;s benefit.
                </p>

                {/* Capabilities list */}
                <ul className="space-y-2.5 pt-2 border-t border-surface/20">
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-on-dark/80">
                    <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                    <span>100% internal corporate balance sheet allocation</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-on-dark/80">
                    <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                    <span>Strict governance: zero third-party capital solicitation</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-on-dark/80">
                    <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                    <span>Strategic property and asset acquisition evaluation</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-medium text-text-on-dark/80">
                    <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                    <span>Full regulatory alignment and federal compliance (AML/KYC)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Button
                  variant="accent"
                  withArrow
                  href="/what-we-do/treasury-investments"
                >
                  Corporate treasury and investments
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 3. CROSS-PILLAR SYNERGY STRIP (from docs/design/what_we_do lines 230-295) */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-brand-700 tracking-widest uppercase">
                Structural Interlock
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-ink-950 tracking-tight mt-1">
                Cross-Pillar Synergy
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-text-600 max-w-md">
              A disciplined single-entity model combining direct operational oversight
              with self-funded balance sheet flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Part 1 */}
            <div className="bg-surface p-6 rounded-xl border border-line shadow-card flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-700 tracking-widest block mb-2">
                  01 / GOVERNANCE
                </span>
                <h4 className="text-lg font-bold text-ink-950">
                  Unified Texas LLC Entity
                </h4>
                <p className="text-xs text-text-600 mt-2 leading-relaxed">
                  Centralized institutional ownership guarantees clear operational
                  accountability and adherence to Texas commercial codes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink-950">
                  Consolidated Reporting
                </span>
              </div>
            </div>

            {/* Part 2 */}
            <div className="bg-surface p-6 rounded-xl border border-line shadow-card flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-700 tracking-widest block mb-2">
                  02 / EXECUTION
                </span>
                <h4 className="text-lg font-bold text-ink-950">
                  Project-Driven Mobilization
                </h4>
                <p className="text-xs text-text-600 mt-2 leading-relaxed">
                  Vetted trade specialists and engineers deployed on fixed milestone
                  scopes, eliminating corporate overhead for clients.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink-950">
                  Field Precision
                </span>
              </div>
            </div>

            {/* Part 3 */}
            <div className="bg-surface p-6 rounded-xl border border-line shadow-card flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-700 tracking-widest block mb-2">
                  03 / STABILITY
                </span>
                <h4 className="text-lg font-bold text-ink-950">
                  Dedicated Internal Capital
                </h4>
                <p className="text-xs text-text-600 mt-2 leading-relaxed">
                  Autonomous financing from company cash reserves ensures self-contained
                  stability with zero external dependency.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink-950">
                  Zero External Solicitations
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 4. CTA BAND */}
      <SectionWrapper background="ink" className="border-t border-ink-950/40">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface tracking-tight leading-tight heading-spark">
            Have a project or an enquiry?{" "}
            <span className="font-script text-[1.18em] text-accent-300">Talk</span>{" "}
            to us.
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
    </main>
  );
}
