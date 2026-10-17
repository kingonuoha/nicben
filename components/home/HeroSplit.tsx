import React from "react";
import { Button } from "@/components/ui/Button";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { HeroCluster } from "@/components/ui/HeroCluster";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export function HeroSplit() {
  return (
    <SectionWrapper background="tint-50" className="pt-24 sm:pt-28 pb-16 lg:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 flex flex-col items-start">
          <EyebrowChip dotColor="teal">Registered in Texas</EyebrowChip>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-950 mt-6 leading-none heading-spark">
            Three disciplines.<br />
            <span className="font-script text-[1.18em] text-brand-700">One</span>{" "}
            company.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal max-w-xl">
            NICBEN manages construction-related projects, improves and maintains
            properties, and manages its own corporate treasury and investments.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button variant="primary" withArrow href="/contact">
              Get in Touch
            </Button>
            <Button variant="secondary" href="#what-we-do">
              What We Do
            </Button>
          </div>

          {/* Verified Fact Badges */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface border border-line text-xs font-semibold text-text-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Registered in Texas
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface border border-line text-xs font-semibold text-text-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />
              Serving clients across the US
            </span>
          </div>
        </div>

        {/* Right Column: Hero Cluster */}
        <div className="lg:col-span-5">
          <HeroCluster />
        </div>
      </div>
    </SectionWrapper>
  );
}
