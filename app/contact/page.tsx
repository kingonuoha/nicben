import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import {
  getTurnstileSiteKey,
  isAttachmentStorageConfigured,
  isTurnstileWidgetEnabled,
} from "@/lib/enquiry/config";
import { resolveEnquiryTypeQuery } from "@/lib/validation/enquiry-options";

import { ContactForm } from "./ContactForm";

/**
 * `/contact` — the enquiry page.
 *
 * **Server component on purpose.** Three of the four values the form needs come
 * from server-only modules that must never reach the browser:
 *
 * 1. `isAttachmentStorageConfigured()` — `decisions.md` D-020: with no
 *    `BLOB_READ_WRITE_TOKEN` the attachment field is **not rendered at all**,
 *    because "a 'your file was ignored' path is worse than an absent field".
 * 2. `isTurnstileWidgetEnabled()` / `getTurnstileSiteKey()` — `lib/enquiry/config.ts`
 *    is server-only (it reads secrets); only the public **site** key is handed
 *    down as a prop.
 * 3. `?enquiry=` — resolved here, not in the browser, so the preselected enquiry
 *    type is already correct in the delivered HTML (no hydration shift, and it
 *    still works with JavaScript unavailable). Reading `searchParams` makes this
 *    route render per request, which is the honest description of a page whose
 *    markup depends on the request.
 *
 * Every visible string on this page traces to `docs/03-copy-deck.md` §11
 * (`:182`–`:196`) or §14 (`:228`); the line is cited at each site. `decisions.md`
 * D-008 — mocks are structure references only, never copy sources — governs the
 * design screen this page reproduces
 * (`docs/design/nicben_asset_holdings_investments_contact_quote_request/`).
 */
export const metadata: Metadata = {
  /** `docs/03-copy-deck.md:228`, verbatim (the table's Title tag cell). */
  title: "Contact NICBEN",
  /** `docs/03-copy-deck.md:228`, verbatim (the table's Meta description cell). */
  description: "Send an enquiry or contact NICBEN by email or phone.",
};

