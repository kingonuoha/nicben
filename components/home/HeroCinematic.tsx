import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface HeroCinematicProps {
  /**
   * Optional client-supplied work photograph. Only a locally owned asset may be
   * passed here: `next.config.mjs` configures no remote image hosts, and
   * docs/04-design-system.md section 8 forbids stock photography and
   * AI-generated imagery. When no photograph is available the hero renders a
   * token-only treatment instead of a substitute image.
   */
  imageUrl?: string;
  imageAlt?: string;
}

export function HeroCinematic({ imageUrl, imageAlt = "" }: HeroCinematicProps = {}) {
  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-ink-950">
      {/* 1. Full-Bleed Background (runs edge-to-edge from the top of the browser) */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            preload
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <>
            {/* R1-5: the previous default was a remote stock executive portrait.
                That is now removed — docs/04-design-system.md section 8 forbids
                stock photography and AI-generated people. The approved hero
                treatment is the subtle --ink-950 to --brand-700 gradient with a
                faint grid texture (docs/04-design-system.md section 2 and 5). */}
            <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950 to-brand-700/40" />
            <div className="absolute inset-0 opacity-[0.07] texture-grid-on-dark" />
          </>
        )}

        {/* Subtle top shade so white navigation pills stay crisp */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-950/60 to-transparent" />
      </div>

      {/* Content Container (Padded top for fixed header clearance, centered vertically) */}
      <div className="relative z-10 w-full max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-36 sm:pb-24">
        <div className="max-w-2xl lg:max-w-3xl space-y-6">
          {/* Pill Eyebrow Badge — docs/03-copy-deck.md:22 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface/15 backdrop-blur-md border border-surface/20 text-xs font-semibold uppercase tracking-wider text-accent-300 shadow-sm">
            <span
              className="w-2 h-2 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(63,183,245,0.8)]"
              aria-hidden="true"
            />
            <span>Registered in Texas</span>
          </div>

          {/* Canonical Brand Headline with Spark & Caveat Accent — docs/03-copy-deck.md:23 */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface leading-[1.05] heading-spark">
            Three disciplines.<br />
            <span className="font-script text-[1.18em] text-accent-300">One</span>{" "}
            company.
          </h1>

          {/* Verbatim Approved Copy — docs/03-copy-deck.md:24 */}
          <p className="text-lg sm:text-xl text-text-on-dark/90 leading-relaxed font-normal max-w-xl">
            NICBEN manages construction-related projects, improves and maintains
            properties, and manages its own corporate treasury and investments.
          </p>

          {/* Dual CTAs — docs/03-copy-deck.md:25-26 */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Button variant="accent" size="lg" withArrow href="/contact">
              Get in Touch
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="#what-we-do"
              className="bg-surface/15 text-surface border-surface/30 hover:bg-surface/25 backdrop-blur-md"
            >
              What We Do
            </Button>
          </div>

          {/* Fact chips — docs/03-copy-deck.md:27-28 */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface/10 backdrop-blur-sm border border-surface/15 text-xs font-semibold text-text-on-dark/85">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Registered in Texas
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface/10 backdrop-blur-sm border border-surface/15 text-xs font-semibold text-text-on-dark/85">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Serving clients across the US
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
