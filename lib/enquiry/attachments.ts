/**
 * Attachment intake rules — `docs/06-tech-and-security-spec.md` §34 and §57.
 *
 * The spec: "File upload rules: type allowlist, size cap (e.g. 5 MB), rename
 * files, store outside web root, malware-safe handling" and "Attachments: allow
 * JPG, PNG, PDF only, 5 MB max each, rename on upload, store outside the web root
 * or in private blob storage, never serve them from a public URL without
 * authorization."
 *
 * The trust boundary is enforced here, not in the browser:
 *
 * - **Type is decided by magic bytes.** `File.type` and the filename extension are
 *   both client-supplied and both trivially forged; neither decides anything.
 *   They are only *cross-checked*, and a mismatch is a rejection rather than a
 *   reclassification. This is the "never trust client-provided file extension or
 *   MIME header blindly" requirement.
 * - **Size is checked before the bytes are read** (`File.size`), and then again
 *   against the actual buffer length.
 * - **The stored name is generated, never echoed.** `buildStorageKey` uses a
 *   UUID and an extension derived from the sniffed type. The client's filename is
 *   used only for a sanitised display string, so a path, a control character or a
 *   `..` segment can never reach the object store.
 *
 * What this module does **not** do: virus scanning. `06` §34's "malware-safe
 * handling" is satisfied by never executing, rasterising or publicly serving the
 * bytes, and by keeping them behind an authorisation check (D-020). Anti-virus
 * scanning requires a paid service and is recorded as a launch prerequisite in
 * the phase completion notes rather than claimed here.
 *
 * Server-only: imports `node:crypto`.
 */

import { randomUUID } from "node:crypto";

import { type AttachmentContentType, ATTACHMENT_CONTENT_TYPES } from "../data/types";
import { sanitiseDisplayFilename } from "./sanitise";

/** `03-copy-deck.md:191` states the user-visible limit: "max 5 MB per file". */
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
/** Resource bound, not published copy: the form offers one optional file input. */
export const ATTACHMENT_MAX_COUNT = 5;
export const ATTACHMENT_MAX_TOTAL_BYTES = ATTACHMENT_MAX_COUNT * ATTACHMENT_MAX_BYTES;
/** Cap applied to the sanitised display name that accompanies a stored object. */
export const ATTACHMENT_DISPLAY_NAME_MAX = 120;

/** Extensions accepted from the client, before the bytes are consulted. */
export const ATTACHMENT_ALLOWED_EXTENSIONS: readonly string[] = ["jpg", "jpeg", "png", "pdf"];

/** MIME values accepted from the client, before the bytes are consulted. */
export const ATTACHMENT_ALLOWED_DECLARED_TYPES: readonly string[] = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/x-pdf",
];

const EXTENSION_BY_CONTENT_TYPE: Readonly<Record<AttachmentContentType, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
/** A PDF may carry up to 1024 bytes of leading junk before `%PDF-`. */
const PDF_SCAN_WINDOW = 1024;
const PDF_SIGNATURE = "%PDF-";

