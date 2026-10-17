import React from "react";

export interface LegalSection {
  /** Anchor id, e.g. `privacy-overview`. */
  id: string;
  heading: string;
}

export interface LegalTocLayoutProps {
  sections: readonly LegalSection[];
}

/**
 * TOC shell + prose container for `/privacy` and `/terms`.
 *
 * No legal text is generated: each section renders its structural heading and
 * an empty prose container that the confirmed lawyer-supplied copy will fill
 * (`docs/03-copy-deck.md` section 13, `[PENDING CLIENT / LAWYER]`).
 */
export const LegalTocLayout: React.FC<LegalTocLayoutProps> = ({ sections }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
      <nav
        aria-label="On this page"
        className="lg:col-span-4 lg:sticky lg:top-28"
      >
        <div className="rounded-md bg-surface border border-line shadow-card p-6">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
            Contents
          </span>
          <ol className="mt-4 space-y-2.5">
            {sections.map((section, index) => (
              <li key={section.id} className="flex items-baseline gap-2">
                <span
                  className="text-xs font-semibold text-text-600 tabular-nums"
                  aria-hidden="true"
                >
                  {index + 1}.
                </span>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-text-600 hover:text-ink-950 transition-colors rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <div className="lg:col-span-8 space-y-10">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="scroll-mt-28 border-b border-line pb-10 last:border-b-0 last:pb-0"
          >
            <h2
              id={`${section.id}-heading`}
              className="text-xl sm:text-2xl font-bold text-ink-950 tracking-tight"
            >
              {section.heading}
            </h2>
            <div className="mt-4 space-y-4 text-text-600 leading-relaxed" />
          </section>
        ))}
      </div>
    </div>
  );
};
