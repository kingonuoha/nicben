/**
 * Text sanitisation.
 *
 * `docs/06-tech-and-security-spec.md` section 32: "Server-side validation of
 * every input (Zod), **sanitize all stored text**, never trust client
 * validation." Section 40: "Enquiry form does not echo raw input; email
 * templates escape content."
 *
 * What "sanitise" means here, precisely — and what it deliberately does not do:
 *
 * - **Removed:** C0/C1 control characters (except newline and tab), the bidi
 *   control characters U+202A–U+202E and U+2066–U+2069, the zero-width set
 *   (U+200B–U+200D, U+FEFF), and surrogates that cannot encode. These are the
 *   characters that let stored text change how a later surface renders or
 *   reads, and no legitimate enquiry needs them.
 * - **Normalised:** line endings to `\n`, runs of horizontal whitespace to one
 *   space, runs of three or more newlines to two, and the string to Unicode NFC.
 * - **Capped:** every field has a maximum length (`lib/validation/enquiry.ts`),
 *   applied after normalisation so padding cannot smuggle extra bytes past it.
 * - **NOT escaped and NOT tag-stripped.** HTML metacharacters are left exactly
 *   as the sender wrote them. Escaping at the storage boundary would store a
 *   doubly-encoded string and corrupt the record ("3 < 5" would become
 *   "3 &lt; 5" in every future render). Section 40's requirement is satisfied at
 *   the *output* boundary instead: `escapeHtml` below is applied to every
 *   interpolated value in the notification email, and the admin surfaces in
 *   Phase 06 render through React, which escapes by construction.
 *
 * This module is pure and imports no Node built-ins, because
 * `lib/validation/enquiry.ts` re-exports from it and that module is reachable
 * from the browser bundle.
 */

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069\u061C\u200E\u200F]/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
const HORIZONTAL_RUN = /[^\S\n]+/g;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

function stripUnsafeCharacters(value: string): string {
  return value
    .replace(LONE_SURROGATE, "")
    .replace(CONTROL_CHARACTERS, "")
    .replace(BIDI_CONTROLS, "")
    .replace(ZERO_WIDTH, "");
}

function cap(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

/**
 * One-line field (name, phone, location, filename): no newlines survive, so a
 * stored value cannot forge an extra line in a log entry or an email row.
 */
export function sanitiseSingleLine(value: string, maxLength: number): string {
  const normalised = stripUnsafeCharacters(value).normalize("NFC").replace(HORIZONTAL_RUN, " ");
  return cap(normalised.trim(), maxLength);
}

/** Multi-line field (the message body): paragraph structure is preserved. */
export function sanitiseMultiline(value: string, maxLength: number): string {
  const normalised = stripUnsafeCharacters(value)
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(HORIZONTAL_RUN, " ")
    .replace(/\n{3,}/g, "\n\n");
  return cap(normalised.trim(), maxLength);
}

/**
 * A display name for an uploaded file. Only the basename survives: a
 * client-supplied path is untrusted input and is never used to build a storage
 * key (`lib/enquiry/attachments.ts` generates that instead).
 */
export function sanitiseDisplayFilename(value: string, maxLength: number): string {
  const basename = value.split(/[\\/]/).pop() ?? "";
  return sanitiseSingleLine(basename, maxLength);
}

/**
 * Phone numbers are free text across the regions `03-copy-deck.md` §9 anticipates
 * ("various U.S. states based on project requests"), so this keeps the characters
 * an international number legitimately uses and discards everything else. A value
 * with no digit at all is not a phone number and becomes `null`.
 */
export function sanitisePhoneNumber(value: string, maxLength: number): string | null {
  const single = sanitiseSingleLine(value, maxLength);
  const cleaned = single.replace(/[^0-9+().\- ]/g, "").replace(/\s{2,}/g, " ").trim();
  if (!/[0-9]/.test(cleaned)) return null;
  return cap(cleaned, maxLength);
}

/** Email: lowercase and trimmed so `A@B.co` and `a@b.co` are one identity. */
export function sanitiseEmailAddress(value: string, maxLength: number): string {
  return cap(stripUnsafeCharacters(value).trim().toLowerCase(), maxLength);
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Output-boundary escaping (`06` §40). Applied to **every** interpolated value
 * in the HTML notification email, without exception.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}
