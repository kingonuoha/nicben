import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "Project Management & Contracting | NICBEN",
  description:
    "We coordinate construction-related projects with qualified contractors and technicians, working at your location.",
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
          <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            Project management &amp; contracting
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            We coordinate construction-related projects by engaging qualified
            contractors and technicians to perform the work at client locations.
            Every engagement is project-based, so the scope follows what the
            project needs.
          </p>

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
        </div>
      </SectionWrapper>

      {/* 2. WHAT THIS COVERS — H2 is deck:85 ("What this covers"). The `Scope`
          eyebrow that sat above it had no deck line and was deleted (D-008/D-018). */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-3xl mb-12">
          <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
            What this covers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {scopeItems.map((item, index) => (
            <Card key={item} variant="surface" className="p-6 sm:p-8">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                0{index + 1}
              </span>
              <h3 className="text-xl font-bold text-ink-950 mt-2">
                {item}
              </h3>
            </Card>
          ))}
        </div>
      </SectionWrapper>

      {/* 3. HOW A PROJECT RUNS — H2 is deck:90. The `Process` eyebrow that sat
          above it had no deck line and was deleted (D-008/D-018). */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="max-w-3xl mb-12">
          <h2 className="text-h2 font-bold text-ink-950 tracking-tight">
            How a project runs
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-5 rounded-xl border border-line bg-surface flex flex-col justify-between shadow-sm"
            >
              <span className="text-2xl font-bold text-brand-700 font-heading">
                {step.num}
              </span>
              <p className="text-sm font-semibold text-ink-950 mt-3">
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* 4. CTA BAND */}
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
    </main>
  );
}
