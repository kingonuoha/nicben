import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/ui/CtaBand";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Hidden route. `/projects` is intentionally not linked from the header or the
 * footer and is excluded from `sitemap.xml` until real projects exist
 * (`docs/03-copy-deck.md` section 12, `docs/01-sitemap-wireframes.md` section 4).
 */
export const metadata: Metadata = {
  title: "Our projects | NICBEN",
  description: "A selection of recent work.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen">
      {/* 1. INTRO */}
      <SectionWrapper
        background="tint-50"
        className="pt-8 sm:pt-12 pb-16 lg:pb-20"
      >
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-eyebrow font-semibold text-text-600">
            <li>
              <Link
                href="/"
                className="hover:text-ink-950 transition-colors duration-[var(--motion-dur-fast)] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-950" aria-current="page">
              Projects
            </li>
          </ol>
        </nav>

        <div className="max-w-2xl">
          <Reveal from="bottom" speed="base">
            <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
              Our projects
            </h1>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={120}>
            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
              A selection of recent work.
            </p>
          </Reveal>
        </div>
      </SectionWrapper>

      {/* 2. EMPTY STATE — Smooth quiet reveal with architectural blueprint icon */}
      <SectionWrapper background="surface" className="border-t border-line">
        <Reveal from="bottom" speed="medium" threshold={0.2} margin="0px 0px -12% 0px">
          <EmptyState
            title="Projects will be added here soon."
            noteBody="NICBEN Asset Holdings &amp; Investments LLC is a privately owned limited liability company registered in Texas."
          />
        </Reveal>
      </SectionWrapper>

      {/* 3. CTA BAND */}
      <CtaBand />
    </main>
  );
}
