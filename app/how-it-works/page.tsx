import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CtaBand } from "@/components/ui/CtaBand";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { ProcessTimeline } from "@/components/ui/ProcessTimeline";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "How It Works | NICBEN",
  description:
    "From enquiry to completion: how NICBEN coordinates construction and property projects.",
};

const steps = [
  {
    num: "01",
    title: "Enquiry",
    body: "Tell us about the project through the contact form, by email or by phone.",
  },
  {
    num: "02",
    title: "Assessment and quote",
    body: "We review the scope and talk through what is needed.",
  },
  {
    num: "03",
    title: "Agreement",
    body: "We confirm the scope and terms with you before work begins.",
  },
  {
    num: "04",
    title: "Coordination and delivery",
    body: "We engage qualified contractors and technicians and coordinate the work at your location.",
  },
  {
    num: "05",
    title: "Completion",
    body: "We confirm the work is complete with you.",
  },
];

const preparation = [
  { label: "Location", icon: "pin" },
  { label: "A short description of the work", icon: "document" },
  { label: "Photos if you have them", icon: "photo" },
  { label: "Your preferred timing", icon: "clock" },
] as const;

const icons: Record<string, ReactNode> = {
  pin: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </>
  ),
  document: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  ),
  photo: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z"
    />
  ),
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      {/* 1. STEPS
          ⚠️ OUT-OF-CONTRACT REPAIR (Phase 04): `app/layout.tsx` lost its global
          `pt-20` header clearance while this phase was in flight, so this hero
          pads itself clear of the fixed pill header. Revert to `pt-8 sm:pt-12`
          if global clearance is restored. */}
      <SectionWrapper
        background="tint-50"
        className="pt-28 sm:pt-32 pb-16 lg:pb-20"
      >
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            How it works
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            Every project is different, but the path usually looks like this.
          </p>
        </div>
      </SectionWrapper>

      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <EyebrowChip dotColor="teal">How it works</EyebrowChip>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 mt-4 tracking-tight">
            From enquiry to completion
          </h2>
        </div>

        <ProcessTimeline steps={steps} />
      </SectionWrapper>

      {/* 2. WHAT TO PREPARE */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-5">
            <EyebrowChip dotColor="sky">How it works</EyebrowChip>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 tracking-tight">
              What to prepare
            </h2>
            <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
              Location, a short description of the work, photos if you have them,
              and your preferred timing.
            </p>
          </div>

          <ul className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {preparation.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-md bg-surface border border-line shadow-card p-6"
              >
                <span
                  className="w-10 h-10 rounded-md bg-tint-100 text-brand-700 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    {icons[item.icon]}
                  </svg>
                </span>
                <span className="text-sm font-semibold text-ink-950">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </SectionWrapper>

      {/* 3. FAQ TEASER */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="max-w-2xl mb-10">
          <EyebrowChip dotColor="teal">FAQ</EyebrowChip>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-950 mt-4 tracking-tight">
            FAQ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <Card variant="surface" className="flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-ink-950 leading-snug">
                Do you do the work yourselves?
              </h3>
              <p className="text-sm text-text-600 leading-relaxed">
                We coordinate projects by engaging qualified contractors and
                technicians to perform the work at your location.
              </p>
            </div>
          </Card>

          <Card variant="tint" className="flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-ink-950 leading-snug">
                How do I start a project or ask for a quote?
              </h3>
              <p className="text-sm text-text-600 leading-relaxed">
                Send an enquiry through the contact form, or reach us by email or
                phone. We will get back to you to discuss the scope.
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-10">
          <Button variant="secondary" href="/faq">
            FAQ
          </Button>
        </div>
      </SectionWrapper>

      {/* 4. CTA BAND */}
      <CtaBand />
    </main>
  );
}
