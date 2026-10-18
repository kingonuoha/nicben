import type { Metadata } from "next";
import Link from "next/link";
import { LegalTocLayout } from "@/components/ui/LegalTocLayout";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

/**
 * Legal shell only. No legal text is generated: the lawyer-supplied copy will
 * fill the prose containers once confirmed
 * (`docs/03-copy-deck.md` section 13, `[PENDING CLIENT / LAWYER]`).
 *
 * R-K: `/privacy` has no `03-copy-deck.md` section 14 row. The title is the
 * authorised shell H1 (`Privacy Policy`, Phase 04 brief section 3.6) plus the
 * site name, and the description is the deck's own company statement (`:13`)
 * used verbatim — no metadata string is authored.
 */
export const metadata: Metadata = {
  title: "Privacy Policy | NICBEN",
  description:
    "NICBEN Asset Holdings & Investments LLC is a privately owned company registered in Texas.",
};

const sections = [
  { id: "privacy-overview", heading: "Overview" },
  { id: "privacy-information-we-collect", heading: "Information we collect" },
  { id: "privacy-how-information-is-used", heading: "How information is used" },
  { id: "privacy-sharing-and-disclosure", heading: "Sharing and disclosure" },
  { id: "privacy-retention-and-security", heading: "Retention and security" },
  { id: "privacy-your-choices", heading: "Your choices" },
  { id: "privacy-contact", heading: "Contact" },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl mb-12 sm:mb-16">
          <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            Privacy Policy
          </h1>
        </div>

        <LegalTocLayout sections={sections} />
      </SectionWrapper>
    </main>
  );
}
