import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { CornerArrowButton } from "@/components/ui/CornerArrowButton";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ShapePanel } from "@/components/ui/ShapePanel";
import { TickerBand } from "@/components/ui/TickerBand";
import { HeroCluster } from "@/components/ui/HeroCluster";

import { HeroCinematic } from "@/components/home/HeroCinematic";

export const metadata: Metadata = {
  title: "NICBEN Asset Holdings & Investments, Texas",
  description:
    "Privately owned Texas LLC: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
};

/**
 * Pillar card line icon — one hand-drawn set, 1.5px stroke, `currentColor`.
 * docs/04-design-system.md section 5 requires a small line icon per card and
 * section 8 forbids emoji icons and mixed icon sets; the "slot" in
 * docs/01-sitemap-wireframes.md section 4 is "icon, title, two-line
 * description, circular arrow". Decorative, so it is hidden from assistive
 * technology (the card title carries the meaning).
 */
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
          {/* set square over a baseline — project planning and coordination */}
          <path d="M3.75 20.25h16.5" />
          <path d="M6.75 20.25 12 3.75l5.25 16.5" />
          <path d="M8.9 14.25h6.2" />
        </>
      )}
      {name === "spanner" && (
        <>
          {/* spanner — improvement, renovation and maintenance trades */}
          <path d="M9 3.75h6l1.65 3.75L15 11.25H9L7.35 7.5 9 3.75Z" />
          <path d="M12 11.25v9" />
        </>
      )}
      {name === "treasury" && (
        <>
          {/* classical facade — corporate treasury and investments */}
          <path d="M3.75 9.75 12 4.5l8.25 5.25" />
          <path d="M6.75 10.5v9M10.5 10.5v9M13.5 10.5v9M17.25 10.5v9" />
          <path d="M5.25 20.25h13.5" />
        </>
      )}
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/*
        HERO: <HeroCinematic /> — dark, full-bleed, using the sanctioned
        ink-950 to brand-700 gradient plus the faint grid texture, and a
        client-supplied local photograph when one is passed in. Every visible
        string comes from docs/03-copy-deck.md section 2.
      */}
      {/*
        R2a-1: header clearance lives once in `app/layout.tsx` (`pt-20`). The
        homepage hero is the only full-bleed dark section that is designed to run
        from the top of the browser under the translucent pill header, so it
        cancels that padding with `-mt-20` — an explicit opt-out, not a
        per-page compensation: the hero's own content already clears the header
        (measured h1 top 241 px vs header bottom 78 px at 360 px).
      */}
      <div className="-mt-20">
        <HeroCinematic />
      </div>

      {/* 2. TICKER BAND */}
      <TickerBand />

      {/* 3. THREE PILLARS (Strict Equal Weight Rule) */}
      <SectionWrapper id="what-we-do" background="surface" className="border-t border-line">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <EyebrowChip dotColor="sky">What we do</EyebrowChip>
          <h2 className="text-h2 font-bold text-ink-950 mt-4 tracking-tight">
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
              {/* `Pillar 01` stood here. Its only source was the design mock
                  (`docs/design/nicben_asset_holdings_investments_home/code.html:148`),
                  and `docs/03-copy-deck.md` supplies no per-card eyebrow —
                  D-008 forbids mock copy and permits only substitution with a
                  cited line or deletion. Deleted (R-L). */}
              <div className="flex items-center justify-end">
                {/* Line icon slot per docs/04-design-system.md section 5 and
                    docs/01-sitemap-wireframes.md section 4. */}
                <span className="w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center">
                  <PillarIcon name="drafting" className="w-5 h-5" />
                </span>
              </div>

              <div>
                <h3 className="text-h3 font-bold text-ink-950 leading-snug">
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
              <CornerArrowButton
                href="/what-we-do/project-management-contracting"
                ariaLabel="Learn more about Project Management & Contracting"
                size="sm"
              />
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
              <div className="flex items-center justify-end">
                <span className="w-10 h-10 rounded-full bg-surface text-brand-700 flex items-center justify-center">
                  <PillarIcon name="spanner" className="w-5 h-5" />
                </span>
              </div>

              <div>
                <h3 className="text-h3 font-bold text-ink-950 leading-snug">
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
              <CornerArrowButton
                href="/what-we-do/property-improvement-maintenance"
                ariaLabel="Learn more about Property Improvement & Maintenance"
                size="sm"
              />
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
              <div className="flex items-center justify-end">
                <span className="w-10 h-10 rounded-full bg-surface/10 text-accent-300 flex items-center justify-center">
                  <PillarIcon name="treasury" className="w-5 h-5" />
                </span>
              </div>

              <div>
                <h3 className="text-h3 font-bold text-surface leading-snug">
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
              <CornerArrowButton
                href="/what-we-do/treasury-investments"
                ariaLabel="Learn more about Corporate Treasury & Investments"
                size="sm"
              />
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

            <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
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

          {/* Right Column: offset shape-panel cluster (design HTML lines 304-328
              supply the structure; the two cards that stood here carried
              fabricated claims and were removed under R1-2 and R1-4) */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Column 1: shape panel + token colour block */}
              <div className="space-y-4">
                {/* R1-5: a remote AI-generated image stood here. docs/04-design-system.md
                    section 8 forbids stock photography and AI-generated people, and no
                    real work photograph is available yet, so the frame is filled with a
                    token-only treatment instead of a substitute image. */}
                <ShapePanel className="h-52 shadow-card" motif="blueprint" />
                {/* R1-2: the fabricated "100%" metric card is removed. No number is
                    substituted — docs/08-qa-checklist.md forbids unconfirmed statistics.
                    A token-only colour block keeps the cluster's visual rhythm.
                    R2b: the full-strength `texture-dots-on-dark` fill that stood on
                    this block is gone — docs/04-design-system.md section 5 keeps one
                    texture per page and this page's texture is the CTA-band grid. */}
                <div
                  className="bg-ink-950 rounded-xl shadow-float h-24"
                  aria-hidden="true"
                />
              </div>

              {/* Column 2: shape panel (diagonally offset with sm:pt-6) */}
              <div className="space-y-4 sm:pt-6">
                {/* R1-5: remote AI-generated image removed; token-only treatment used. */}
                <ShapePanel className="h-52 shadow-card" motif="arcs" />
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 5. PROCESS ROADMAP (HOW WE WORK) */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <EyebrowChip dotColor="teal">How it works</EyebrowChip>
          <h2 className="text-h2 font-bold text-ink-950 mt-4 tracking-tight">
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
                <span
                  className="font-heading font-extrabold text-2xl text-brand-700 block mb-3"
                  aria-hidden="true"
                >
                  {step.num}
                </span>
                {/* Heading level h3, not h4: the process section's H2 is the only
                    heading above it, and h2 → h4 was the Lighthouse
                    `heading-order` failure on `/` (qa-report-pass2.md P1-4). */}
                <h3 className="text-base font-bold text-ink-950 mb-2">
                  {step.title}
                </h3>
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

            <h2 className="text-h2 font-bold text-ink-950 tracking-tight leading-tight">
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
          {/* Architectural Drafting Grid Overlay — tokens only (D-003):
              `--color-accent-400` lines on the `--space-8` spacing token. */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-accent-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-400) 1px, transparent 1px)",
              backgroundSize: "var(--space-8) var(--space-8)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              {/* R1-4: the uncited consultation chip was an unsourced label.
                  docs/03-copy-deck.md:63-66 gives this band an H2, a body line and
                  the "Get in Touch" button. */}

              <h2 className="text-h2 font-extrabold text-surface tracking-tight leading-tight heading-spark">
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
