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
          {/* R1-4: an uncited institutional-diligence claim was removed here.
              docs/03-copy-deck.md section 2 gives this section an eyebrow, this H2
              and the three cards — no supporting paragraph. */}
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
            </div>

            <div className="pt-6 mt-4 border-t border-line flex items-center justify-between">
              <Link
                href="/what-we-do/project-management-contracting"
                className="text-xs font-semibold text-brand-700 hover:text-ink-950 transition-colors inline-flex items-center gap-1.5"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
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
            </div>

            <div className="pt-6 mt-4 border-t border-line flex items-center justify-between">
              <Link
                href="/what-we-do/property-improvement-maintenance"
                className="text-xs font-semibold text-brand-700 hover:text-ink-950 transition-colors inline-flex items-center gap-1.5"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
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
            </div>

            <div className="pt-6 mt-4 border-t border-surface/20 flex items-center justify-between">
              <Link
                href="/what-we-do/treasury-investments"
                className="text-xs font-semibold text-accent-300 hover:text-surface transition-colors inline-flex items-center gap-1.5"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
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

            {/* Fact Banner — docs/03-copy-deck.md:44
                "Texas LLC · Project-based · Serving clients in various U.S. states" */}
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
                    Texas LLC
                  </span>
                  <span className="text-xs text-text-600">
                    Project-based
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-tint-100 text-xs font-semibold text-brand-700">
                  Serving clients in various U.S. states
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
                {/* R1-2: the fabricated "100%" metric card is removed. No number is
                    substituted — docs/08-qa-checklist.md forbids unconfirmed statistics.
                    A token-only colour block keeps the cluster's visual rhythm. */}
                <div
                  className="bg-ink-950 rounded-xl shadow-float h-24 texture-dots-on-dark"
                  aria-hidden="true"
                />
              </div>

              {/* Column 2: image frame + (R1-4 removed card) (Diagonally offset with sm:pt-6) */}
              <div className="space-y-4 sm:pt-6">
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
          {/* R1-4: an uncited risk-management/craft-quality claim was removed here.
              docs/03-copy-deck.md:46-50 gives this section an eyebrow, this H2 and
              the five steps — no supporting paragraph. */}
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
          {/* Left Text — docs/03-copy-deck.md section 2 "Where we work" */}
          <div className="lg:col-span-5 space-y-6">
            <EyebrowChip dotColor="sky">Where we work</EyebrowChip>

            <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 tracking-tight leading-tight">
              Based in Texas.<br />
              Working where the project is.
            </h2>

            <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
              We are registered in Texas and serve clients in various U.S. states,
              based on project requests. The work takes place at your location.
            </p>

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

          {/* Right — abstract project-arc diagram.
              R1-3: the previous version named four operating regions and carried
              footprint and node-count labels lifted from the design mock. None of it
              traces to the copy deck, which allows only "serve clients in various
              U.S. states". The diagram is now decorative geometry, aria-hidden, with
              no place names and no counts. */}
          <div className="lg:col-span-7 bg-surface p-6 sm:p-8 rounded-2xl border border-line shadow-card relative overflow-hidden">
            <div className="relative w-full h-[260px] sm:h-[280px] bg-tint-50 rounded-xl flex items-center justify-center p-4 overflow-hidden border border-line/60">
              <svg
                className="w-full h-full text-brand-700"
                fill="none"
                viewBox="0 0 600 300"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                {/* Blueprint grid */}
                <path d="M50 50h500M50 100h500M50 150h500M50 200h500M50 250h500" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                <path d="M100 30v240M200 30v240M300 30v240M400 30v240M500 30v240" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

                {/* Central hub */}
                <g>
                  <circle cx="310" cy="235" fill="currentColor" fillOpacity="0.1" r="28" />
                  <circle cx="310" cy="235" fill="currentColor" fillOpacity="0.25" r="14" />
                  <circle cx="310" cy="235" fill="currentColor" r="6" />
                </g>

                {/* Unnamed connection arcs */}
                <path d="M310 235 Q 220 180 160 160" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="160" cy="160" fill="currentColor" r="4" />

                <path d="M310 235 Q 350 150 400 110" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="400" cy="110" fill="currentColor" r="4" />

                <path d="M310 235 Q 410 230 470 210" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="470" cy="210" fill="currentColor" r="4" />

                <path d="M310 235 Q 430 140 490 100" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="490" cy="100" fill="currentColor" r="4" />
              </svg>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 7. REFERRAL NOTE SECTION */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-4xl mx-auto bg-tint-50 rounded-2xl p-8 sm:p-10 border border-line shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            {/* R1-4: an uncited relationship-model chip and an uncited
                reputation/performance line were removed here.
                docs/03-copy-deck.md:57-58 gives the referral note as body copy only. */}
            <p className="text-xl sm:text-2xl font-bold text-ink-950 tracking-tight leading-snug">
              &ldquo;Most of our work comes through professional referrals, client
              referrals, direct enquiries and repeat customers.&rdquo;
            </p>
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
              {/* R1-4: the uncited consultation chip was an unsourced label.
                  docs/03-copy-deck.md:63-66 gives this band an H2, a body line and
                  the "Get in Touch" button. */}

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
