import type { Metadata } from "next";
import Link from "next/link";
import { LegalTocLayout } from "@/components/ui/LegalTocLayout";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

/**
 * Legal shell only. No legal text is generated: the lawyer-supplied copy will
 * fill the prose containers once confirmed
 * (`docs/03-copy-deck.md` section 13, `[PENDING CLIENT / LAWYER]`).
 *
 * R-K: `/terms` has no `03-copy-deck.md` section 14 row. The title is the
 * authorised shell H1 (`Terms of Use`, Phase 04 brief section 3.6) plus the site
 * name, and the description is the deck's own company statement (`:13`) used
 * verbatim — no metadata string is authored.
 */
export const metadata: Metadata = {
  title: "Terms of Use | NICBEN",
  description:
    "NICBEN Asset Holdings & Investments LLC is a privately owned company registered in Texas.",
};

const sections = [
  { id: "terms-overview", heading: "Overview" },
  { id: "terms-use-of-this-website", heading: "Use of this website" },
  { id: "terms-enquiries-and-quotes", heading: "Enquiries and quotes" },
  { id: "terms-intellectual-property", heading: "Intellectual property" },
  { id: "terms-third-party-links", heading: "Third-party links" },
  { id: "terms-limitation-of-liability", heading: "Limitation of liability" },
  { id: "terms-governing-law", heading: "Governing law" },
  { id: "terms-contact", heading: "Contact" },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      {/* Legal shell — TOC + empty prose containers only.
          Header clearance is global (`app/layout.tsx`), so this hero keeps the
          standard pt-8 sm:pt-12 section rhythm. */}
      <SectionWrapper
        background="tint-50"
        className="pt-8 sm:pt-12 pb-16 lg:pb-24"
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
              Terms of Use
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl mb-12 sm:mb-16">
          <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            Terms of Use
          </h1>
        </div>

        <LegalTocLayout sections={sections} />
      </SectionWrapper>
    </main>
  );
}
