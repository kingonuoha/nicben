/**
 * The contact form's shared vocabulary — **every string here is verbatim
 * `docs/03-copy-deck.md` §11** ("Contact (`/contact`)", lines 182–196) or a
 * structural constant. Nothing in this file is authored.
 *
 * `decisions.md` **D-008**: "Every visible string must trace to
 * `docs/03-copy-deck.md`". `decisions.md` **D-018** records three remediation
 * cycles lost to uncited strings, so each entry below carries the deck line it
 * came from.
 *
 * This module exists separately from `lib/validation/enquiry.ts` so that a
 * client component can import the options and the approved messages **without
 * pulling Zod into the browser bundle** (`06` §46 sets an INP budget; a select
 * element does not need a schema engine). `lib/validation/enquiry.ts` re-exports
 * everything here, so `import { ... } from "@/lib/validation/enquiry"` also
 * works and is the documented entry point for the web pass.
 *
 * `06` §62: "Pillar 3 content must never be rendered by any form, widget or
 * script that could be read as collecting investments." There are exactly three
 * enquiry-type options and **none of them is an investment option** — the third
 * is the general business enquiry that `decisions.md` D-002 routes Pillar 3 to.
 */

import { ENQUIRY_TYPE_VALUES, type EnquiryType } from "@/lib/data/types";

/* -------------------------------------------------------------------------- */
/* Enquiry types                                                               */
/* -------------------------------------------------------------------------- */

export interface EnquiryTypeOption {
  /** Stored value — `06` §19's `enquiryType` union. Never shown to a user. */
  value: EnquiryType;
  /** Visible label — `03-copy-deck.md:188`, verbatim. */
  label: string;
}

/**
 * The three options, in deck order. The `satisfies` clause is a compile-time
 * guard: if `ENQUIRY_TYPE_VALUES` ever gains or loses a member, this array must
 * change with it or the build fails.
 */
export const ENQUIRY_TYPE_OPTIONS = [
  {
    value: "project-management-contracting",
    label: "Project management and contracting",
  },
  {
    value: "property-improvement-maintenance",
    label: "Property improvement and maintenance",
  },
  {
    value: "general-business",
    label: "General or business enquiry",
  },
] as const satisfies readonly EnquiryTypeOption[];

/** Every option value the schema accepts. Derived, so it cannot diverge. */
export const ENQUIRY_TYPE_OPTION_VALUES = ENQUIRY_TYPE_OPTIONS.map(
  (option) => option.value,
) as readonly EnquiryType[];

/**
 * Compile-time exhaustiveness guard. `UnmappedEnquiryTypes` resolves to `never`
 * only while every member of the type union has an option above; the `const`
 * below then type-checks. If one is missing its type is not `never` and
 * assigning `true` to it fails the build.
 */
export type UnmappedEnquiryTypes = Exclude<
  EnquiryType,
  (typeof ENQUIRY_TYPE_OPTIONS)[number]["value"]
>;
export const ENQUIRY_TYPE_OPTIONS_ARE_EXHAUSTIVE: UnmappedEnquiryTypes extends never
  ? true
  : never = true;

/**
 * Deep-link aliases. `docs/01-sitemap-wireframes.md` §4 requires the pillar CTAs
 * to preselect the enquiry type, and the pillar pages already link
 * `/contact?enquiry=<slug>` (e.g. `app/what-we-do/treasury-investments/page.tsx:68`
 * uses `general-or-business-enquiry`, the label rather than the stored value).
 * This map lets the form resolve either spelling to one stored value without a
 * second source of truth.
 */
export const ENQUIRY_TYPE_QUERY_ALIASES: Readonly<Record<string, EnquiryType>> = {
  "project-management-contracting": "project-management-contracting",
  "project-management-and-contracting": "project-management-contracting",
  "property-improvement-maintenance": "property-improvement-maintenance",
  "property-improvement-and-maintenance": "property-improvement-maintenance",
  "general-business": "general-business",
  "general-or-business-enquiry": "general-business",
  "general-enquiry": "general-business",
};

/** Resolve a `?enquiry=` value to a stored type. Unknown values yield `null`. */
export function resolveEnquiryTypeQuery(value: string | null | undefined): EnquiryType | null {
  if (!value) return null;
  return ENQUIRY_TYPE_QUERY_ALIASES[value.trim().toLowerCase()] ?? null;
}