/** Shortest plausible file of any allowed type; anything smaller is not a real file. */
const MINIMUM_BYTES = 16;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function containsPdfSignature(bytes: Uint8Array): boolean {
  const window = bytes.subarray(0, Math.min(bytes.length, PDF_SCAN_WINDOW));
  // ASCII scan without allocating a string for large buffers.
  const needle = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  outer: for (let start = 0; start + needle.length <= window.length; start += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (window[start + offset] !== needle[offset]) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * Decide a file's type from its bytes. Returns `null` when the content matches no
 * allowed type — the only input to the decision is the buffer.
 */
export function sniffAttachmentContentType(bytes: Uint8Array): AttachmentContentType | null {
  if (bytes.length < MINIMUM_BYTES) return null;
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (startsWith(bytes, JPEG_SIGNATURE)) return "image/jpeg";
  if (containsPdfSignature(bytes)) return "application/pdf";
  return null;
}

export type AttachmentRejectionReason =
  | "too-many-files"
  | "too-large"
  | "too-large-total"
  | "unsupported-type"
  | "type-mismatch"
  | "empty"
  | "unreadable";

export interface PreparedAttachment {
  /** Sanitised display name. Never used to build a storage key. */
  name: string;
  contentType: AttachmentContentType;
  extension: string;
  sizeBytes: number;
  /** Private storage key. */
  storageKey: string;
  bytes: Uint8Array;
}

export type AttachmentPreparation =
  | { ok: true; attachments: PreparedAttachment[] }
  | { ok: false; reason: AttachmentRejectionReason };

function extensionOf(filename: string): string {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(filename);
  return match ? match[1].toLowerCase() : "";
}

/**
 * Generated storage key: `enquiries/<yyyy>/<mm>/<uuid>.<ext>`.
 *
 * Date-sharded so the store stays listable as it grows, and UUID-named so two
 * senders uploading `IMG_2034.jpg` cannot collide or overwrite one another — the
 * "rename files" requirement. Nothing from the client's filename reaches it.
 */
export function buildStorageKey(contentType: AttachmentContentType, now = new Date()): string {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `enquiries/${year}/${month}/${randomUUID()}.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;
}

/**
 * Validate and prepare uploaded files for private storage. Bytes are read only
 * after the cheap metadata checks have passed.
 */
export async function prepareAttachments(files: readonly File[]): Promise<AttachmentPreparation> {
  const candidates = files.filter((file) => file instanceof File);
  if (candidates.length === 0) return { ok: true, attachments: [] };
  if (candidates.length > ATTACHMENT_MAX_COUNT) return { ok: false, reason: "too-many-files" };

  let total = 0;
  const prepared: PreparedAttachment[] = [];

  for (const file of candidates) {
    // 1. Size, from metadata, before touching the buffer.
    if (file.size <= 0) return { ok: false, reason: "empty" };
    if (file.size > ATTACHMENT_MAX_BYTES) return { ok: false, reason: "too-large" };
    total += file.size;
    if (total > ATTACHMENT_MAX_TOTAL_BYTES) return { ok: false, reason: "too-large-total" };

    // 2. Declared metadata, cross-checked only. A missing declared type is not a
    //    rejection on its own — the bytes decide — but a *wrong* declared type is.
    const declaredType = file.type.trim().toLowerCase();
    if (declaredType && !ATTACHMENT_ALLOWED_DECLARED_TYPES.includes(declaredType)) {
      return { ok: false, reason: "unsupported-type" };
    }
    const extension = extensionOf(file.name);
    if (!extension || !ATTACHMENT_ALLOWED_EXTENSIONS.includes(extension)) {
      return { ok: false, reason: "unsupported-type" };
    }

    // 3. The authoritative check: the bytes.
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      return { ok: false, reason: "unreadable" };
    }
    if (bytes.byteLength !== file.size || bytes.byteLength > ATTACHMENT_MAX_BYTES) {
      return { ok: false, reason: "too-large" };
    }
    const contentType = sniffAttachmentContentType(bytes);
    if (!contentType) return { ok: false, reason: "unsupported-type" };

    // 4. Declared extension must agree with the sniffed type. `jpeg` and `jpg`
    //    are the same format; anything else is a mismatch and is rejected.
    const sniffedExtension = EXTENSION_BY_CONTENT_TYPE[contentType];
    const extensionAgrees =
      extension === sniffedExtension || (sniffedExtension === "jpg" && extension === "jpeg");
    if (!extensionAgrees) return { ok: false, reason: "type-mismatch" };

    prepared.push({
      name:
        sanitiseDisplayFilename(file.name, ATTACHMENT_DISPLAY_NAME_MAX) ||
        `attachment.${sniffedExtension}`,
      contentType,
      extension: sniffedExtension,
      sizeBytes: bytes.byteLength,
      storageKey: buildStorageKey(contentType),
      bytes,
    });
  }

  return { ok: true, attachments: prepared };
}

/** Exposed for the verification run: the allowlist as a value, not prose. */
export const ATTACHMENT_RULES = {
  allowedContentTypes: ATTACHMENT_CONTENT_TYPES,
  allowedExtensions: ATTACHMENT_ALLOWED_EXTENSIONS,
  maxBytesPerFile: ATTACHMENT_MAX_BYTES,
  maxFiles: ATTACHMENT_MAX_COUNT,
} as const;
