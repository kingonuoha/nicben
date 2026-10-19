import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";

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
          <Reveal from="bottom" speed="base">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface border border-line text-xs font-semibold text-brand-700 mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              <span>Pillar 02 · Trade Disciplines</span>
            </div>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={80}>
            <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
              Property improvement &amp; maintenance
            </h1>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={160}>
            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
              We handle improvement, renovation, plumbing and maintenance for
              residential and commercial properties, through qualified contractors
              and technicians.
            </p>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                withArrow
                href="/contact?enquiry=property-improvement-maintenance"
              >
                Discuss your property
              </Button>
              <Button variant="secondary" href="/what-we-do">
                What We Do
              </Button>
            </div>
          </Reveal>
        </div>
      </SectionWrapper>

      {/* 2. SERVICES LIST */}
      <SectionWrapper background="surface" className="border-t border-line">
        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          step={80}
          threshold={0.2}
          margin="0px 0px -12% 0px"
        >
          {services.map((service, index) => (
            <StaggerItem key={service.title} className="flex">
              <Card
                variant={index === 1 ? "tint" : "surface"}
                className="group p-6 sm:p-8 flex flex-col justify-between w-full hover:border-brand-500 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center font-bold text-xs transition-colors duration-200 group-hover:bg-brand-500 group-hover:text-surface">
                      0{index + 1}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-tint-100/60 text-brand-700 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-ink-950 mt-4 leading-snug">
                    {service.title}
                  </h2>
                  <p className="text-text-600 text-sm mt-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </SectionWrapper>

      {/* 3. RESIDENTIAL AND COMMERCIAL NOTE */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <Reveal from="bottom" speed="base" threshold={0.2} margin="0px 0px -12% 0px">
          <div className="group card-lift relative overflow-hidden rounded-xl bg-surface border border-line hover:border-brand-500 shadow-card p-6 sm:p-8 lg:p-10 transition-all duration-300">
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500"
              aria-hidden="true"
            />
            <div className="pl-2 sm:pl-3 max-w-3xl">
              <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
                Residential and commercial properties
              </h2>
              <p className="mt-4 text-base sm:text-lg text-text-600 leading-relaxed font-normal">
                Improvement, renovation, plumbing and maintenance for residential
                and commercial properties, carried out by qualified contractors and
                technicians.
              </p>
            </div>
          </div>
        </Reveal>
      </SectionWrapper>

      {/* 4. CTA BAND */}
      <Reveal from="bottom" speed="base" threshold={0.2} margin="0px 0px -12% 0px">
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
                href="/contact?enquiry=property-improvement-maintenance"
              >
                Discuss your property
              </Button>
            </div>
          </div>
        </SectionWrapper>
      </Reveal>
    </main>
  );
}
