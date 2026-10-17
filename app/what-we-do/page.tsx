import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ShapePanel } from "@/components/ui/ShapePanel";

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
          {/* R1-4/D-008: the section eyebrow chip carried an uncited label and was
              removed. docs/03-copy-deck.md:72 gives this page an H1 and an intro. */}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-950 mt-6 leading-tight heading-spark">
            What we do
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            NICBEN works in three areas. Each is run as part of one privately owned
            Texas company.
          </p>

          {/* docs/03-copy-deck.md:44 fact card wording */}
          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface border border-line text-xs font-semibold text-text-600 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
            <span>Texas LLC · Project-based · Serving clients in various U.S. states</span>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. THREE PILLAR FEATURE BLOCKS (Strict Equal Weight Rule from docs/design/what_we_do) */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="space-y-12 lg:space-y-16">
          {/* PILLAR 01: Project Management & Contracting (Image Left, Content Right) */}
          <div className="w-full bg-surface rounded-2xl border border-line shadow-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Column — R1-5: the remote AI-generated image was removed.
                docs/04-design-system.md section 8 forbids stock photography and
                AI-generated people; no real work photograph exists yet, so the
                frame keeps its shape and is filled with a token-only treatment. */}
            <div className="lg:col-span-6 relative w-full">
              <ShapePanel
                className="w-full h-[320px] sm:h-[400px] shadow-sm"
                motif="blueprint"
              />
              {/* R1-4/D-008: the two overlay badges that sat over this visual
                  carried uncited labels and were removed. */}
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

                {/* R1-4: the uncited capability list that stood here was removed.
                    docs/03-copy-deck.md:74 defines this block as the card text plus
                    the link. The section 4 scope list is explicitly
                    [CLIENT TO CONFIRM] (deck:85) and must not be published, so no
                    replacement list is shown — keeping one on some pillars only
                    would also breach the three-pillar parity rule (D-001). */}
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

                {/* R1-4: the uncited capability list that stood here was removed
                    (docs/03-copy-deck.md:74-76 — block text plus link only). */}
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

            {/* Visual Column — R1-5: remote AI-generated image removed. */}
            <div className="lg:col-span-6 order-1 lg:order-2 relative w-full">
              <ShapePanel
                className="w-full h-[320px] sm:h-[400px] shadow-sm"
                motif="drafting"
              />
              {/* R1-4/D-008: the two overlay badges that sat over this visual
                  carried uncited labels and were removed. */}
            </div>
          </div>

          {/* PILLAR 03: Corporate Treasury & Investments (Image Left, Content Right) */}
          <div className="w-full bg-ink-950 rounded-2xl border border-surface/10 shadow-float p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-surface">
            {/* Visual Column — R1-5: remote AI-generated image removed. The panel
                uses the dark tone so Pillar 3 keeps the same structural weight as
                the other two blocks (D-001). */}
            <div className="lg:col-span-6 relative w-full">
              <ShapePanel
                className="w-full h-[320px] sm:h-[400px] shadow-inner"
                motif="arcs"
                tone="dark"
              />
              {/* R1-4/D-008: the two overlay badges that sat over this visual
                  carried uncited labels and were removed. */}
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

                {/* R1-4 / D-002: the previous list carried asset-strategy wording
                    (prohibited inside the Pillar 3 card) and an unsupported
                    regulatory compliance claim. Both are removed. The only approved
                    compliance statement is the section 7 sentence on /about, which is
                    client-sourced. docs/03-copy-deck.md:76 defines this block as the
                    card text plus the link. */}
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

      {/*
        R1-4: the cross-pillar strip that stood here is removed. Every string in it
        was uncited, and three of them were unsupported legal and performance claims.
        docs/03-copy-deck.md section 3 defines /what-we-do as the hero, the three
        blocks and the CTA band — it provides no approved content for a cross-pillar
        section, and no compliant replacement can be written without inventing facts.
        Escalated: the design screen carries this strip (docs/design/
        nicben_what_we_do/code.html), so the copy deck needs client-approved copy
        before it can be restored.
      */}

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
