import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "Corporate Treasury & Investments | NICBEN",
  description:
    "NICBEN manages its own corporate treasury and investments using company-owned funds, for the company's benefit only.",
};

export default function TreasuryInvestmentsPage() {
  /* docs/03-copy-deck.md:113-116 supplies these three "What this means" bullets
     as titles only. The build previously added three uncited, claim-shaped
     descriptions here — including an unapproved legal/regulatory negative
     assurance. Removed per D-002/D-008/D-018. The deck's §6 notice box below
     carries the only approved legal text, and it is [PENDING CLIENT / LAWYER
     REVIEW]. Do not add claim copy here. */
  const principles = [
    "Company-owned funds only",
    "Made solely for the benefit of NICBEN",
    "Not conducted on behalf of third parties",
  ];

  return (
    <main className="min-h-screen">
      {/* 1. BREADCRUMBS & HERO */}
      <SectionWrapper background="tint-50" className="pt-8 sm:pt-12 pb-16 lg:pb-20">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs font-semibold text-text-600">
            <li>
              <Link href="/" className="hover:text-ink-950 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/what-we-do"
                className="hover:text-ink-950 transition-colors"
              >
                What We Do
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-950" aria-current="page">
              Corporate Treasury &amp; Investments
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            Corporate treasury &amp; investments
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            In addition to its project work, NICBEN manages its own corporate
            treasury and evaluates investment opportunities using company-owned
            funds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              withArrow
              href="/contact?enquiry=general-or-business-enquiry"
            >
              General enquiries
            </Button>
            <Button variant="secondary" href="/what-we-do">
              What We Do
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. WHAT THIS MEANS — H2 is deck:113. The `Governance` eyebrow that sat
          above it had no deck line and was deleted (D-008/D-018). */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-3xl mb-12">
          <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
            What this means
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {principles.map((item, index) => (
            <Card
              key={item}
              variant={index === 2 ? "tint" : "surface"}
              className="p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <span
                  className="text-xs font-bold text-brand-700 uppercase tracking-wider"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <h3 className="text-xl font-bold text-ink-950 mt-2">
                  {item}
                </h3>
              </div>
            </Card>
          ))}
        </div>

        {/* 3. REGULATORY / LEGAL NOTICE BOX (Strictly Fenced) */}
        <div className="mt-12">
          <div className="rounded-2xl border-l-4 border-brand-500 bg-tint-50 p-6 sm:p-8 border border-line">
            <div className="flex items-start gap-4">
              <span
                className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-2 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-2">
                {/* `Legal Notice` stood here. `docs/03-copy-deck.md` section 6
                    calls this element a "Notice box" and supplies its body only
                    (`:117`, rendered verbatim below); the label had no deck line
                    and was deleted (R-L). */}
                <p className="text-sm font-semibold text-ink-950 leading-relaxed">
                  This page is for information only. It is not an offer,
                  invitation or solicitation to invest, and NICBEN does not offer
                  investment services to third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 4. GENERAL ENQUIRIES CTA BAND (No investor solicitation) */}
      <SectionWrapper background="ink" className="border-t border-ink-950/40">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-h2 font-extrabold text-surface tracking-tight leading-tight heading-spark">
            Have a project or an enquiry? Talk to us.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-on-dark/80">
            Reach us by email, phone or message.
          </p>
          <div className="mt-8">
            <Button
              variant="accent"
              withArrow
              href="/contact?enquiry=general-or-business-enquiry"
            >
              General enquiries
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
