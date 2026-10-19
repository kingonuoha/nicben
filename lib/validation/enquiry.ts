/**
 * Enquiry validation schema — `docs/06-tech-and-security-spec.md` §32 ("Server-side
 * validation of every input (Zod), sanitize all stored text, never trust client
 * validation") and `docs/03-copy-deck.md` §11 (field set, required/optional
 * markers, and the 20-character message minimum, lines 182–196).
 *
 * **This is the module the `/contact` form imports.** It re-exports every string
 * the form needs — the three enquiry-type options, the field labels, the button
 * label, the success card and all six approved error messages — so the form and
 * the schema cannot drift apart (`docs/tasks/phase-05-backend-and-contact/brief.md`
 * §5.1).
 *
 * Two rules are enforced by construction rather than by convention:
 *
 * 1. **No raw input is ever returned.** Zod's own messages ("Too small: expected
 *    string to have >=20 characters") are never surfaced. `validateEnquirySubmission`
 *    maps every issue to one of the six approved messages
 *    (`ENQUIRY_ERROR_MESSAGES`) or to a field-level `null`, and the returned
 *    payload contains field *names* only — never a submitted value. That is
 *    `06` §40 ("Enquiry form does not echo raw input") satisfied at the boundary
 *    where a regression would be most damaging.
 * 2. **Sanitisation happens inside the schema**, so a caller cannot accidentally
 *    persist an unsanitised value by validating and then reading the raw input.
 *
 * The schema itself is browser-safe (Zod only, no Node built-ins) so a client
 * component may reuse it for convenience validation — but it is **never**
 * authoritative when it runs in a browser (`06` §32).
 */

import { z } from "zod";

import { ENQUIRY_TYPE_VALUES, type EnquiryType } from "@/lib/data/types";
import {
  sanitiseEmailAddress,
  sanitiseMultiline,
  sanitisePhoneNumber,
  sanitiseSingleLine,
} from "@/lib/enquiry/sanitise";
import {
  ENQUIRY_ERROR_MESSAGES,
  ENQUIRY_FIELD_ERROR_KEYS,
  ENQUIRY_HONEYPOT_FIELD,
  type EnquiryErrorKey,
  type EnquiryField,
} from "./enquiry-options";

// The form-facing strings live in `./enquiry-options` so a client component can
// import them without Zod. They are re-exported here because this module is the
// documented entry point for the web pass.
export * from "./enquiry-options";

/* -------------------------------------------------------------------------- */
/* Limits                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Server-side limits. Only one of these is user-visible copy — the 20-character
 * minimum, which `03-copy-deck.md:190` states as "min 20 chars". The rest are
 * resource limits, not published copy: they bound what a single request can
 * write and are chosen well above anything a genuine enquiry contains.
 */
export const ENQUIRY_LIMITS = {
  name: 100,
  email: 254,
  phone: 32,
  location: 120,
  messageMin: 20,
  messageMax: 5000,
} as const;

/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */

const nameField = z
  .string()
  .transform((value) => sanitiseSingleLine(value, ENQUIRY_LIMITS.name))
  .pipe(z.string().min(1));

const emailField = z
  .string()
  .transform((value) => sanitiseEmailAddress(value, ENQUIRY_LIMITS.email))
  .pipe(z.email().max(ENQUIRY_LIMITS.email));

/**
 * Optional fields are **normalised, not rejected**: an out-of-range phone or
 * location never produces an error, because `03-copy-deck.md:195` supplies no
 * message for them and D-008 forbids authoring one. `lib/enquiry/sanitise.ts`
 * strips the field to a safe character set and caps it instead, and a value with
 * nothing left becomes `null`.
 */
const phoneField = z
  .string()
  .transform((value) => sanitisePhoneNumber(value, ENQUIRY_LIMITS.phone));

const locationField = z.string().transform((value) => {
  const single = sanitiseSingleLine(value, ENQUIRY_LIMITS.location);
  return single.length > 0 ? single : null;
});

/**
 * `min 20` is applied **after** sanitisation (the `.pipe`), so padding the field
 * with whitespace or control characters cannot satisfy the minimum — the deck's
 * "at least 20 characters" means 20 characters of actual message.
 */
const messageField = z
  .string()
  .transform((value) => sanitiseMultiline(value, ENQUIRY_LIMITS.messageMax))
  .pipe(z.string().min(ENQUIRY_LIMITS.messageMin));

/** `06` §55 — "privacy consent. Store the consent timestamp." Consent is required. */
const consentField = z.literal(true);

export const enquirySchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  enquiryType: z.enum(ENQUIRY_TYPE_VALUES),
  location: locationField,
  message: messageField,
  consent: consentField,
});

export type ValidatedEnquiry = z.infer<typeof enquirySchema>;

/* -------------------------------------------------------------------------- */
/* Candidate extraction                                                        */
/* -------------------------------------------------------------------------- */

/** The unvalidated shape handed to the schema. Every value is `string` except consent. */
export interface EnquiryCandidate {
  name: string;
  email: string;
  phone: string;
  enquiryType: string;
  location: string;
  message: string;
  consent: boolean;
}