/** The visible label for a stored type, for the admin view and email. */
export function enquiryTypeLabel(value: EnquiryType): string {
  return ENQUIRY_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/* -------------------------------------------------------------------------- */
/* Error messages — 03-copy-deck.md:195, all six, verbatim                     */
/* -------------------------------------------------------------------------- */

export const ENQUIRY_ERROR_MESSAGES = {
  /** `03-copy-deck.md:195` — "Please enter your name." */
  name: "Please enter your name.",
  /** `03-copy-deck.md:195` — "Please enter a valid email address." */
  email: "Please enter a valid email address.",
  /** `03-copy-deck.md:195` — "Please choose what your enquiry is about." */
  enquiryType: "Please choose what your enquiry is about.",
  /** `03-copy-deck.md:195` — "Please tell us a little more (at least 20 characters)." */
  message: "Please tell us a little more (at least 20 characters).",
  /** `03-copy-deck.md:195` — "That file is too large or not a supported type." */
  attachment: "That file is too large or not a supported type.",
  /** `03-copy-deck.md:195` — "Something went wrong. Please try again or email us directly." */
  generic: "Something went wrong. Please try again or email us directly.",
} as const;

export type EnquiryErrorKey = keyof typeof ENQUIRY_ERROR_MESSAGES;

/** All six, in deck order, for an audit that wants to compare them one by one. */
export const ENQUIRY_ERROR_MESSAGES_IN_DECK_ORDER: readonly string[] = [
  ENQUIRY_ERROR_MESSAGES.name,
  ENQUIRY_ERROR_MESSAGES.email,
  ENQUIRY_ERROR_MESSAGES.enquiryType,
  ENQUIRY_ERROR_MESSAGES.message,
  ENQUIRY_ERROR_MESSAGES.attachment,
  ENQUIRY_ERROR_MESSAGES.generic,
];

/* -------------------------------------------------------------------------- */
/* Fields                                                                      */
/* -------------------------------------------------------------------------- */

/** Field names used on the wire, in `aria-describedby` ids and in error payloads. */
export const ENQUIRY_FIELDS = [
  "name",
  "email",
  "phone",
  "enquiryType",
  "location",
  "message",
  "attachments",
  "consent",
] as const;

export type EnquiryField = (typeof ENQUIRY_FIELDS)[number];

/**
 * Which approved message a field's failure uses.
 *
 * Two entries are deliberate consequences of the deck supplying only six
 * messages:
 * - `consent` has **no approved error string**. The deck gives the consent
 *   *label* (`:192`) but no failure message, so the generic message is used
 *   rather than authoring new copy. Reported in the completion notes.
 * - Fields that cannot fail (phone, location) are absent, because
 *   `lib/enquiry/sanitise.ts` normalises rather than rejects them.
 */
export const ENQUIRY_FIELD_ERROR_KEYS = {
  name: "name",
  email: "email",
  enquiryType: "enquiryType",
  message: "message",
  attachments: "attachment",
  consent: "generic",
} as const satisfies Partial<Record<EnquiryField, EnquiryErrorKey>>;

export function enquiryFieldMessage(field: EnquiryField): string {
  const key = (ENQUIRY_FIELD_ERROR_KEYS as Partial<Record<EnquiryField, EnquiryErrorKey>>)[field];
  return ENQUIRY_ERROR_MESSAGES[key ?? "generic"];
}

/* -------------------------------------------------------------------------- */
/* Form copy — 03-copy-deck.md §11, verbatim                                   */
/* -------------------------------------------------------------------------- */

/**
 * Visible labels for the form controls. Each is deck §11 verbatim with the
 * deck's own `(required)` / `(optional)` marker stripped, because the marker is
 * published as the `required` attribute and the optional hint, not as part of
 * the label text.
 */
export const CONTACT_FORM_LABELS = {
  /** `03-copy-deck.md:185` */
  name: "Full name",
  /** `03-copy-deck.md:186` */
  email: "Email address",
  /** `03-copy-deck.md:187` */
  phone: "Phone number",
  /** `03-copy-deck.md:188` */
  enquiryType: "What is your enquiry about?",
  /** `03-copy-deck.md:189` */
  location: "Project location, city and state",
  /** `03-copy-deck.md:190` */
  message: "Message",
  /** `03-copy-deck.md:191` */
  attachments: "Attach photos or documents",
  /** `03-copy-deck.md:192` */
  consent: "I agree to NICBEN using my details to respond to this enquiry.",
} as const;

export const CONTACT_FORM_COPY = {
  /** `03-copy-deck.md:191` — the file-input hint. */
  attachmentHint: "JPG, PNG, PDF",
  /** `03-copy-deck.md:193` */
  submitLabel: "Send enquiry",
  /** `03-copy-deck.md:194` */
  successMessage: "Thank you. We have received your enquiry and will be in touch soon.",
} as const;

/** Visible label for an enquiry-type option, keyed by stored value. */
export const ENQUIRY_TYPE_LABEL_BY_VALUE: Readonly<Record<EnquiryType, string>> =
  Object.fromEntries(ENQUIRY_TYPE_OPTIONS.map((option) => [option.value, option.label])) as Record<
    EnquiryType,
    string
  >;

/* -------------------------------------------------------------------------- */
/* Anti-spam field name                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Honeypot field name. Both sides of the contract must agree on it, so it is
 * exported here rather than duplicated as a literal.
 *
 * `06` §13 and `decisions.md` D-022: the honeypot is **always active**,
 * independent of Turnstile. A submission that fills it is discarded silently —
 * the response is indistinguishable from a success so an automated client gets
 * no signal to adapt. The field must be hidden from users without being hidden
 * from the parser: visually hidden, `aria-hidden="true"`, `tabIndex={-1}` and
 * `autoComplete="off"` (the web pass renders it).
 */
export const ENQUIRY_HONEYPOT_FIELD = "companyWebsite";
