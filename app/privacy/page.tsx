import type { Metadata } from "next";
import { LegalTocLayout } from "@/components/ui/LegalTocLayout";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

/**
 * Legal shell only. No legal text is generated: the lawyer-supplied copy will
 * fill the prose containers once confirmed
 * (`docs/03-copy-deck.md` section 13, `[PENDING CLIENT / LAWYER]`).
 */
export const metadata: Metadata = {
  title: "Privacy Policy | NICBEN",
  description:
    "Privacy information for the NICBEN Asset Holdings & Investments website.",
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
            Privacy Policy
          </h1>
        </div>

        <LegalTocLayout sections={sections} />
      </SectionWrapper>
    </main>
  );
}