interface ContactPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  /**
   * `docs/01-sitemap-wireframes.md:74`/`:105`/`:118` require the pillar CTAs to
   * preselect the enquiry type. The three pillar pages link
   * `/contact?enquiry=project-management-contracting`,
   * `…=property-improvement-maintenance` and
   * `…=general-or-business-enquiry`; `resolveEnquiryTypeQuery` maps each spelling
   * (and the stored value itself) to one stored value, so an unknown or absent
   * parameter simply leaves the group unselected.
   */
  const enquiryParam = params.enquiry;
  const defaultEnquiryType = resolveEnquiryTypeQuery(
    Array.isArray(enquiryParam) ? enquiryParam[0] : enquiryParam,
  );

  /* D-020 / D-022 — the two integration switches, read on the server. */
  const attachmentUploadEnabled = isAttachmentStorageConfigured();
  const turnstileSiteKey = isTurnstileWidgetEnabled() ? getTurnstileSiteKey() : null;

  return (
    <main className="min-h-screen">
      {/* 1. HERO
          Structure from the design screen: breadcrumb left with the corporate
          status chips right, then the heading block. Header clearance is global
          (`app/layout.tsx`), so this keeps the standard pt-8 sm:pt-12 rhythm. */}
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

          {/*
            The design screen carries two status chips here (`Texas Registered
            LLC`, `Direct Client-Site Coordination`). Neither has a deck line, so
            both are deleted (D-008) and the documented chip row is preserved
            with the deck's own two approval-cited chip strings: `:27`
            "Registered in Texas" and `:28` "Serving clients across the US"
            (both §2 hero chips, used as facts elsewhere on the site already).
          */}
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
          {/* The design's `Get in touch with NICBEN` eyebrow chip had no deck
              line and is deleted; `03-copy-deck.md:182` already supplies the H1
              directly beneath it. */}
          <h1 className="text-display font-extrabold tracking-tight text-ink-950 leading-tight heading-spark">
            Get in touch
          </h1>

          {/* `docs/03-copy-deck.md:183`, verbatim. Its `[CLIENT TO CONFIRM
              response time]` marker is omitted in full: no approved
              response-time copy exists to publish (`docs/tasks/phase-05-backend-and-contact/brief.md` §5.3). */}
          <p className="mt-6 text-lg sm:text-xl text-text-600 leading-relaxed font-normal">
            Tell us what you need. We will reply by email or phone.
          </p>
        </div>
      </SectionWrapper>

      {/* 2. CONTACT DETAILS + ENQUIRY FORM
          The design's 5/7 two-column grid: directory card left, form right,
          top-aligned. `docs/01-sitemap-wireframes.md:107-111` defines the page
          as intro, form and contact details card (plus an optional map, which
          has no approved content and is therefore absent). */}
      <SectionWrapper background="tint-50" className="pt-0 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-5">
            <Card variant="surface" className="flex flex-col">
              <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-line">
                {/* `Contact` is the deck's own name for this surface — the nav
                    label (`:11`), the footer column (`:14`) and the page title
                    (`:228`). The design's `Official Directory` / `Direct
                    Inquiries & Headquarters` eyebrow and heading have no deck
                    line and are deleted. */}
                <h2 className="text-h3 font-bold text-ink-950 tracking-tight">
                  Contact
                </h2>
                <span
                  className="w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0"
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
              </div>

              {/* `docs/03-copy-deck.md:13` (the footer statement, approved and
                  already reused as a card body on `/service-areas`). */}
              <p className="text-sm text-text-600 leading-relaxed">
                NICBEN Asset Holdings &amp; Investments LLC is a privately owned
                company registered in Texas.
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3 rounded-md bg-tint-50 border border-line p-4">
                  <span
                    className="w-7 h-7 rounded-full bg-surface text-brand-700 border border-line flex items-center justify-center shrink-0"
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
                  <div className="min-w-0">
                    {/* Label from `docs/03-copy-deck.md:128` (`Address`); value
                        from `:196`, verbatim. */}
                    <span className="block text-xs font-semibold uppercase tracking-wider text-text-600">
                      Address
                    </span>
                    <span className="block text-sm font-semibold text-ink-950 mt-1">
                      494 Sonora Ave, Raymondville, TX 78580
                    </span>
                  </div>
                </li>

                {/*
                  Reserved layout slots — `decisions.md` D-012. The deck's contact
                  card (`:196`) lists an email and a phone, both marked
                  `[CLIENT TO CONFIRM]`, so neither is rendered and neither is
                  substituted: no `mailto:`, no `tel:`, no placeholder address.
                  The slots are kept in place (as the Footer already does) so the
                  confirmed values drop in without a redesign.

                  Reserved slot: confirmed public email renders as a row here.
                  Reserved slot: confirmed public phone renders as a row here.
                */}
              </ul>

              {/*
                Omitted from the design screen, each for a cited reason:
                · `Operating Model & Compliance` card — its three bullets and
                  paragraph have no deck line (`:130` supplies compliance
                  wording for `/about`, not for `/contact`).
                · `Expedited Scope Inquiries` dark card — `Expedited`,
                  `Priority queueing` and the 24-business-hour promise are
                  authored marketing copy with no deck line, and a response-time
                  claim is exactly what the brief withholds.
                · `Response Benchmark` row — the `[CLIENT TO CONFIRM response
                  time]` marker at `:183`.
              */}
            </Card>
          </div>

          <div className="lg:col-span-7">
            <ContactForm
              attachmentUploadEnabled={attachmentUploadEnabled}
              turnstileSiteKey={turnstileSiteKey}
              defaultEnquiryType={defaultEnquiryType}
            />
          </div>
        </div>
      </SectionWrapper>

      {/*
        No terminal CTA band on this route: the band's own CTA is
        `Get in Touch → /contact`, which would link the page to itself. The
        design screen has no band here either, and
        `docs/01-sitemap-wireframes.md:107-111` defines `/contact` as intro +
        form + contact details. The shared `CtaBand` is untouched (D-014) and
        still terminates every other route.
      */}
    </main>
  );
}
