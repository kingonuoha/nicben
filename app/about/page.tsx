import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CornerArrowButton } from "@/components/ui/CornerArrowButton";
import { CtaBand } from "@/components/ui/CtaBand";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ShapePanel } from "@/components/ui/ShapePanel";

export const metadata: Metadata = {
  title: "About NICBEN",
  description:
    "A privately owned Texas limited liability company working on a project basis across various U.S. states.",
};

const pillars = [
  {
    num: "01",
    title: "Project Management & Contracting",
    body: "We coordinate construction-related projects, engaging qualified contractors and technicians to carry out the work at your location.",
    href: "/what-we-do/project-management-contracting",
    variant: "surface" as const,
    // Icon tiles per `docs/04-design-system.md` section 5 (small line icon, one
    // set, 1.5px stroke) and the design screen. Identical on all three cards so
    // no pillar gains extra weight (D-001).
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
      />
    ),
  },
  {
    num: "02",
    title: "Property Improvement & Maintenance",
    body: "Improvement, renovation, plumbing and maintenance for residential and commercial properties, carried out by qualified contractors and technicians.",
    href: "/what-we-do/property-improvement-maintenance",
    variant: "tint" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
      />
    ),
  },
  {
    num: "03",
    title: "Corporate Treasury & Investments",
    body: "NICBEN manages its own corporate treasury and evaluates investment opportunities using company-owned funds, solely for the company's benefit.",
    href: "/what-we-do/treasury-investments",
    variant: "ink" as const,
    // Informational only — no solicitation language, no returns (D-002).
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    ),
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* 1. INTRO — WHO NICBEN IS
          Header clearance is global (`app/layout.tsx`), so this hero keeps the
          standard pt-8 sm:pt-12 section rhythm. */}
      <SectionWrapper
        background="tint-50"
        className="pt-8 sm:pt-12 pb-16 lg:pb-20"
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
              About
            </li>
          </ol>
        </nav>

        <div className="relative overflow-hidden rounded-lg bg-surface border border-line shadow-card px-6 py-10 sm:px-10 sm:py-14">
          <div
            className="absolute inset-0 opacity-5 texture-dots pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-3xl">
            <EyebrowChip dotColor="teal">Who we are</EyebrowChip>

            <h1 className="text-display font-extrabold tracking-tight text-ink-950 mt-6 leading-tight heading-spark">
              About NICBEN
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
              NICBEN Asset Holdings &amp; Investments LLC is a privately owned
              limited liability company registered in Texas. Its work covers
              project management and contracting, property improvement and
              maintenance, and the management of its own corporate treasury and
              investments.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-tint-100 border border-line text-xs font-semibold text-text-600">
                <span
                  className="w-2 h-2 rounded-full bg-brand-500"
                  aria-hidden="true"
                />
                Registered in Texas
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-tint-100 border border-line text-xs font-semibold text-text-600">
                <span
                  className="w-2 h-2 rounded-full bg-brand-500"
                  aria-hidden="true"
                />
                Serving clients across the US
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-tint-100 border border-line text-xs font-semibold text-text-600">
                <span
                  className="w-2 h-2 rounded-full bg-brand-500"
                  aria-hidden="true"
                />
                Project-based
              </span>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. HOW THE COMPANY OPERATES */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rotate-45 bg-brand-700 shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-600">
                How we operate
              </span>
            </div>

            <h2 className="text-h2 font-bold text-ink-950 tracking-tight leading-tight">
              How we operate
            </h2>

            <p className="text-base sm:text-lg text-text-600 leading-relaxed font-normal">
              We work on a project basis. For construction-related projects, we
              engage qualified contractors and technicians to perform the work at
              the client&apos;s location, which means we do not need to own or
              lease property where a project takes place.
            </p>

            <div className="relative overflow-hidden rounded-md bg-tint-50 border border-line shadow-card p-6">
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500"
                aria-hidden="true"
              />
              <div className="flex items-start gap-3 pl-2">
                <span
                  className="w-10 h-10 rounded-full bg-surface text-brand-700 flex items-center justify-center shrink-0 border border-line"
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
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-base sm:text-lg font-bold text-ink-950 leading-snug">
                    Texas LLC · Project-based · Serving clients in various U.S.
                    states
                  </p>
                  <p className="mt-1 text-xs text-text-600">
                    NICBEN Asset Holdings &amp; Investments LLC is a privately
                    owned company registered in Texas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            {/* R2a-2: this frame held the last remote image host in the codebase —
                the same AI-generated-imagery class R1-5 removed everywhere
                else. docs/04-design-system.md section 8 forbids stock
                photography and AI-generated people, and no real work
                photograph exists yet, so the frame keeps its composition
                (h-96, overlay gradient, floating metadata bar) and is filled with
                the token-only ShapePanel. Decorative, so it carries no alt text. */}
            <div className="relative">
              <ShapePanel
                className="w-full h-96 shadow-card"
                motif="drafting"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/80 to-transparent rounded-b-xl pointer-events-none"
                aria-hidden="true"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-md bg-surface/95 backdrop-blur-md border border-line shadow-float p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    {/* R-L: `Project-based work` → deck:44 (`Project-based`), and
                        the truncated deck:127 clause that stood beneath it is
                        replaced with deck:152 verbatim. Deck copy is rendered
                        exactly, never trimmed. */}
                    <span className="block text-xs font-bold text-ink-950 uppercase tracking-wider">
                      Project-based
                    </span>
                    <span className="block text-xs text-text-600">
                      Work takes place at the client&apos;s location.
                    </span>
                  </div>
                </div>
                <span
                  className="w-8 h-8 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="hidden sm:flex absolute -top-4 -right-4 rounded-md bg-ink-950 text-surface px-4 py-2.5 shadow-float items-center gap-2">
              <span className="text-accent-300" aria-hidden="true">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75"
                  />
                </svg>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider">
                Registered in Texas
              </span>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 3. REGISTERED DETAILS CARD */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="rounded-lg bg-surface border border-line shadow-card overflow-hidden">
          <div className="bg-tint-100 border-b border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full bg-surface text-brand-700 flex items-center justify-center shrink-0 shadow-card"
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
              <div>
                <h2 className="text-h3 font-bold text-ink-950">
                  Registered details
                </h2>
                {/* R-L: the mock's sub-heading
                    (`.../about/code.html:130`, "Verified State Registration &
                    Commercial Filing Record") had no deck line, and the
                    descriptor that replaced it was not deck-verbatim either.
                    `docs/03-copy-deck.md:128` supplies this card's labels only,
                    so the descriptor is deleted rather than reworded. */}
              </div>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface border border-line text-xs font-semibold text-text-600">
              <span
                className="w-2 h-2 rounded-full bg-brand-500"
                aria-hidden="true"
              />
              Registered in Texas
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
            <div className="bg-surface p-6 flex flex-col justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-600">
                  Legal name
                </dt>
                <dd className="mt-1 text-base font-bold text-ink-950">
                  NICBEN Asset Holdings &amp; Investments LLC
                </dd>
              </div>
            </div>
            <div className="bg-surface p-6 flex flex-col justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-600">
                  Structure
                </dt>
                <dd className="mt-1 text-base font-bold text-ink-950">
                  Limited liability company
                </dd>
              </div>
              <span className="text-xs text-text-600">Privately owned</span>
            </div>
            <div className="bg-surface p-6 flex flex-col justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-600">
                  State of registration
                </dt>
                <dd className="mt-1 text-base font-bold text-ink-950">
                  Texas, United States
                </dd>
              </div>
              <span className="text-xs text-text-600">Registered in Texas</span>
            </div>
            <div className="bg-surface p-6 flex flex-col justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-600">
                  Address
                </dt>
                <dd className="mt-1 text-base font-bold text-ink-950">
                  494 Sonora Ave, Raymondville, TX 78580
                </dd>
              </div>
            </div>
          </dl>

          <div className="px-6 py-4 bg-tint-50 border-t border-line flex items-center gap-2 text-xs text-text-600">
            <span className="text-brand-700" aria-hidden="true">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
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
              </svg>
            </span>
            <span>
              NICBEN Asset Holdings &amp; Investments LLC is a privately owned
              company registered in Texas.
            </span>
          </div>
        </div>
      </SectionWrapper>

      {/* 4. COMPLIANCE + LEADERSHIP */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 relative overflow-hidden rounded-lg bg-surface border border-line shadow-card p-6 sm:p-8 flex flex-col justify-between">
            <div
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-ink-950 via-brand-700 to-accent-400"
              aria-hidden="true"
            />
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="w-12 h-12 rounded-md bg-tint-100 text-brand-700 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
                    />
                  </svg>
                </span>
                <h2 className="text-h3 font-bold text-ink-950 tracking-tight">
                  Compliance
                </h2>
              </div>

              <p className="text-base text-text-600 leading-relaxed">
                We are committed to complying with applicable federal and state
                regulations, including anti-money laundering and know-your-customer
                requirements, and we cooperate fully with financial institutions
                during compliance reviews.
              </p>

              {/* Four chips that fragmented the deck:130 sentence above into
                  standalone labels (`Anti-money laundering`,
                  `Know-your-customer requirements`,
                  `Applicable federal and state regulations`,
                  `Cooperation with financial institutions`) are deleted. Each
                  presented one clause of a single sentence as a discrete posture,
                  which reads as an asserted credential (08-qa-checklist.md). The
                  sentence itself is rendered verbatim above. */}
            </div>

            <div className="mt-8 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-ink-950">
                Registered in Texas
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative overflow-hidden rounded-lg bg-surface border border-line shadow-card p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-600">
                Authorized representative
              </span>
              <h2 className="text-h3 font-bold text-ink-950 tracking-tight mt-2">
                Leadership
              </h2>
              <p className="mt-4 inline-block rounded-sm bg-tint-100 px-3 py-2 text-sm font-semibold text-ink-950">
                Sole member and authorized representative.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-line flex items-center gap-3">
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
              </span>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                  Legal name
                </span>
                <span className="block text-sm font-semibold text-ink-950">
                  NICBEN Asset Holdings &amp; Investments LLC
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 5. THREE AREAS OF WORK (equal weight — D-001) */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <EyebrowChip dotColor="sky">What we do</EyebrowChip>
          <h2 className="text-h2 font-bold text-ink-950 mt-4 tracking-tight">
            Three areas of work, one company
          </h2>
          <p className="text-text-600 mt-3 text-base">
            NICBEN works in three areas. Each is run as part of one privately
            owned Texas company.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {pillars.map((pillar) => {
            const isDark = pillar.variant === "ink";
            const titleClass = isDark ? "text-surface" : "text-ink-950";
            const bodyClass = isDark
              ? "text-text-on-dark/80"
              : "text-text-600";
            const dividerClass = isDark ? "border-surface/20" : "border-line/60";
            const iconTileClass = isDark
              ? "bg-surface/10 text-accent-300"
              : pillar.variant === "tint"
              ? "bg-surface text-brand-700"
              : "bg-tint-100 text-brand-700";
            const linkClass = isDark
              ? "text-accent-300 hover:text-surface"
              : "text-brand-700 hover:text-ink-950";

            return (
              <Card
                key={pillar.num}
                variant={pillar.variant}
                notched
                notchedCorner="top-right"
                className="flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${iconTileClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        focusable="false"
                      >
                        {pillar.icon}
                      </svg>
                    </span>
                    <CornerArrowButton
                      href={pillar.href}
                      ariaLabel={`Learn more about ${pillar.title}`}
                      size="sm"
                    />
                  </div>

                  {/* R-L: the card eyebrow rendered `Pillar 01/02/03`, taken from
                      the mock (`docs/design/.../about/code.html:284`,
                      `:307`, `:330` — "01 / Operational" etc.). No deck line
                      supplies a card eyebrow, so the element is deleted. */}

                  <div>
                    <h3
                      className={`text-h3 font-bold leading-snug ${titleClass}`}
                    >
                      {pillar.title}
                    </h3>
                    <p className={`text-sm mt-3 leading-relaxed ${bodyClass}`}>
                      {pillar.body}
                    </p>
                  </div>
                </div>

                <div
                  className={`pt-6 mt-4 border-t flex items-center justify-between ${dividerClass}`}
                >
                  <Link
                    href={pillar.href}
                    className={`text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${linkClass}`}
                  >
                    Learn more
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </SectionWrapper>

      {/* 6. REGISTERED OFFICE BANNER */}
      <SectionWrapper background="surface" className="border-t border-line">
        <div className="rounded-lg bg-surface border border-line shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span
              className="w-14 h-14 rounded-md bg-tint-100 text-brand-700 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                />
              </svg>
            </span>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                Address
              </span>
              <p className="font-heading text-lg font-bold text-ink-950">
                494 Sonora Ave, Raymondville, TX 78580
              </p>
              <p className="text-sm text-text-600">
                Work takes place at the client&apos;s location.
              </p>
            </div>
          </div>

          <Button variant="secondary" href="/service-areas">
            Where we work
          </Button>
        </div>
      </SectionWrapper>

      {/* 7. CTA BAND */}
      <CtaBand />
    </main>
  );
}
