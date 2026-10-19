/**
 * Data model.
 *
 * This file is a transcription of `docs/06-tech-and-security-spec.md`
 * "Data model (admin)", sections 19–24, and nothing else. The spec is the single
 * authority for field names and field sets; the six entities below appear in the
 * spec in this order:
 *
 *   19 `Enquiry`      · 20 `Project`   · 21 `PageContent`
 *   22 `Testimonial`  · 23 `Setting`   · 24 `AdminUser`
 *
 * Only `Enquiry` is written in this phase (`docs/07-build-order.md` Step 6). The
 * other five are declared now because Step 5 asks for the model set in one
 * place and Phase 06 (admin) consumes them.
 *
 * All timestamps are ISO-8601 strings, not `Date` objects: the records cross a
 * JSON boundary (the repository port is async and may be backed by MongoDB, a
 * network service) and a string round-trips without timezone ambiguity.
 */

/* -------------------------------------------------------------------------- */
/* Enquiry — 06 §19                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `06` §19: `enquiryType (project-management-contracting |
 * property-improvement-maintenance | general-business)`.
 *
 * Exactly three members. `06` §62 forbids Pillar 3 content being rendered by
 * anything that could read as collecting investments, so there is deliberately
 * **no investment option** — the third value is the general business enquiry
 * that `decisions.md` D-002 routes Pillar 3 to.
 */
export const ENQUIRY_TYPE_VALUES = [
  "project-management-contracting",
  "property-improvement-maintenance",
  "general-business",
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPE_VALUES)[number];

/** `06` §19: `status (new, contacted, quoted, closed)`. */
export const ENQUIRY_STATUS_VALUES = ["new", "contacted", "quoted", "closed"] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUS_VALUES)[number];

/**
 * `06` §34 / §57: "allow JPG, PNG, PDF only … never serve them from a public URL
 * without authorization".
 */
export const ATTACHMENT_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export type AttachmentContentType = (typeof ATTACHMENT_CONTENT_TYPES)[number];

export interface EnquiryAttachment {
  /**
   * Sanitised display name derived from the client's filename. Directory
   * components, control characters and bidi overrides are stripped, and the
   * value is length-capped (`lib/enquiry/sanitise.ts`). It exists so an admin
   * can match a file to what the sender described.
   */
  name: string;
  /**
   * Private storage key (`enquiries/<yyyy>/<mm>/<uuid>.<ext>`), **not** a URL.
   * `06` §57 requires attachments to be unreachable from a public URL, so the
   * object store's own address is never persisted. Phase 06 reads the object
   * back through an authorised admin route.
   */
  storageKey: string;
  /** Decided by magic bytes, never by the client-supplied MIME header. */
  contentType: AttachmentContentType;
  sizeBytes: number;
}

export interface EnquiryNote {
  id: string;
  /** Admin-authored note. Never echoed to a public surface. */
  body: string;
  /** `AdminUser.id` of the author, or `null` for a system-authored note. */
  authorId: string | null;
  createdAt: string;
}

/**
 * Notification state — `decisions.md` **D-021**: "persist first, then send. A
 * send failure sets a notification-error flag on the stored enquiry and is
 * surfaced in the admin view, but the user still sees the success card."
 */
export interface EnquiryNotification {
  /** `false` when `RESEND_API_KEY` was not provisioned at submission time. */
  configured: boolean;
  /** ISO timestamp of the send attempt, or `null` when none was made. */
  attemptedAt: string | null;
  delivered: boolean;
  /**
   * A short non-personal reference such as `"resend:401"`, `"timeout"` or
   * `"not-configured"`. Never a stack trace and never provider response bodies
   * (`06` §43).
   */
  error: string | null;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  enquiryType: EnquiryType;
  location: string | null;
  message: string;
  attachments: EnquiryAttachment[];
  /** ISO timestamp of the privacy consent — `06` §55 "Store the consent timestamp". */
  consentAt: string;
  status: EnquiryStatus;
  notes: EnquiryNote[];
  /**
   * SHA-256 pseudonym of the submitting network address, truncated. The raw
   * address is never stored (`06` §42 — collect only what the form needs); the
   * pseudonym exists so abuse triage can correlate repeat submissions without
   * holding personal data.
   */
  ipHash: string | null;
  notification: EnquiryNotification;
  createdAt: string;
  updatedAt: string;
}

/** Everything the enquiry pipeline supplies when it writes a record. */
export interface NewEnquiry {
  name: string;
  email: string;
  phone: string | null;
  enquiryType: EnquiryType;
  location: string | null;
  message: string;
  attachments: EnquiryAttachment[];
  consentAt: string;
  ipHash: string | null;
}

/* -------------------------------------------------------------------------- */
/* Project — 06 §20                                                            */
/* -------------------------------------------------------------------------- */

export interface Project {
  id: string;
  title: string;
  slug: string;
  /** `06` §20 `serviceTag`. Maps onto the pillar/service taxonomy of `03` §4–5. */
  serviceTag: string;
  location: string;
  images: string[];
  summary: string;
  /** `06` §20 `published`. Only published records may be read publicly. */
  published: boolean;
}

/* -------------------------------------------------------------------------- */
/* PageContent — 06 §21                                                        */
/* -------------------------------------------------------------------------- */

/**
 * An editable copy block. Bodies are approved copy only (`03-copy-deck.md`);
 * `decisions.md` D-008 forbids authored replacement text, so any value stored
 * here must trace to a deck line.
 */
export interface PageContentSection {
  /** Stable key used by the renderer, e.g. `"pillar-1-scope"`. */
  key: string;
  heading: string | null;
  body: string | null;
}

export interface PageContent {
  id: string;
  /** Route key, e.g. `"what-we-do"`, `"faq"`. */
  pageKey: string;
  /** Editable pillar, service and FAQ text (`06` §21). */
  sections: PageContentSection[];
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Testimonial — 06 §22                                                        */
/* -------------------------------------------------------------------------- */

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  /** `Project.id` or slug the testimonial refers to. */
  projectRef: string | null;
  /** `06` §22 `published`. Only published records may be read publicly. */
  published: boolean;
}

/* -------------------------------------------------------------------------- */
/* Setting — 06 §23                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `06` §23: "contact info, service areas, SEO defaults".
 *
 * Every contact field is nullable because the public email and phone are
 * `[CLIENT TO CONFIRM]`: `decisions.md` D-012 forbids substituting a value, so
 * "not yet confirmed" has to be representable. The same rule is why `03` §11's
 * address is the only detail that can be seeded non-null.
 */
export interface Setting {
  id: string;
  contact: {
    address: string | null;
    email: string | null;
    phone: string | null;
  };
  serviceAreas: {
    /** `03` §9 state list is `[CLIENT TO CONFIRM] HIDE`, so this stays null until confirmed. */
    states: string[] | null;
    note: string | null;
  };
  seoDefaults: {
    titleTemplate: string | null;
    description: string | null;
  };
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* AdminUser — 06 §24                                                          */
/* -------------------------------------------------------------------------- */

export interface AdminUser {
  id: string;
  email: string;
  /**
   * `06` §28: "hashed passwords (argon2 or bcrypt)". A hash is a secret even
   * when hashed, so this value never leaves the server and is never logged
   * (`lib/log/server-log.ts` redacts the key).
   */
  passwordHash: string;
  createdAt: string;
}
