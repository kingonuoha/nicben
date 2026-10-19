import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CtaBand } from "@/components/ui/CtaBand";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { OfficeMap } from "@/components/ui/OfficeMap";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/motion/SectionHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Where We Work | NICBEN",
  description:
    "Registered in Texas, serving clients in various U.S. states based on project requests.",
};

const heroFacts = [
  { label: "Registered in Texas", icon: "verified" },
  { label: "Work takes place at your location", icon: "pin" },
] as const;

const operatingCards: {
  num: string;
  title?: string;
  body: string;
  footer?: string;
  variant: "surface" | "tint" | "ink";
}[] = [
  {
    num: "01",
    title: "Registered in Texas",
    body: "NICBEN Asset Holdings & Investments LLC is a privately owned limited liability company registered in Texas.",
    variant: "surface" as const,
  },
  {
    num: "02",
    body: "NICBEN is a limited liability company that works on a project basis. We serve clients in various U.S. states, depending on what each project requires.",
    footer: "Project-based",
    variant: "tint" as const,
  },
  {
    num: "03",
    title: "Company-owned funds",
    body: "In addition to its project work, NICBEN manages its own corporate treasury and evaluates investment opportunities using company-owned funds.",
    variant: "ink" as const,
  },
];

export default function ServiceAreasPage() {
  return (
    <main className="min-h-screen">
      {/* 1. HERO */}
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
              Service Areas
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-8">
            <Reveal from="bottom" speed="base">
              <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
                Where we work
              </h1>
            </Reveal>

            <Reveal from="bottom" speed="base" delay={120}>
              <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal max-w-2xl">
                NICBEN is registered in Texas and serves clients in various U.S.
                states, based on project requests. Work takes place at the
                client&apos;s location.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-4">
            <Stagger className="flex flex-col gap-2" step={80} threshold={0.2} margin="0px 0px -12% 0px">
              {heroFacts.map((fact) => (
                <StaggerItem key={fact.label}>
                  <div className="group card-lift flex items-center gap-2 rounded-md bg-surface border border-line hover:border-brand-500 shadow-card p-3 transition-all duration-200">
                    <span
                      className="w-7 h-7 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100"
                      aria-hidden="true"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        {fact.icon === "verified" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                          />
                        )}
                        {fact.icon === "pin" && (
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
                        )}
                      </svg>
                    </span>
                    <span className="text-xs font-semibold text-ink-950">
                      {fact.label}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. GEOGRAPHIC VISUAL — Interactive Living Map Stage */}
      <SectionWrapper background="tint-50" className="pt-0 pb-16 lg:pb-24">
        <Reveal from="bottom" speed="medium" threshold={0.2} margin="0px 0px -12% 0px">
          <div className="relative overflow-hidden rounded-lg bg-ink-950 text-surface shadow-float">
            <div
              className="absolute inset-0 opacity-10 texture-dots-on-dark pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface/20">
                <span className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-accent-400 motion-reduce:animate-none animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-on-dark">
                    Registered in Texas
                  </span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-300">
                  Serving clients in various U.S. states
                </span>
              </div>

              <div className="relative rounded-md bg-surface/5 border border-surface/20 px-4 py-8 sm:py-10">
                <svg
                  className="w-full max-w-3xl mx-auto h-auto select-none"
                  fill="none"
                  viewBox="0 0 900 450"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  focusable="false"
                >
                  {/* Latitude and longitude guidelines */}
                  <path
                    className="text-text-on-dark"
                    d="M 0 120 L 900 120 M 0 240 L 900 240 M 0 360 L 900 360 M 180 0 L 180 450 M 360 0 L 360 450 M 540 0 L 540 450 M 720 0 L 720 450"
                    opacity="0.2"
                    stroke="currentColor"
                    strokeDasharray="3 6"
                    strokeWidth="0.5"
                  />

                  {/* Abstract landmass boundary hint */}
                  <path
                    className="text-text-on-dark"
                    d="M140 130 L280 120 L380 90 L610 80 L760 110 L810 170 L780 250 L750 350 L640 370 L510 395 L450 410 L410 370 L340 370 L230 330 L130 250 Z"
                    fill="none"
                    opacity="0.25"
                    stroke="currentColor"
                    strokeDasharray="2 4"
                    strokeWidth="1"
                  />

                  {/* Connecting dashed arcs outward stream */}
                  <path
                    className="text-accent-300 animate-arc-flow"
                    d="M 450 360 Q 320 350 220 280"
                    stroke="currentColor"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeWidth="2"
                  />
                  <path
                    className="text-accent-300 animate-arc-flow"
                    d="M 450 360 Q 440 230 490 140"
                    stroke="currentColor"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeWidth="2"
                  />
                  <path
                    className="text-accent-300 animate-arc-flow"
                    d="M 450 360 Q 600 380 710 300"
                    stroke="currentColor"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeWidth="2"
                  />
                  <path
                    className="text-accent-300 animate-arc-flow"
                    d="M 450 360 Q 620 230 730 170"
                    stroke="currentColor"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                    strokeWidth="2"
                  />

                  {/* Destination node dots with hover scale */}
                  <g className="cursor-pointer">
                    <circle cx="220" cy="280" r="10" fill="currentColor" className="text-accent-400 opacity-20 hover:opacity-40 transition-opacity" />
                    <circle cx="220" cy="280" r="4.5" fill="currentColor" className="text-accent-300 hover:scale-125 transition-transform" />

                    <circle cx="490" cy="140" r="10" fill="currentColor" className="text-accent-400 opacity-20 hover:opacity-40 transition-opacity" />
                    <circle cx="490" cy="140" r="4.5" fill="currentColor" className="text-accent-300 hover:scale-125 transition-transform" />

                    <circle cx="710" cy="300" r="10" fill="currentColor" className="text-accent-400 opacity-20 hover:opacity-40 transition-opacity" />
                    <circle cx="710" cy="300" r="4.5" fill="currentColor" className="text-accent-300 hover:scale-125 transition-transform" />

                    <circle cx="730" cy="170" r="10" fill="currentColor" className="text-accent-400 opacity-20 hover:opacity-40 transition-opacity" />
                    <circle cx="730" cy="170" r="4.5" fill="currentColor" className="text-accent-300 hover:scale-125 transition-transform" />
                  </g>

                  {/* Texas central hub breathing pulse */}
                  <g className="animate-hub-pulse" style={{ transformOrigin: "450px 360px" }}>
                    <circle
                      className="text-accent-400"
                      cx="450"
                      cy="360"
                      fill="currentColor"
                      fillOpacity="0.2"
                      r="22"
                    />
                    <circle
                      className="text-accent-400"
                      cx="450"
                      cy="360"
                      fill="none"
                      opacity="0.8"
                      r="32"
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />
                  </g>
                  <circle
                    className="text-surface"
                    cx="450"
                    cy="360"
                    fill="currentColor"
                    r="7"
                    strokeWidth="3"
                  />
                </svg>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-pill bg-ink-950/90 backdrop-blur-md border border-surface/20 px-4 py-2 shadow-float flex items-center gap-2 w-max max-w-full">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-accent-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs text-surface">
                    Work takes place at the client&apos;s location.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md bg-surface/5 border border-surface/20 p-6 flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent-300">
                    Address
                  </span>
                  <p className="font-heading text-lg font-bold text-surface">
                    494 Sonora Ave, Raymondville, TX 78580
                  </p>
                  <p className="text-sm text-text-on-dark/80">
                    NICBEN Asset Holdings &amp; Investments LLC is a privately owned
                    company registered in Texas.
                  </p>
                  <div className="mt-2">
                    <OfficeMap variant="dark" height={200} />
                  </div>
                </div>

                <div className="rounded-md bg-surface/5 border border-surface/20 p-6 flex flex-col gap-2">
                  <p className="font-heading text-lg font-bold text-surface">
                    Work takes place at the client&apos;s location.
                  </p>
                  <p className="text-sm text-text-on-dark/80">
                    We engage qualified contractors and technicians to perform the
                    work at the client&apos;s location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionWrapper>

      {/* 3. TWO OPERATING CARDS */}
      <SectionWrapper background="surface" className="border-t border-line">
        <SectionHeading
          className="max-w-3xl mb-12"
          eyebrow={<EyebrowChip dotColor="teal">How we operate</EyebrowChip>}
          heading={
            <h2 className="text-h2 font-bold text-ink-950 mt-4 tracking-tight">
              Based in Texas. Working where the project is.
            </h2>
          }
        />

        <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch" step={120} threshold={0.2} margin="0px 0px -12% 0px">
          <StaggerItem className="flex">
            <div className="group card-lift w-full rounded-lg bg-surface border border-line hover:border-brand-500 shadow-card p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-md bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100"
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
                          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75"
                        />
                      </svg>
                    </span>
                    <h3 className="text-h3 font-bold text-ink-950 tracking-tight">
                      Registered details
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-pill bg-tint-100 text-brand-700 text-xs font-semibold shrink-0">
                    Texas
                  </span>
                </div>

                <div className="mt-6 rounded-sm bg-tint-50 border border-line p-4 flex items-start gap-3">
                  <span
                    className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                      494 Sonora Ave, Raymondville, TX 78580
                    </span>
                    <span className="block text-sm text-text-600 mt-1">
                      NICBEN is a limited liability company that works on a project
                      basis. We serve clients in various U.S. states, depending on
                      what each project requires.
                    </span>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5">
                  <li className="flex items-center gap-2.5 text-sm text-text-600">
                    <span
                      className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0"
                      aria-hidden="true"
                    />
                    Limited liability company
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-text-600">
                    <span
                      className="w-1.5 h-1.5 rotate-45 bg-brand-500 shrink-0"
                      aria-hidden="true"
                    />
                    Registered in Texas
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-text-600">
                  <span
                    className="w-2 h-2 rounded-full bg-brand-500"
                    aria-hidden="true"
                  />
                  Privately owned
                </span>
                <span className="text-xs font-semibold text-brand-700">
                  Project-based
                </span>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem className="flex">
            <div className="group card-lift w-full rounded-lg bg-surface border border-line hover:border-brand-500 shadow-card p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-md bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100"
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
                          d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </span>
                    <h3 className="text-h3 font-bold text-ink-950 tracking-tight">
                      Work takes place at the client&apos;s location
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-pill bg-tint-100 text-brand-700 text-xs font-semibold shrink-0">
                    Project-based
                  </span>
                </div>

                <p className="mt-6 text-sm text-text-600 leading-relaxed">
                  We work on a project basis. For construction-related projects, we
                  engage qualified contractors and technicians to perform the work at
                  the client&apos;s location, which means we do not need to own or
                  lease property where a project takes place.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-sm bg-tint-50 border border-line p-4">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Qualified contractors and technicians
                    </span>
                  </div>
                  <div className="rounded-sm bg-tint-50 border border-line p-4">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Residential and commercial
                    </span>
                    <span className="block text-sm text-text-600 mt-1">
                      Improvement, renovation, plumbing and maintenance.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-text-600">
                  <span
                    className="w-2 h-2 rounded-full bg-brand-500"
                    aria-hidden="true"
                  />
                  Serving clients in various U.S. states
                </span>
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-brand-700 hover:text-ink-950 transition-colors inline-flex items-center gap-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  Ask us
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </StaggerItem>
        </Stagger>
      </SectionWrapper>

      {/* 4. THREE OPERATING CARDS — equal dimensions, rotating treatment (D-001) */}
      <SectionWrapper background="tint-50" className="border-t border-line">
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch" step={150} threshold={0.2} margin="0px 0px -12% 0px">
          {operatingCards.map((item) => {
            const isDark = item.variant === "ink";
            const titleClass = isDark ? "text-surface" : "text-ink-950";
            const bodyClass = isDark ? "text-text-on-dark/80" : "text-text-600";
            const dividerClass = isDark ? "border-surface/20" : "border-line";
            const numClass = isDark ? "text-accent-300/60" : "text-brand-500/60";
            const footerClass = isDark ? "text-accent-300" : "text-brand-700";

            return (
              <StaggerItem key={item.num} className="flex">
                <Card
                  variant={item.variant}
                  className="flex flex-col justify-between w-full hover:border-brand-500 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-heading font-extrabold text-2xl ${numClass}`}
                        aria-hidden="true"
                      >
                        {item.num}
                      </span>
                    </div>
                    {item.title && (
                      <h3 className={`text-h3 font-bold leading-snug ${titleClass}`}>
                        {item.title}
                      </h3>
                    )}
                    <p className={`text-sm leading-relaxed mt-1 ${bodyClass}`}>
                      {item.body}
                    </p>
                  </div>

                  {item.footer && (
                    <div
                      className={`mt-8 pt-4 border-t flex items-center justify-between ${dividerClass}`}
                    >
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${footerClass}`}
                      >
                        {item.footer}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDark ? "bg-accent-300" : "bg-brand-500"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </SectionWrapper>

      {/* 5. ASK US CALLOUT */}
      <SectionWrapper background="surface" className="border-t border-line">
        <Reveal from="bottom" speed="base" threshold={0.2} margin="0px 0px -12% 0px">
          <div className="group card-lift rounded-lg bg-tint-100 border border-line hover:border-brand-500 shadow-card p-6 sm:p-10 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <EyebrowChip dotColor="teal">Ask us</EyebrowChip>
                <h2 className="text-h2 font-bold text-ink-950 tracking-tight mt-4">
                  Not sure we cover your area? Ask us.
                </h2>
                <p className="mt-3 text-base text-text-600 leading-relaxed max-w-2xl">
                  Tell us about the project through the contact form, by email or by
                  phone.
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-3">
                <Button variant="primary" withArrow href="/contact">
                  Get in Touch
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionWrapper>

      {/* 6. CTA BAND */}
      <CtaBand />
    </main>
  );
}
