import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { CornerArrowButton } from "@/components/ui/CornerArrowButton";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { TickerBand } from "@/components/ui/TickerBand";
import { HeroCluster } from "@/components/ui/HeroCluster";

import { HeroCinematic } from "@/components/home/HeroCinematic";
import { HeroSplit } from "@/components/home/HeroSplit";

export const metadata: Metadata = {
  title: "NICBEN Asset Holdings & Investments, Texas",
  description:
    "Privately owned Texas LLC: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* 
        HERO SECTION:
        Easily switchable:
        - <HeroCinematic />: Full-bleed edge-to-edge photography extending under navigation with frosted glass stat cards.
        - <HeroSplit />: Original 2-column asymmetric split with architectural HeroCluster frame.
      */}
      <HeroCinematic />

      {/* 2. TICKER BAND */}
      <TickerBand />

      {/* 3. THREE PILLARS (Strict Equal Weight Rule) */}
      <SectionWrapper id="what-we-do" background="surface" className="border-t border-line">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <EyebrowChip dotColor="sky">What we do</EyebrowChip>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 mt-4 tracking-tight">
            Three areas of work, one company
          </h2>
          <p className="text-text-600 mt-3 text-base">
            Operating with institutional diligence, tactical oversight, and strict
            corporate alignment across every endeavor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Pillar 1: Project Management & Contracting */}
          <Card
            variant="surface"
            notched
            notchedCorner="top-right"
            className="flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-700 tracking-wider uppercase">
                  Pillar 01
                </span>
                <CornerArrowButton
                  href="/what-we-do/project-management-contracting"
                  ariaLabel="Learn more about Project Management & Contracting"
                  size="sm"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold text-ink-950 leading-snug">
                  Project Management &amp; Contracting
                </h3>
                <p className="text-text-600 text-sm mt-3 leading-relaxed">
                  We coordinate construction-related projects, engaging qualified
                  contractors and technicians to carry out the work at your
                  location.
                </p>
              </div>

              {/* Capability list with teal diamond markers */}
              <ul className="space-y-2 pt-2 border-t border-line/60">
                <li className="flex items-center gap-2 text-xs font-medium text-text-600">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                  <span>General contracting oversight</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-text-600">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                  <span>Sub-trade vetting &amp; procurement</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-text-600">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                  <span>Milestone scheduling &amp; quality checks</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-line flex items-center justify-between">
              <Link
                href="/what-we-do/project-management-contracting"
                className="text-xs font-semibold text-brand-700 hover:text-ink-950 transition-colors inline-flex items-center gap-1.5"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
              <span className="text-[11px] font-semibold text-text-600 uppercase tracking-wider">
                Execution
              </span>
            </div>
          </Card>

          {/* Pillar 2: Property Improvement & Maintenance */}
          <Card
            variant="tint"
            notched
            notchedCorner="top-right"
            className="flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-700 tracking-wider uppercase">
                  Pillar 02
                </span>
                <CornerArrowButton
                  href="/what-we-do/property-improvement-maintenance"
                  ariaLabel="Learn more about Property Improvement & Maintenance"
                  size="sm"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold text-ink-950 leading-snug">
                  Property Improvement &amp; Maintenance
                </h3>
                <p className="text-text-600 text-sm mt-3 leading-relaxed">
                  Improvement, renovation, plumbing and maintenance for residential
                  and commercial properties, carried out by qualified contractors
                  and technicians.
                </p>
              </div>

              {/* Capability list with teal diamond markers */}
              <ul className="space-y-2 pt-2 border-t border-line/60">
                <li className="flex items-center gap-2 text-xs font-medium text-text-600">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                  <span>Commercial &amp; residential improvements</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-text-600">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                  <span>Full plumbing &amp; mechanical services</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-text-600">
                  <span className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0" aria-hidden="true" />
                  <span>Scheduled preventive facility maintenance</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-line flex items-center justify-between">
              <Link
                href="/what-we-do/property-improvement-maintenance"
                className="text-xs font-semibold text-brand-700 hover:text-ink-950 transition-colors inline-flex items-center gap-1.5"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
              <span className="text-[11px] font-semibold text-text-600 uppercase tracking-wider">
                Upkeep
              </span>
            </div>
          </Card>

          {/* Pillar 3: Corporate Treasury & Investments */}
          <Card
            variant="ink"
            notched
            notchedCorner="top-right"
            className="flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-300 tracking-wider uppercase">
                  Pillar 03
                </span>
                <CornerArrowButton
                  href="/what-we-do/treasury-investments"
                  ariaLabel="Learn more about Corporate Treasury & Investments"
                  size="sm"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold text-surface leading-snug">
                  Corporate Treasury &amp; Investments
                </h3>
                <p className="text-text-on-dark/80 text-sm mt-3 leading-relaxed">
                  NICBEN manages its own corporate treasury and evaluates investment
                  opportunities using company-owned funds, solely for the
                  company&apos;s benefit.
                </p>
              </div>

              {/* Capability list with teal diamond markers */}
              <ul className="space-y-2 pt-2 border-t border-surface/20">
                <li className="flex items-center gap-2 text-xs font-medium text-text-on-dark/80">
                  <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                  <span>Self-funded asset allocation</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-text-on-dark/80">
                  <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                  <span>Direct internal corporate balance sheet</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-text-on-dark/80">
                  <span className="w-1.5 h-1.5 rotate-45 bg-accent-300 shrink-0" aria-hidden="true" />
                  <span>Zero third-party public fund solicitation</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-surface/20 flex items-center justify-between">
              <Link
                href="/what-we-do/treasury-investments"
                className="text-xs font-semibold text-accent-300 hover:text-surface transition-colors inline-flex items-center gap-1.5"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
              <span className="text-[11px] font-semibold text-text-on-dark/60 uppercase tracking-wider">
                Proprietary
              </span>
            </div>
          </Card>
        </div>
      </SectionWrapper>

      {/* 4. ABOUT TEASER SECTION */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 space-y-6">
            <EyebrowChip dotColor="navy">About NICBEN</EyebrowChip>

            <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 tracking-tight">
              A privately owned company, registered in Texas
            </h2>

            <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
              NICBEN is a limited liability company that works on a project basis.
              We serve clients in various U.S. states, depending on what each
              project requires.
            </p>

            {/* Fact Banner */}
            <div className="p-4 rounded-xl bg-surface border border-line shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tint-100 flex items-center justify-center text-brand-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-ink-950 block">
                    Texas LLC Structure
                  </span>
                  <span className="text-xs text-text-600">
                    Privately Held Entity
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-tint-100 text-xs font-semibold text-brand-700">
                  Project-Based
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-brand-700 text-surface text-xs font-semibold">
                  Multi-State
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-ink-950 transition-colors"
              >
                About NICBEN
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 2 Images and 2 Cards Diagonally (Matching design HTML lines 304-328) */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Column 1: Image 1 + Dark 100% Card */}
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden shadow-card h-52 bg-tint-100 border border-line">
                  <img
                    className="w-full h-full object-cover"
                    alt="Interior architectural inspection in progress with structural engineer reviewing conduits"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFy9O74SZBBl2xSiEqvqBMhLsys1SigYUYRuNqTe4nzLgUi14IyHYksydzslY3AzW_wbNakgj217uGdgeWuFGcVsQXKDt-kel7-7XhhecdzJvQQ8SyDEeAhBUGfZwyG0iOUlEgD4cAnptoSBOKgOKdQT_scKhmNO1fzw64YeuawDW6VX0YBMke3t07fFByS2VW1oIdzNKajZnZ5XfH4trjM4l8Miwf6MLLJGR9ye5fSC1Pdxokpp9yuw"
                  />
                </div>
                <div className="bg-ink-950 p-6 rounded-xl text-surface shadow-float">
                  <div className="font-heading font-extrabold text-2xl text-accent-300">
                    100%
                  </div>
                  <div className="text-xs text-text-on-dark/80 mt-1 leading-relaxed">
                    Direct corporate accountability with zero outside capital dependence.
                  </div>
                </div>
              </div>

              {/* Column 2: White Texas Oversight Card + Image 2 (Diagonally offset with sm:pt-6) */}
              <div className="space-y-4 sm:pt-6">
                <div className="bg-surface p-6 rounded-xl shadow-card border border-line">
                  <div className="flex items-center gap-2 text-brand-700 mb-1">
                    <svg
                      className="w-4 h-4 text-brand-700 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Texas Oversight
                    </span>
                  </div>
                  <div className="text-xs text-text-900 leading-relaxed">
                    Raymondville corporate foundation ensuring institutional rigor and ethical project execution.
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden shadow-card h-52 bg-tint-100 border border-line">
                  <img
                    className="w-full h-full object-cover"
                    alt="Architect and mechanical contractor examining schematics on a construction site"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMsUJtnNopXzrfjuOgU6ED-c7PZE9IysO_XhyNG4Gk-j0lzAe0ZW8i-lzHUyEyZWLQKDylvLulKPm1RC6cGyfU0KeNSMyVmtVfUkUwWUWP_hPSen4--KOCBhBNIS29gWQvLmMXTDgJaL4_utwBNWqmKSkoAgh-t_4q-xUtBLST5fcgZKvEkp_Oi5tSjpc6UOoI9Dqo8nbaXKadrynEqK68zZxUS3MVL0eqnS72YXRgwPxsMYY6fyDOkA"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 5. PROCESS ROADMAP (HOW WE WORK) */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <EyebrowChip dotColor="teal">How it works</EyebrowChip>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 mt-4 tracking-tight">
            From enquiry to completion
          </h2>
          <p className="text-text-600 mt-3 text-base">
            A predictable, structured cadence designed to manage risk, uphold craft quality, and verify scope delivery.
          </p>
        </div>

        {/* 5-Step Process Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {[
            {
              num: "01",
              title: "Enquiry",
              desc: "Tell us about the project through the contact form, by email or by phone.",
            },
            {
              num: "02",
              title: "Assessment and quote",
              desc: "We review the scope and talk through what is needed.",
            },
            {
              num: "03",
              title: "Agreement",
              desc: "We confirm the scope and terms with you before work begins.",
            },
            {
              num: "04",
              title: "Coordination and delivery",
              desc: "We engage qualified contractors and technicians and coordinate the work at your location.",
            },
            {
              num: "05",
              title: "Completion",
              desc: "We confirm the work is complete with you.",
            },
          ].map((step) => (
            <div
              key={step.num}
              className="flex flex-col justify-between p-6 rounded-xl border border-line bg-tint-50 shadow-card hover:border-brand-500 transition-colors group"
            >
              <div>
                <span className="font-heading font-extrabold text-2xl text-brand-700 block mb-3">
                  {step.num}
                </span>
                <h4 className="text-base font-bold text-ink-950 mb-2">
                  {step.title}
                </h4>
                <p className="text-xs text-text-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-ink-950 transition-colors"
          >
            See the full process
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </SectionWrapper>

      {/* 6. GEOGRAPHIC REACH (WHERE WE WORK) */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-6">
            <EyebrowChip dotColor="sky">Geographic Reach</EyebrowChip>

            <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 tracking-tight leading-tight">
              Based in Texas.<br />
              Working where the project is.
            </h2>

            <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
              We are registered in Texas and serve clients in various U.S. states,
              based on project requests. The work takes place at your location.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 bg-surface p-3.5 rounded-xl border border-line shadow-card">
                <div className="w-8 h-8 rounded-lg bg-tint-100 flex items-center justify-center text-brand-700 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-text-600 uppercase tracking-wider block">
                    Corporate Seat
                  </span>
                  <span className="text-sm font-semibold text-ink-950">
                    Raymondville, Willacy County, TX
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface p-3.5 rounded-xl border border-line shadow-card">
                <div className="w-8 h-8 rounded-lg bg-tint-100 flex items-center justify-center text-brand-700 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-text-600 uppercase tracking-wider block">
                    Operations
                  </span>
                  <span className="text-sm font-semibold text-ink-950">
                    Project-Driven Multi-State Reach
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/service-areas"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-ink-950 transition-colors"
              >
                Service areas
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right SVG Map Arc Diagram */}
          <div className="lg:col-span-7 bg-surface p-6 sm:p-8 rounded-2xl border border-line shadow-card relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <span className="text-xs font-bold text-text-600 tracking-wider uppercase">
                Active Operational Footprint
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-tint-100 text-brand-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" aria-hidden="true" />
                Live Nodes
              </span>
            </div>

            {/* Stylized US Hub Arc Diagram */}
            <div className="relative w-full h-[260px] sm:h-[280px] bg-tint-50 rounded-xl flex items-center justify-center p-4 overflow-hidden border border-line/60">
              <svg
                className="w-full h-full text-brand-700"
                fill="none"
                viewBox="0 0 600 300"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Map illustration showing Texas headquarters and project connection arcs"
              >
                {/* Regional Grid lines */}
                <path d="M50 50h500M50 100h500M50 150h500M50 200h500M50 250h500" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                <path d="M100 30v240M200 30v240M300 30v240M400 30v240M500 30v240" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

                {/* Texas Hub: 310, 235 */}
                <g>
                  <circle cx="310" cy="235" fill="currentColor" fillOpacity="0.1" r="28" />
                  <circle cx="310" cy="235" fill="currentColor" fillOpacity="0.25" r="14" />
                  <circle cx="310" cy="235" fill="currentColor" r="6" />
                  <text fill="#062B36" fontFamily="var(--font-heading)" fontSize="11" fontWeight="700" x="325" y="240">
                    TX HEADQUARTERS
                  </text>
                  <text fill="#4A6470" fontFamily="var(--font-body)" fontSize="9" x="325" y="253">
                    Raymondville Hub
                  </text>
                </g>

                {/* Western Assets Node */}
                <path d="M310 235 Q 220 180 160 160" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="160" cy="160" fill="currentColor" r="4" />
                <text fill="#062B36" fontFamily="var(--font-body)" fontSize="10" fontWeight="600" x="110" y="150">
                  Western Assets
                </text>

                {/* Midwest Corridor Node */}
                <path d="M310 235 Q 350 150 400 110" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="400" cy="110" fill="currentColor" r="4" />
                <text fill="#062B36" fontFamily="var(--font-body)" fontSize="10" fontWeight="600" x="412" y="114">
                  Midwest Corridor
                </text>

                {/* Southeast Sites Node */}
                <path d="M310 235 Q 410 230 470 210" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="470" cy="210" fill="currentColor" r="4" />
                <text fill="#062B36" fontFamily="var(--font-body)" fontSize="10" fontWeight="600" x="440" y="235">
                  Southeast Sites
                </text>

                {/* Mid-Atlantic Node */}
                <path d="M310 235 Q 430 140 490 100" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="490" cy="100" fill="currentColor" r="4" />
                <text fill="#062B36" fontFamily="var(--font-body)" fontSize="10" fontWeight="600" x="470" y="88">
                  Mid-Atlantic
                </text>
              </svg>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-text-600">
              <span>Mobilizing qualified trade teams nationwide</span>
              <span className="font-semibold text-brand-700">Project-Based Mobility</span>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 7. REFERRAL NOTE SECTION */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-4xl mx-auto bg-tint-50 rounded-2xl p-8 sm:p-10 border border-line shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface text-brand-700 text-xs font-bold border border-line shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              Relationship-Driven Model
            </div>
            <p className="text-xl sm:text-2xl font-bold text-ink-950 tracking-tight leading-snug">
              &ldquo;Most of our work comes through professional referrals, client
              referrals, direct enquiries and repeat customers.&rdquo;
            </p>
            <p className="text-xs text-text-600">
              Built on direct reputation and uncompromising project follow-through.
            </p>
          </div>

          <div className="shrink-0 bg-surface p-6 rounded-xl border border-line flex flex-col items-center justify-center text-center w-full md:w-56 shadow-sm">
            <span className="text-2xl font-extrabold text-ink-950 font-heading">
              Zero
            </span>
            <span className="text-xs font-bold text-text-600 uppercase tracking-wider mt-1">
              Aggressive Solicitations
            </span>
            <span className="text-[11px] text-text-600 mt-2">
              Discretion &amp; Trust First
            </span>
          </div>
        </div>
      </SectionWrapper>

      {/* 8. HIGH-IMPACT CTA BANNER */}
      <SectionWrapper background="ink" className="border-t border-ink-950/40">
        <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden border border-surface/10 bg-gradient-to-br from-ink-950 to-brand-700/30">
          {/* Architectural Drafting Grid Overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#3FB7F5 1px, transparent 1px), linear-gradient(90deg, #3FB7F5 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface/10 text-accent-300 text-xs font-semibold uppercase tracking-wider">
                Initiate Consultation
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface tracking-tight leading-none heading-spark">
                Have a project or an enquiry?{" "}
                <span className="font-script text-[1.25em] text-accent-300">Talk</span>{" "}
                to us.
              </h2>

              <p className="text-base sm:text-lg text-text-on-dark/80 font-normal">
                Reach us by email, phone or message.
              </p>
            </div>

            {/*
              D-012 — the direct contact detail is withheld until the client
              confirms it. The slot below is reserved so the confirmed public
              email or phone can be dropped in later without a redesign.
              No mailto: and no substitute address may be rendered.
            */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
              <Button variant="accent" size="lg" withArrow href="/contact">
                Get in Touch
              </Button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
