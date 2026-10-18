import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { CtaBand } from "@/components/ui/CtaBand";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "FAQ | NICBEN",
  description:
    "Answers about what NICBEN does, how projects start, and how the company operates.",
};

const facts = [
  {
    title: "Registered in Texas",
    detail: "Privately owned limited liability company",
  },
  {
    title: "Company-owned funds",
    detail: "No external investment solicitation",
  },
  {
    title: "Project-based work",
    detail: "Qualified contractors and technicians",
  },
];

const jumpLinks = [
  { label: "About the company", href: "#faq-group-about" },
  { label: "Projects and quotes", href: "#faq-group-projects" },
  { label: "The investments pillar", href: "#faq-group-investments" },
  { label: "Contact", href: "#faq-group-contact" },
];

const groups = [
  {
    id: "faq-group-about",
    title: "About the company",
    items: [
      {
        id: "faq-1",
        question: "What does NICBEN do?",
        answer:
          "NICBEN manages construction-related projects, improves and maintains residential and commercial properties, and manages its own corporate treasury and investments.",
      },
      {
        id: "faq-2",
        question: "Where are you based and where do you work?",
        answer:
          "We are registered in Texas and serve clients in various U.S. states, based on project requests.",
      },
      {
        id: "faq-3",
        question: "How do clients find you?",
        answer:
          "Mostly through professional referrals, client referrals, direct enquiries and repeat customers.",
      },
    ],
  },
  {
    id: "faq-group-projects",
    title: "Projects and quotes",
    items: [
      {
        id: "faq-4",
        question: "Do you do the work yourselves?",
        answer:
          "We coordinate projects by engaging qualified contractors and technicians to perform the work at your location.",
      },
      {
        id: "faq-5",
        question: "How do I start a project or ask for a quote?",
        answer:
          "Send an enquiry through the contact form, or reach us by email or phone. We will get back to you to discuss the scope.",
      },
    ],
  },
  {
    id: "faq-group-investments",
    title: "The investments pillar",
    items: [
      {
        id: "faq-9",
        question:
          "Does NICBEN accept investments from the public or manage money for others?",
        answer:
          "No. NICBEN's investments are made with company-owned funds, solely for the company's benefit, and are not conducted on behalf of third parties.",
        extra: (
          <div className="rounded-md bg-tint-50 border border-line border-l-4 border-l-brand-500 p-6 flex items-start gap-4">
            <span
              className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-2 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Informational only
              </span>
              <p className="text-sm font-semibold text-ink-950 leading-relaxed">
                This page is for information only. It is not an offer, invitation
                or solicitation to invest, and NICBEN does not offer investment
                services to third parties.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "faq-group-contact",
    title: "Contact",
    items: [
      {
        id: "faq-10",
        question: "How can I reach you?",
        answer:
          "By the contact form, by email or by phone. Details are on the Contact page.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen">
      {/* 1. HERO
          Header clearance is global (`app/layout.tsx`), so this hero keeps the
          standard pt-8 sm:pt-12 section rhythm. */}
      <SectionWrapper
        background="tint-50"
        className="relative overflow-hidden pt-8 sm:pt-12 pb-16 lg:pb-20"
      >
        {/* Architectural grid backdrop from the design screen, rendered from the
            shared token texture at the documented faint strength
            (`docs/04-design-system.md` section 5). Decorative. */}
        <div
          className="absolute inset-0 opacity-5 texture-grid pointer-events-none"
          aria-hidden="true"
        />

        <nav aria-label="Breadcrumb" className="relative z-10 mb-6">
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
              FAQ
            </li>
          </ol>
        </nav>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-8">
            <EyebrowChip dotColor="sky" className="mb-6">
              FAQ
            </EyebrowChip>

            <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
              FAQ
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal max-w-2xl">
              Answers about what NICBEN does, how projects start, and how the
              company operates.
            </p>
          </div>

          <div className="lg:col-span-4 rounded-lg bg-surface border border-line shadow-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Registered in Texas
              </span>
              <span className="text-brand-700" aria-hidden="true">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </span>
            </div>
            <div>
              <p className="font-heading text-base font-bold text-ink-950">
                NICBEN Asset Holdings &amp; Investments LLC
              </p>
              <p className="text-sm text-text-600 mt-1">
                Privately owned limited liability company.
              </p>
            </div>
            <div className="pt-2 border-t border-line flex items-center gap-2 text-xs text-text-600">
              <span
                className="w-2 h-2 rounded-full bg-brand-500"
                aria-hidden="true"
              />
              Project-based work
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. QUICK FACTS STRIP */}
      <SectionWrapper background="surface" className="border-t border-line">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {facts.map((fact) => (
            <li
              key={fact.title}
              className="flex items-center gap-4 rounded-md bg-surface border border-line shadow-card p-4"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-heading text-base font-bold text-ink-950">
                  {fact.title}
                </p>
                <p className="text-sm text-text-600">{fact.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </SectionWrapper>

      {/* 3. GROUPS */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="mb-12">
          <EyebrowChip dotColor="teal">FAQ</EyebrowChip>
          <nav aria-label="FAQ topics" className="mt-6">
            <ul className="flex flex-wrap items-center gap-2 rounded-md bg-surface border border-line p-2 w-fit max-w-full shadow-card">
              <li>
                <a
                  href="#faq-group-about"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-ink-950 text-surface text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent-400"
                    aria-hidden="true"
                  />
                  All questions
                </a>
              </li>
              {jumpLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex items-center px-4 py-2 rounded-sm text-sm text-text-600 hover:text-ink-950 hover:bg-tint-100 transition-colors duration-[var(--motion-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Accordion groups={groups} defaultOpenId="faq-1" />
      </SectionWrapper>

      {/* 4. CTA BAND */}
      <CtaBand />
    </main>
  );
}