function readString(source: FormData, key: string): string {
  const value = source.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Checkbox parsing. A browser sends `"on"` unless the control carries a `value`;
 * other runtimes send `"true"`/`"1"`. Anything else, including an absent field,
 * is `false` — which fails validation, as it must.
 */
export function readConsent(source: FormData): boolean {
  const value = source.get("consent");
  if (typeof value !== "string") return false;
  const normalised = value.trim().toLowerCase();
  return normalised === "on" || normalised === "true" || normalised === "1" || normalised === "yes";
}

export function formDataToEnquiryCandidate(source: FormData): EnquiryCandidate {
  return {
    name: readString(source, "name"),
    email: readString(source, "email"),
    phone: readString(source, "phone"),
    enquiryType: readString(source, "enquiryType"),
    location: readString(source, "location"),
    message: readString(source, "message"),
    consent: readConsent(source),
  };
}

/**
 * A plain object may also be posted as JSON (the endpoint accepts both). This
 * accepts only the seven scalar fields and never a file.
 */
export function jsonToEnquiryCandidate(body: unknown): EnquiryCandidate {
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const string = (key: string): string => {
    const value = record[key];
    return typeof value === "string" ? value : "";
  };
  const consentValue = record.consent;
  const consent =
    consentValue === true ||
    (typeof consentValue === "string" &&
      ["on", "true", "1", "yes"].includes(consentValue.trim().toLowerCase()));
  return {
    name: string("name"),
    email: string("email"),
    phone: string("phone"),
    enquiryType: string("enquiryType"),
    location: string("location"),
    message: string("message"),
    consent,
  };
}

/* -------------------------------------------------------------------------- */
/* Honeypot                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `06` §13 · `decisions.md` D-022 — "The honeypot is always active regardless."
 * A populated honeypot field means an automated client. The caller must treat a
 * `true` result as a silent discard, never as an error: see
 * `lib/enquiry/submit.ts`.
 */
export function isHoneypotFilled(source: FormData): boolean {
  return readString(source, ENQUIRY_HONEYPOT_FIELD).trim().length > 0;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export interface EnquiryFieldError {
  field: EnquiryField;
  /** One of the six approved messages. Never a Zod message, never input. */
  message: string;
}

export type EnquiryValidationResult =
  | { ok: true; data: ValidatedEnquiry }
  | { ok: false; fieldErrors: EnquiryFieldError[]; formError: string | null };

interface MappedIssue {
  field: EnquiryField;
  key: EnquiryErrorKey;
}

/**
 * Map a Zod issue to an approved message.
 *
 * `null` means "this failure has no approved message" — message-too-long, a
 * non-string payload — and the caller falls back to the generic form-level
 * message rather than inventing copy. `ENQUIRY_FIELD_ERROR_KEYS` is the single
 * declaration of field → message; this function only decides *which* field the
 * issue belongs to and, for the message field, which of the two failure
 * directions it is.
 */
function mapIssue(issue: z.core.$ZodIssue): MappedIssue | null {
  const path = typeof issue.path[0] === "string" ? issue.path[0] : "";
  switch (path) {
    case "name":
      return { field: "name", key: "name" };
    case "email":
      return { field: "email", key: "email" };
    case "enquiryType":
      return { field: "enquiryType", key: "enquiryType" };
    case "message":
      // 03-copy-deck.md:195 supplies one message for the message field, and it
      // speaks about the minimum. A too-long message therefore cannot use it;
      // it falls through to the generic message.
      return issue.code === "too_small" ? { field: "message", key: "message" } : null;
    case "consent":
      return { field: "consent", key: "generic" };
    default:
      return null;
  }
}

/**
 * Validate a candidate submission. The returned `data` is sanitised and safe to
 * store; the returned errors contain field names and approved messages only.
 */
export function validateEnquirySubmission(candidate: EnquiryCandidate): EnquiryValidationResult {
  const parsed = enquirySchema.safeParse(candidate);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  const fieldErrors: EnquiryFieldError[] = [];
  let hasUnmappedIssue = false;

  for (const issue of parsed.error.issues) {
    const mapped = mapIssue(issue);
    if (!mapped) {
      hasUnmappedIssue = true;
      continue;
    }
    if (fieldErrors.some((existing) => existing.field === mapped.field)) continue;
    fieldErrors.push({ field: mapped.field, message: ENQUIRY_ERROR_MESSAGES[mapped.key] });
  }

  // The generic message is returned both when a failure has no approved message
  // of its own and when nothing could be attributed to a field at all — the form
  // must always have something to render.
  const formError =
    hasUnmappedIssue || fieldErrors.length === 0 ? ENQUIRY_ERROR_MESSAGES.generic : null;

  return { ok: false, fieldErrors, formError };
}

/** Exposed for the completion-notes audit: the field → message table, resolved. */
export const ENQUIRY_FIELD_MESSAGES: ReadonlyArray<{ field: EnquiryField; message: string }> =
  Object.keys(ENQUIRY_FIELD_ERROR_KEYS).map((field) => ({
    field: field as EnquiryField,
    message: ENQUIRY_ERROR_MESSAGES[
      (ENQUIRY_FIELD_ERROR_KEYS as Partial<Record<EnquiryField, EnquiryErrorKey>>)[
        field as EnquiryField
      ] ?? "generic"
    ],
  }));

export { ENQUIRY_HONEYPOT_FIELD };

/** Re-exported for callers that only need the union. */
export type { EnquiryType };
