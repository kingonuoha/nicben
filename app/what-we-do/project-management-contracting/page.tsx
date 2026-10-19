import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Project Management & Contracting",
  description:
    "We coordinate construction-related projects with qualified contractors and technicians, working at your location.",
  openGraph: {
    title: "Project Management & Contracting | NICBEN",
    description:
      "We coordinate construction-related projects with qualified contractors and technicians, working at your location.",
    url: "https://nicben.com/what-we-do/project-management-contracting",
    images: [
      {
        url: "/images/brand/nicben-meta-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Project Management & Contracting — NICBEN",
      },
    ],
  },
};

export default function ProjectManagementContractingPage() {
  /* docs/03-copy-deck.md:85-89 supplies these scope TITLES only, marked
     [CLIENT TO CONFIRM scope items]. Four invented descriptions previously
     sat here — pure mock copy with zero deck hits. Removed per D-008/D-018.
     Do not add descriptive copy until the deck supplies it. */
  const scopeItems = [
    "Project coordination",
    "Engaging qualified contractors and technicians",
    "Scheduling and progress oversight",
    "Handover on completion",
  ];

  const steps = [
    { num: "1", title: "Enquiry" },
    { num: "2", title: "Assessment and quote" },
    { num: "3", title: "Agreement" },
    { num: "4", title: "Coordination and delivery" },
    { num: "5", title: "Completion" },
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
              Project Management &amp; Contracting
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <Reveal from="bottom" speed="base">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface border border-line text-xs font-semibold text-brand-700 mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              <span>Pillar 01 · Discipline Overview</span>
            </div>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={80}>
            <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
              Project management &amp; contracting
            </h1>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={160}>
            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
              We coordinate construction-related projects by engaging qualified
              contractors and technicians to perform the work at client locations.
              Every engagement is project-based, so the scope follows what the
              project needs.
            </p>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                withArrow
                href="/contact?enquiry=project-management-contracting"
              >
                Discuss a project
              </Button>
              <Button variant="secondary" href="/what-we-do">
                What We Do
              </Button>
            </div>
          </Reveal>
        </div>
      </SectionWrapper>

      {/* 2. WHAT THIS COVERS */}
      <SectionWrapper background="surface" className="border-t border-line">
        <Reveal from="bottom" speed="base" threshold={0.2} margin="0px 0px -12% 0px">
          <div className="max-w-3xl mb-12">
            <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
              What this covers
            </h2>
          </div>
        </Reveal>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          step={80}
          threshold={0.2}
          margin="0px 0px -12% 0px"
        >
          {scopeItems.map((item, index) => (
            <StaggerItem key={item} className="flex">
              <Card
                variant="surface"
                className="group p-6 sm:p-8 flex flex-col justify-between w-full hover:border-brand-500 transition-colors"
              >
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
                <h3 className="text-xl font-bold text-ink-950 mt-4 leading-snug">
                  {item}
                </h3>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </SectionWrapper>

      {/* 3. HOW A PROJECT RUNS */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <Reveal from="bottom" speed="base" threshold={0.2} margin="0px 0px -12% 0px">
          <div className="max-w-3xl mb-12">
            <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
              How a project runs
            </h2>
          </div>
        </Reveal>

        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6"
          step={80}
          threshold={0.2}
          margin="0px 0px -12% 0px"
        >
          {steps.map((step) => (
            <StaggerItem key={step.num} className="flex">
              <div
                className="group card-lift w-full p-5 rounded-xl border border-line bg-surface flex flex-col justify-between shadow-sm hover:border-brand-500 transition-all duration-200"
              >
                <span className="w-9 h-9 rounded-full bg-tint-100 text-brand-700 font-heading text-sm font-extrabold flex items-center justify-center transition-all duration-200 group-hover:bg-brand-500 group-hover:text-surface">
                  {step.num}
                </span>
                <p className="text-sm font-semibold text-ink-950 mt-4">
                  {step.title}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
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
                href="/contact?enquiry=project-management-contracting"
              >
                Discuss a project
              </Button>
            </div>
          </div>
        </SectionWrapper>
      </Reveal>
    </main>
  );
}
