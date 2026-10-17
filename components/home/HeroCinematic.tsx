import React from "react";
import { Button } from "@/components/ui/Button";

interface HeroCinematicProps {
  /**
   * Optional custom background image URL.
   * Defaults to an executive asset holdings / corporate architectural portrait.
   */
  imageUrl?: string;
  imageAlt?: string;
}

export function HeroCinematic({
  imageUrl = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2000&q=85",
  imageAlt = "Corporate asset holdings executive in tailored suit overlooking high-rise capital portfolio",
}: HeroCinematicProps) {
  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-ink-950">
      {/* 1. Full-Bleed Background Image (Runs edge-to-edge from the top of the browser under navigation) */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover object-center transform scale-[1.01]"
        />

        {/* 
          2. Directional Gradient Fade (Left-to-Right):
          Starts solid ink-950 at the left to guarantee 100% typography contrast,
          then fades out to 0% (transparent) by 70% width, leaving the right side 
          of the image completely clear and visible.
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(6, 43, 54, 0.96) 0%, rgba(6, 43, 54, 0.88) 35%, rgba(6, 43, 54, 0.45) 55%, rgba(6, 43, 54, 0) 70%)",
          }}
          aria-hidden="true"
        />

        {/* Subtle top shade so white navigation pills stay crisp on white backgrounds */}
        <div
          className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-950/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Content Container (Padded top for fixed header clearance, centered vertically) */}
      <div className="relative z-10 w-full max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-36 sm:pb-24">
        <div className="max-w-2xl lg:max-w-3xl space-y-6">
          {/* Pill Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface/15 backdrop-blur-md border border-surface/20 text-xs font-semibold uppercase tracking-wider text-accent-300 shadow-sm">
            <span
              className="w-2 h-2 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(63,183,245,0.8)]"
              aria-hidden="true"
            />
            <span>Registered in Texas</span>
          </div>

          {/* Canonical Brand Headline with Spark & Caveat Accent */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface leading-[1.05] heading-spark">
            Three disciplines.<br />
            <span className="font-script text-[1.18em] text-accent-300">One</span>{" "}
            company.
          </h1>

          {/* Verbatim Approved Copy */}
          <p className="text-lg sm:text-xl text-text-on-dark/90 leading-relaxed font-normal max-w-xl">
            NICBEN manages construction-related projects, improves and maintains
            properties, and manages its own corporate treasury and investments.
          </p>

          {/* Dual CTAs */}
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

          {/* Verified Fact Badges */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface/10 backdrop-blur-sm border border-surface/15 text-xs font-semibold text-text-on-dark/85">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Texas LLC
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface/10 backdrop-blur-sm border border-surface/15 text-xs font-semibold text-text-on-dark/85">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Serving clients across U.S. states
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
