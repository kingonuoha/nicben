import React from "react";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Reveal } from "@/components/motion/Reveal";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

/**
 * Phase 03 CTA band treatment, extracted so Phase 04 pages reuse the exact
 * same markup. Copy is verbatim from `docs/03-copy-deck.md` section 2 (CTA band).
 *
 * R2a-5 / D-014: the H2 carries the `heading-spark` so this band is identical to
 * the Phase 03 treatment on every route. Spark budget: one on the page H1 plus
 * one here, never on interior section headings.
 *
 * Motion row 45 (`docs/05-motion-spec.md` section 4): the band fades up 600ms at
 * 20% in view, once, and the script word's underline draws left to right. The
 * band stays a server component — it only *renders* the two client primitives,
 * so nothing here becomes interactive and no copy moves into a client bundle.
 */
export const CtaBand: React.FC = () => {
  return (
    <SectionWrapper background="ink" className="border-t border-ink-950/40">
      <Reveal
        className="max-w-3xl mx-auto text-center flex flex-col items-center"
        speed="medium"
        threshold={0.2}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface tracking-tight leading-tight heading-spark">
          Have a project or an enquiry?{" "}
          <span className="relative inline-block font-script text-[1.18em] text-accent-300">
            Talk
            <ScrollProgress className="absolute inset-x-0 -bottom-1 h-1 rounded-pill bg-accent-300/70" />
          </span>{" "}
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
      </Reveal>
    </SectionWrapper>
  );
};
