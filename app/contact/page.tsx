import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Reveal } from "@/components/motion/Reveal";
import { OfficeMap } from "@/components/ui/OfficeMap";
import {
  getTurnstileSiteKey,
  isAttachmentStorageConfigured,
  isTurnstileWidgetEnabled,
} from "@/lib/enquiry/config";
import { resolveEnquiryTypeQuery } from "@/lib/validation/enquiry-options";

import { ContactForm } from "./ContactForm";

/**
 * `/contact` — the enquiry page.
 */
export const metadata: Metadata = {
  title: "Contact NICBEN",
  description: "Send an enquiry or contact NICBEN by email or phone.",
  openGraph: {
    title: "Contact NICBEN",
    description: "Send an enquiry or contact NICBEN by email or phone.",
    url: "https://nicben.com/contact",
    images: [
      {
        url: "/images/brand/nicben-meta-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Contact NICBEN Asset Holdings & Investments LLC",
      },
    ],
  },
};

interface ContactPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  const enquiryParam = params.enquiry;
  const defaultEnquiryType = resolveEnquiryTypeQuery(
    Array.isArray(enquiryParam) ? enquiryParam[0] : enquiryParam,
  );

  const attachmentUploadEnabled = isAttachmentStorageConfigured();
  const turnstileSiteKey = isTurnstileWidgetEnabled() ? getTurnstileSiteKey() : null;

  return (
    <main className="min-h-screen">
      {/* 1. HERO */}
      <SectionWrapper
        background="tint-50"
        className="pt-8 sm:pt-12 pb-12 lg:pb-16"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <nav aria-label="Breadcrumb">
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
                Contact
              </li>
            </ol>
          </nav>

          <ul className="flex flex-wrap items-center gap-2">
            <li>
              <EyebrowChip dotColor="teal">Registered in Texas</EyebrowChip>
            </li>
            <li>
              <EyebrowChip dotColor="sky">
                Serving clients across the US
              </EyebrowChip>
            </li>
          </ul>
        </div>

        <div className="max-w-2xl">
          <Reveal from="bottom" speed="base">
            <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
              Get in touch
            </h1>
          </Reveal>

          <Reveal from="bottom" speed="base" delay={120}>
            <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
              Tell us what you need. We will reply by email or phone.
            </p>
          </Reveal>
        </div>
      </SectionWrapper>

      {/* 2. CONTACT DETAILS + ENQUIRY FORM */}
      <SectionWrapper background="tint-50" className="pt-0 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <Reveal from="left" speed="medium" threshold={0.2} margin="0px 0px -12% 0px">
              <Card variant="surface" className="group card-lift flex flex-col hover:border-brand-500 transition-colors duration-200">
                <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-line">
                  <h2 className="text-h3 font-bold text-ink-950 tracking-tight">
                    Contact
                  </h2>
                  <span
                    className="w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100"
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
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </span>
                </div>

                <p className="text-sm text-text-600 leading-relaxed">
                  Send an enquiry through the form, or reach us directly.
                </p>

                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-3">
                    <span
                      className="w-8 h-8 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5"
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
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </span>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                        Email
                      </span>
                      <a
                        href="mailto:bennie104@gmail.com"
                        className="text-base font-bold text-ink-950 hover:text-brand-700 transition-colors rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                      >
                        bennie104@gmail.com
                      </a>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span
                      className="w-8 h-8 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5"
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
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
                    </span>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                        Phone
                      </span>
                      <a
                        href="tel:+17193456285"
                        className="text-base font-bold text-ink-950 hover:text-brand-700 transition-colors rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                      >
                        +1 719 345-6285
                      </a>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span
                      className="w-8 h-8 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5"
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
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                    </span>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                        Address
                      </span>
                      <p className="text-sm font-semibold text-ink-950">
                        494 Sonora Ave, Raymondville, TX 78580
                      </p>
                      <p className="text-xs text-text-600 mt-1">
                        Work takes place at the client&apos;s location.
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>
            </Reveal>

            <Reveal from="left" speed="medium" delay={120} threshold={0.2} margin="0px 0px -12% 0px">
              <OfficeMap height={280} />
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal from="bottom" speed="medium" delay={140} threshold={0.2} margin="0px 0px -12% 0px">
              <ContactForm
                attachmentUploadEnabled={attachmentUploadEnabled}
                turnstileSiteKey={turnstileSiteKey}
                defaultEnquiryType={defaultEnquiryType}
              />
            </Reveal>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
