import type { Metadata } from "next";
import { LegalTocLayout } from "@/components/ui/LegalTocLayout";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

/**
 * Legal shell only. No legal text is generated: the lawyer-supplied copy will
 * fill the prose containers once confirmed
 * (`docs/03-copy-deck.md` section 13, `[PENDING CLIENT / LAWYER]`).
 */
export const metadata: Metadata = {
  title: "Terms of Use | NICBEN",
  description:
    "Terms of use for the NICBEN Asset Holdings & Investments website.",
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
          ⚠️ OUT-OF-CONTRACT REPAIR (Phase 04): `app/layout.tsx` lost its global
          `pt-20` header clearance while this phase was in flight, so this hero
          pads itself clear of the fixed pill header. Revert to `pt-8 sm:pt-12`
          if global clearance is restored. */}
      <SectionWrapper
        background="tint-50"
        className="pt-28 sm:pt-32 pb-16 lg:pb-24"
      >
        <div className="max-w-3xl mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            Terms of Use
          </h1>
        </div>

        <LegalTocLayout sections={sections} />
      </SectionWrapper>
    </main>
  );
}
