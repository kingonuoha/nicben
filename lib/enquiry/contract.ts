/**
 * The HTTP contract between the enquiry endpoint and its consumer.
 *
 * The `/contact` form posts to `ENQUIRY_ENDPOINT` and reads `EnquiryApiResponse`.
 * Both sides import this module so a field-name change cannot silently break one
 * of them.
 *
 * The response body is deliberately **outcome-only**: a `requestId` for support
 * ("quote this reference"), and for a failure the *names* of offending fields
 * paired with one of the six approved messages. A submitted value is never
 * returned — `06` §40, "Enquiry form does not echo raw input", is a property of
 * this contract, not of the form that happens to consume it.
 */

// Imported from the Zod-free options module, not from
// `lib/validation/enquiry.ts`: this contract is consumed by a client component,
// and a type-only import from the schema module would still pull Zod into the
// browser bundle through the module graph.
import type { EnquiryField } from "@/lib/validation/enquiry-options";

export const ENQUIRY_ENDPOINT = "/api/enquiries";

/**
 * Multipart field names. `ENQUIRY_ATTACHMENT_FIELD` is a repeated field: a
 * multiple-file input contributes one part per chosen file, and the server reads
 * every part (`lib/enquiry/submit.ts`).
 */
export const ENQUIRY_ATTACHMENT_FIELD = "attachments";

/**
 * Cloudflare Turnstile's own default field name. The widget writes the token into
 * it when the form is submitted normally; a client that controls its own fetch
 * can instead send `ENQUIRY_TURNSTILE_HEADER`. Both are accepted.
 */
export const ENQUIRY_TURNSTILE_FIELD = "cf-turnstile-response";
export const ENQUIRY_TURNSTILE_HEADER = "x-turnstile-token";

/** HTTP status codes the endpoint uses, and what each one means. */
export const ENQUIRY_API_STATUS = {
  /** Stored. Also returned for a honeypot hit, which is discarded silently. */
  ok: 200,
  /** Validation, consent or attachment failure — the client may correct it. */
  invalid: 400,
  /** Turnstile failure, or a cross-origin browser request. */
  forbidden: 403,
  /** Body larger than the endpoint accepts. */
  tooLarge: 413,
  /** `decisions.md` D-023 rate limit. `Retry-After` carries the wait. */
  rateLimited: 429,
  /** Unexpected server fault. Detail is logged, never returned. */
  serverError: 500,
} as const;

/**
 * `Content-Length` ceiling: the documented attachment budget
 * (`ATTACHMENT_MAX_TOTAL_BYTES`, 25 MB) plus 1 MB of multipart framing slack. The
 * check exists so an oversized body is refused before it is buffered.
 */
export const ENQUIRY_MAX_REQUEST_BYTES = 26 * 1024 * 1024;

export interface EnquiryApiFieldError {
  field: EnquiryField;
  /** One of the six approved messages from `03-copy-deck.md:195`. */
  message: string;
}

export interface EnquiryApiSuccess {
  ok: true;
  /** Support reference. Safe to display; contains no submitted value. */
  requestId: string;
}

export interface EnquiryApiFailure {
  ok: false;
  requestId: string;
  /** Present when the failure is not attributable to a single field. */
  formError: string | null;
  fieldErrors: EnquiryApiFieldError[];
  /** Seconds to wait, present only on a `429`. */
  retryAfterSeconds?: number;
}

export type EnquiryApiResponse = EnquiryApiSuccess | EnquiryApiFailure;

export function isEnquiryApiSuccess(response: EnquiryApiResponse): response is EnquiryApiSuccess {
  return response.ok;
}
