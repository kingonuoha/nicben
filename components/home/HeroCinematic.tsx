import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface HeroCinematicProps {
  /**
   * Optional client-supplied work photograph, defaulting to the current hero
   * asset. Only a locally owned file may be passed here: `next.config.mjs`
   * configures no remote image hosts. docs/04-design-system.md section 8
   * prohibits stock photography; AI-generated people are permitted only within
   * the narrowed conditions of decision D-016 (candid working figures, never
   * presented as an identifiable officer, never named in alt text). When no
   * photograph is available the hero renders a token-only treatment instead.
   */
  imageUrl?: string;
  imageAlt?: string;
}

export function HeroCinematic({
  imageUrl = "/images/hero/hero-site-supervisor-checking-drawings.jpg",
  imageAlt = "Site supervisor checking architectural drawings at project location",
}: HeroCinematicProps = {}) {
  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-ink-950">
      {/* 1. Full-Bleed Background (runs edge-to-edge from the top of the browser)
          `hero-photo` = row 35 / D-031: one slow scale 1.04 -> 1 with opacity,
          800ms ease-out. One element, so no stagger. The animation is a CSS
          keyframe (see globals.css) so it starts at first paint instead of
          waiting for hydration, and `prefers-reduced-motion` removes the scale
          entirely. */}
      <div className="hero-photo absolute inset-0 z-0" aria-hidden="true">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover object-right sm:object-center"
            />
            {/* Directional Left-to-Right 70% Gradient Fade: solid on left for 100% text contrast, clear by 70%.
                Tokenised as the `.hero-scrim` utility (D-003) — the raw rgba()
                literals that stood inline here are gone. */}
            <div className="absolute inset-0 pointer-events-none hero-scrim" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950 to-brand-700/40" />
            <div className="absolute inset-0 texture-grid-on-dark" />
          </>
        )}

        {/* Subtle top shade so white navigation pills stay crisp */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-950/60 to-transparent" />
      </div>

      {/* Content Container (Padded top for fixed header clearance, centered vertically) */}
      <div className="relative z-10 w-full max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-36 sm:pb-24">
        <div className="max-w-2xl lg:max-w-3xl space-y-6">
          {/* Pill Eyebrow Badge — docs/03-copy-deck.md:22
              Block-level flex with w-fit, not inline-flex: inline-flex made the
              badge an inline-level child, so `space-y-6` could not apply its
              vertical margin and the hero rhythm collapsed. */}
          <div className="hero-eyebrow flex w-fit items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface/15 backdrop-blur-md border border-surface/20 text-eyebrow font-semibold uppercase tracking-[0.04em] text-accent-300 shadow-sm">
            <span
              className="w-2 h-2 rounded-full bg-accent-400"
              aria-hidden="true"
            />
            <span>Registered in Texas</span>
          </div>

          {/* Canonical Brand Headline with Spark & Caveat Accent — docs/03-copy-deck.md:23
              Type per docs/04-design-system.md section 3:
              - text-display = --fontSize-display clamp(2.5rem, 5vw + 1rem, 4.5rem)
              - Bricolage weights are 600/700, so bold (700), not extrabold
              - tracking -0.02em, leading within 1.05-1.15 (1.1 gives the script room)
              - script accent: accent-400 on dark, optically matched to the sans.
                Caveat has a smaller x-height than Bricolage, so matching the
                x-height needs ~1.32em rather than the 1.15em nominal ratio.
                tracking-normal undoes the inherited negative heading tracking,
                which otherwise crowds a script face.

              Row 34 (D-031): the heading is split into three inline-block lines
              so each can reveal on its own 800ms ease-out pass with an 80ms
              step — line one, then "company.", then the Caveat word "One" last.
              The copy is untouched; only the markup that carries the timing is
              new. `hero-title` delays the spark accent with the final line. */}
          <h1 className="hero-title text-display font-bold tracking-[-0.02em] text-surface leading-[1.1] heading-spark">
            <span className="hero-line hero-line-1">Three disciplines.</span>
            <br />
            <span className="hero-line hero-line-2 font-script text-[1.32em] tracking-normal text-accent-400">
              One
            </span>{" "}
            <span className="hero-line hero-line-3">company.</span>
          </h1>

          {/* Verbatim Approved Copy — docs/03-copy-deck.md:24
              text-on-dark is the documented light-text token; body-lg is the
              spec body size (1.125rem). Previously text-surface/90 + sm:text-xl,
              which both drifted from the token set and exceeded the scale. */}
          <p className="hero-sub text-lg text-text-on-dark leading-[1.65] font-normal max-w-xl">
            NICBEN manages construction-related projects, improves and maintains
            properties, and manages its own corporate treasury and investments.
          </p>

          {/* Dual CTAs — docs/03-copy-deck.md:25-26 */}
          <div className="hero-actions pt-2 flex flex-wrap items-center gap-4">
            <Button variant="accent" size="lg" withArrow href="/contact">
              Get in Touch
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="#what-we-do"
              className="!bg-surface/10 !text-surface !border-surface/30 hover:!bg-surface/20 backdrop-blur-md transition-all duration-200"
            >
              What We Do
            </Button>
          </div>

          {/* Fact chips — docs/03-copy-deck.md:27-28
              Row 36: translateY 12px -> 0 with opacity, 450ms, 150ms stagger.
              Copy unchanged; `hero-chip` only adds the timing. */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <span className="hero-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface/10 backdrop-blur-sm border border-surface/15 text-xs font-semibold text-text-on-dark/85 hover:bg-surface/20 hover:border-surface/30 transition-all duration-200 cursor-default">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Registered in Texas
            </span>
            <span className="hero-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface/10 backdrop-blur-sm border border-surface/15 text-xs font-semibold text-text-on-dark/85 hover:bg-surface/20 hover:border-surface/30 transition-all duration-200 cursor-default">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Serving clients across the US
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
