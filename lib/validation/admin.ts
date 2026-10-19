/**
 * Admin mutation schemas — `docs/06-tech-and-security-spec.md` §32.
 *
 * "Server-side validation of every input (Zod), sanitize all stored text, never trust
 * client validation." Every mutating admin route validates its body with one of these
 * schemas and stores **the schema's output**, never the request (`lib/admin/api.ts`
 * `validateBody`). The portal may reuse a schema for convenience validation, but a
 * browser run of it is never authoritative.
 *
 * ### Sanitisation is shared with Phase 05, not reimplemented
 *
 * `lib/enquiry/sanitise.ts` already removes C0/C1 control characters, the bidi
 * overrides, the zero-width set and unencodable surrogates, normalises line endings
 * and whitespace, and NFC-normalises the result. Those are properties of "text this
 * application stores", not of "an enquiry", so the same functions are used here
 * rather than a second implementation that could diverge.
 *
 * The one rule this file adds: **`sanitise` never applies to a password.** A password
 * is compared byte-for-byte against a hash, so normalising it would silently change
 * which credential is accepted. `adminLoginSchema` bounds its length and does nothing
 * else to it.
 *
 * ### Ids are adapter-specific
 *
 * The MongoDB adapter identifies records by ObjectId hex; the dev adapter by UUID. A
 * schema that enforced one format would break the other, so `recordId` validates the
 * **shape** (a short, opaque, URL-safe token) and leaves resolution to the adapter. A
 * malformed id resolves to nothing rather than to a 500.
 *
 * Server-only in deployment. It imports Zod and `@/lib/data/types`; it does not read
 * the environment.
 */

import { z } from "zod";

import { ENQUIRY_STATUS_VALUES } from "@/lib/data/types";
import { AUDIT_ACTION_VALUES, AUDIT_RESOURCE_TYPE_VALUES } from "@/lib/data/types";
import {
  sanitiseEmailAddress,
  sanitiseMultiline,
  sanitisePhoneNumber,
  sanitiseSingleLine,
} from "@/lib/enquiry/sanitise";

/* -------------------------------------------------------------------------- */
/* Limits                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Resource limits, not published copy. Each is set well above the largest value the
 * portal's own screens can produce, so a limit can only be reached by something that
 * is not the portal.
 */
export const ADMIN_LIMITS = {
  email: 254,
  /** A password is bounded so an oversized payload cannot burn CPU; it is not sanitised. */
  password: 512,
  projectTitle: 200,
  projectSlug: 120,
  projectServiceTag: 120,
  projectLocation: 160,
  projectImageUrl: 500,
  projectImages: 24,
  projectSummary: 4000,
  testimonialName: 120,
  testimonialQuote: 1500,
  testimonialProjectRef: 160,
  pageKey: 120,
  sectionKey: 120,
  sectionHeading: 400,
  sectionBody: 8000,
  sectionsPerPage: 80,
  settingAddress: 400,
  settingPhone: 40,
  settingNote: 800,
  settingState: 80,
  settingStates: 80,
  seoTitleTemplate: 300,
  seoDescription: 600,
  enquiryNote: 2000,
  listLimit: 200,
  listLimitDefault: 25,
} as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Loose text input: a form value, a JSON `null`, or an absent key.
 *
 * Anything that is not a string becomes `""`, which the optional helpers below then map to
 * `null`. Two reasons this coercion exists rather than `z.string()`:
 *
 * 1. The portal sends JSON, and a cleared input is naturally `null`. A schema that rejected
 *    `null` would make "the operator removed this value" an error rather than a value.
 * 2. A number or a boolean arriving where text is expected is a client bug, and turning it
 *    into absent text is more honest than coercing `1` into the string `"1"`.
 */
const looseText = z.preprocess((value) => (typeof value === "string" ? value : ""), z.string());

/** Required single-line text: sanitised, then required to survive as non-empty. */
function requiredLine(max: number) {
  return z
    .string()
    .transform((value) => sanitiseSingleLine(value, max))
    .pipe(z.string().min(1));
}

/**
 * Optional single-line text: **normalised, not rejected.** An over-long value is cleaned and
 * capped rather than refused, because there is no approved message for it and an internal
 * portal that refuses a long address with no explanation is worse than one that stores a
 * truncated one.
 */
function optionalLine(max: number) {
  return looseText.transform((value) => {
    const cleaned = sanitiseSingleLine(value, max);
    return cleaned.length > 0 ? cleaned : null;
  });
}

