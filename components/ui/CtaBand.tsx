import React from "react";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

/**
 * Phase 03 CTA band treatment, extracted so Phase 04 pages reuse the exact
 * same markup. Copy is verbatim from `docs/03-copy-deck.md` section 2 (CTA band).
 *
 * R2a-5 / D-014: the H2 carries the `heading-spark` so this band is identical to
 * the Phase 03 treatment on every route. Spark budget: one on the page H1 plus
 * one here, never on interior section headings.
 */
export const CtaBand: React.FC = () => {
  return (
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
  );
};
