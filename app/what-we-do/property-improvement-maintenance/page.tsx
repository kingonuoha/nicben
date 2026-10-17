import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "Property Improvement & Maintenance | NICBEN",
  description:
    "Improvement, renovation, plumbing and maintenance for residential and commercial properties.",
};

export default function PropertyImprovementMaintenancePage() {
  const services = [
    {
      title: "Property improvement",
      description: "Improvements to residential and commercial properties.",
    },
    {
      title: "Renovation",
      description:
        "Renovation work for residential and commercial properties.",
    },
    {
      title: "Plumbing",
      description: "Plumbing work carried out by qualified technicians.",
    },
    {
      title: "Maintenance",
      description:
        "Ongoing and one-off maintenance for residential and commercial properties.",
    },
    {
      title: "Related contracting",
      description: "Other contracting services connected to the above.",
    },
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
              Property Improvement &amp; Maintenance
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <EyebrowChip dotColor="teal">Pillar 02</EyebrowChip>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-950 mt-6 leading-tight heading-spark">
            Property improvement &amp; maintenance
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            We handle improvement, renovation, plumbing and maintenance for
            residential and commercial properties, through qualified contractors
            and technicians.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              withArrow
              href="/contact?enquiry=property-improvement-maintenance"
            >
              Discuss your property
            </Button>
            <Button variant="secondary" href="/what-we-do">
              All Disciplines
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. SERVICES LIST */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-3xl mb-12">
          <EyebrowChip dotColor="sky">Services</EyebrowChip>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 mt-4 tracking-tight">
            Our trade services
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Card
              key={service.title}
              variant={index === 1 ? "tint" : "surface"}
              className="p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                  0{index + 1}
                </span>
                <h3 className="text-xl font-bold text-ink-950 mt-2">
                  {service.title}
                </h3>
                <p className="text-text-600 text-sm mt-3 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </SectionWrapper>

      {/* 3. RESIDENTIAL AND COMMERCIAL NOTE
          docs/01-sitemap-wireframes.md:69. Both visible strings are deck verbatim:
          the H2 is the deck's own "residential and commercial properties"
          (docs/03-copy-deck.md:100-103) and the body is the pillar card text
          (docs/03-copy-deck.md:36). The design screen's two scope cards
          (docs/design/nicben_property_improvement_maintenance/code.html:115-192)
          hold mock-only headings and bullets, so no scope-card wording is
          reproduced and no eyebrow is shown — no cited eyebrow string exists. */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="relative overflow-hidden rounded-lg bg-surface border border-line shadow-card p-6 sm:p-8 lg:p-10">
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500"
            aria-hidden="true"
          />
          <div className="pl-2 sm:pl-3 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 tracking-tight">
              Residential and commercial properties
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-600 leading-relaxed font-normal">
              Improvement, renovation, plumbing and maintenance for residential
              and commercial properties, carried out by qualified contractors and
              technicians.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* 4. CTA BAND */}
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
            <Button
              variant="accent"
              withArrow
              href="/contact?enquiry=property-improvement-maintenance"
            >
              Discuss your property
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