/** Optional multi-line text. Paragraph structure is preserved. */
function optionalBlock(max: number) {
  return looseText.transform((value) => {
    const cleaned = sanitiseMultiline(value, max);
    return cleaned.length > 0 ? cleaned : null;
  });
}

/** Optional, required-if-present email. `""` and `null` mean "not set", which is not an error. */
const optionalEmail = looseText
  .transform((value) => {
    const cleaned = sanitiseEmailAddress(value, ADMIN_LIMITS.email);
    return cleaned.length > 0 ? cleaned : null;
  })
  .pipe(z.union([z.null(), z.email()]));

/** Optional phone. Sanitised to the characters an international number uses. */
const optionalPhone = looseText.transform((value) =>
  sanitisePhoneNumber(value, ADMIN_LIMITS.settingPhone),
);

/**
 * `id` as it arrives from a form: absent, empty, `"null"` and a real id all have to be
 * expressible. `""`/absent means "create".
 *
 * `z.preprocess` rather than a union containing `z.undefined()`: Zod 4 rejects an
 * `undefined` member of a union that feeds a `.pipe()`, and the intent here is a coercion
 * of a loose form value, not a union of input types.
 */
const recordId = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "null" || trimmed === "undefined") return null;
  return trimmed;
}, z.union([
  z.null(),
  // Shape only — see the module comment. ObjectId hex and UUID both pass, because both
  // are short URL-safe tokens.
  z
    .string()
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "must be an opaque record id"),
]));

/** Checkbox, switch and JSON-boolean handling, without `z.coerce.boolean()`'s trap of `"false" → true`. */
const booleanField = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (["true", "on", "1", "yes"].includes(normalised)) return true;
    if (["false", "off", "0", "no", ""].includes(normalised)) return false;
  }
  return value;
}, z.boolean());

/** `yyyy-mm-dd` slug, the form every URL in this project uses. */
const slugField = z
  .string()
  .transform((value) => sanitiseSingleLine(value, ADMIN_LIMITS.projectSlug).toLowerCase())
  .pipe(
    z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase words separated by hyphens"),
  );

/** Route key, e.g. `what-we-do` or `what-we-do/treasury-investments`. */
const pageKeyField = z
  .string()
  .transform((value) => sanitiseSingleLine(value, ADMIN_LIMITS.pageKey).toLowerCase())
  .pipe(
    z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/, "must be lowercase path segments"),
  );

/** Section key, e.g. `pillar-1-scope`. */
const sectionKeyField = z
  .string()
  .transform((value) => sanitiseSingleLine(value, ADMIN_LIMITS.sectionKey).toLowerCase())
  .pipe(
    z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "must be lowercase, hyphen/underscore/dot separated"),
  );

/**
 * An image reference. Relative (`/images/projects/foo.jpg`) and absolute (`https://…`)
 * are both legitimate, so this is not `z.url()`: a scheme check would reject the
 * `public/` paths the project actually ships.
 */
const imageReference = z
  .string()
  .transform((value) => sanitiseSingleLine(value, ADMIN_LIMITS.projectImageUrl))
  .pipe(z.string().min(1));

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The login body. The password is **not** sanitised and **not** trimmed — trimming a
 * password would change which credential matches, and a legitimate password may begin
 * or end with a space.
 */
export const adminLoginSchema = z.object({
  email: z
    .string()
    .transform((value) => sanitiseEmailAddress(value, ADMIN_LIMITS.email))
    .pipe(z.string().min(1)),
  password: z.string().min(1).max(ADMIN_LIMITS.password),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export const enquiryStatusUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUS_VALUES),
  /** Optional note recorded alongside the change (`06` §60 records who/what/when). */
  note: optionalBlock(ADMIN_LIMITS.enquiryNote).optional(),
  /**
   * `actorId` is deliberately **not** accepted. The actor comes from the verified
   * session (`lib/admin/api.ts`), so a body cannot attribute an action to someone
   * else — that is the privilege-separation property, enforced by the schema's
   * silence.
   */
});

export type EnquiryStatusUpdateInput = z.infer<typeof enquiryStatusUpdateSchema>;

export const enquiryNoteSchema = z.object({
  body: z
    .string()
    .transform((value) => sanitiseMultiline(value, ADMIN_LIMITS.enquiryNote))
    .pipe(z.string().min(1)),
});

export type EnquiryNoteInput = z.infer<typeof enquiryNoteSchema>;

/** Query parameters for an admin list. Absent means "no filter". */
export const enquiryListQuerySchema = z.object({
  status: z.enum(ENQUIRY_STATUS_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(ADMIN_LIMITS.listLimit).optional(),
  cursor: z.string().max(64).optional(),
});

/* -------------------------------------------------------------------------- */
/* Projects                                                                    */
/* -------------------------------------------------------------------------- */

export const projectUpsertSchema = z.object({
  id: recordId,
  title: requiredLine(ADMIN_LIMITS.projectTitle),
  slug: slugField,
  serviceTag: requiredLine(ADMIN_LIMITS.projectServiceTag),
  location: requiredLine(ADMIN_LIMITS.projectLocation),
  images: z
    .array(imageReference)
    .max(ADMIN_LIMITS.projectImages)
    .default([]),
  summary: requiredLine(ADMIN_LIMITS.projectSummary),
  published: booleanField,
});

export type ProjectUpsertInput = z.infer<typeof projectUpsertSchema>;

export const projectListQuerySchema = z.object({
  published: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(ADMIN_LIMITS.listLimit).optional(),
  cursor: z.string().max(64).optional(),
});

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

export const testimonialUpsertSchema = z.object({
  id: recordId,
  name: requiredLine(ADMIN_LIMITS.testimonialName),
  quote: z
    .string()
    .transform((value) => sanitiseMultiline(value, ADMIN_LIMITS.testimonialQuote))
    .pipe(z.string().min(1)),
  projectRef: optionalLine(ADMIN_LIMITS.testimonialProjectRef),
  published: booleanField,
});

export type TestimonialUpsertInput = z.infer<typeof testimonialUpsertSchema>;

export const testimonialListQuerySchema = projectListQuerySchema;

/* -------------------------------------------------------------------------- */
/* Page content                                                                */
/* -------------------------------------------------------------------------- */

export const pageContentSectionSchema = z.object({
  key: sectionKeyField,
  heading: optionalLine(ADMIN_LIMITS.sectionHeading),
  body: optionalBlock(ADMIN_LIMITS.sectionBody),
});

export const pageContentUpsertSchema = z.object({
  pageKey: pageKeyField,
  sections: z.array(pageContentSectionSchema).max(ADMIN_LIMITS.sectionsPerPage),
});

export type PageContentUpsertInput = z.infer<typeof pageContentUpsertSchema>;

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `06` §23: "contact info, service areas, SEO defaults".
 *
 * Every field is nullable and an empty string normalises to `null`. That is not
 * optionality for convenience: the public email, phone and state list are
 * `[CLIENT TO CONFIRM]`, and `decisions.md` D-012 forbids substituting a plausible
 * value, so "not yet confirmed" has to be representable — and distinguishable from
 * "entered and empty" would be a false distinction here, so it is not made.
 */
export const settingsUpsertSchema = z.object({
  contact: z.object({
    address: optionalLine(ADMIN_LIMITS.settingAddress),
    email: optionalEmail,
    phone: optionalPhone,
  }),
  serviceAreas: z.object({
    states: z
      .union([z.array(z.string()).max(ADMIN_LIMITS.settingStates), z.null()])
      .transform((value) =>
        value === null
          ? null
          : value
              .map((state) => sanitiseSingleLine(state, ADMIN_LIMITS.settingState))
              .filter((state) => state.length > 0),
      ),
    note: optionalLine(ADMIN_LIMITS.settingNote),
  }),
  seoDefaults: z.object({
    titleTemplate: optionalLine(ADMIN_LIMITS.seoTitleTemplate),
    description: optionalBlock(ADMIN_LIMITS.seoDescription),
  }),
});

export type SettingsUpsertInput = z.infer<typeof settingsUpsertSchema>;

/* -------------------------------------------------------------------------- */
/* Audit log                                                                   */
/* -------------------------------------------------------------------------- */

export const auditLogQuerySchema = z.object({
  action: z.enum(AUDIT_ACTION_VALUES).optional(),
  resourceType: z.enum(AUDIT_RESOURCE_TYPE_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(ADMIN_LIMITS.listLimit).optional(),
  cursor: z.string().max(64).optional(),
});

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

/** The export endpoint's only parameter: an optional status filter. */
export const enquiryExportQuerySchema = z.object({
  status: z.enum(ENQUIRY_STATUS_VALUES).optional(),
});
