/**
 * Private attachment storage — `decisions.md` **D-020** (Vercel Blob, private) and
 * `docs/06-tech-and-security-spec.md` §57 ("store … in private blob storage,
 * never serve them from a public URL without authorization").
 *
 * Three decisions are implemented here, and each is a requirement rather than a
 * preference:
 *
 * 1. **`access: "private"` on every write.** A private object requires
 *    authentication to read, so no URL derived from it is publicly reachable.
 * 2. **No URL is persisted.** The stored record keeps `storageKey` only
 *    (`lib/data/types.ts`). Persisting the store's URL would put a reachable
 *    address into a database document that Phase 06 renders, which is exactly
 *    the shape of mistake §57 exists to prevent. Retrieval goes through an
 *    authorised admin route that calls `get(key, { access: "private" })`.
 * 3. **Partial failure is rolled back.** If file 2 of 3 fails to upload, the
 *    already-stored objects are deleted before the failure is returned, so a
 *    rejected submission cannot leave orphans in the store.
 *
 * `BLOB_READ_WRITE_TOKEN` absent means the attachment field is not rendered
 * (D-020), so this module must never be reached in that state; if it is, it
 * refuses rather than discarding the file silently.
 *
 * Server-only.
 */

import { logServerEvent } from "../log/server-log";
import type { EnquiryAttachment } from "../data/types";
import type { PreparedAttachment } from "./attachments";
import { getBlobReadWriteToken, isAttachmentStorageConfigured } from "./config";

/** Blob pathnames already written during this submission, for rollback. */
type UploadedPathnames = string[];

export type AttachmentStorageResult =
  | { ok: true; attachments: EnquiryAttachment[] }
  | { ok: false; reason: "not-configured" | "upload-failed" | "rollback-failed" };

async function rollback(pathnames: UploadedPathnames, token: string): Promise<boolean> {
  if (pathnames.length === 0) return true;
  try {
    // Dynamic import keeps the Blob SDK out of the module graph of any build
    // that never stores a file.
    const { del } = await import("@vercel/blob");
    await del(pathnames, { token });
    return true;
  } catch (error) {
    logServerEvent({
      scope: "enquiry",
      event: "attachment_rollback_failed",
      level: "error",
      data: { count: pathnames.length, error: error instanceof Error ? error.name : "unknown" },
    });
    return false;
  }
}

export async function storePrivateAttachments(
  prepared: readonly PreparedAttachment[],
): Promise<AttachmentStorageResult> {
  if (prepared.length === 0) return { ok: true, attachments: [] };

  const token = getBlobReadWriteToken();
  if (!token || !isAttachmentStorageConfigured()) {
    // D-020: an absent field, never a silent discard. Reaching here means the
    // field was rendered without a configured store, which is a wiring bug.
    logServerEvent({
      scope: "enquiry",
      event: "attachment_store_not_configured",
      level: "error",
      data: { count: prepared.length },
    });
    return { ok: false, reason: "not-configured" };
  }

  const { put } = await import("@vercel/blob");
  const stored: EnquiryAttachment[] = [];
  const written: UploadedPathnames = [];

  for (const attachment of prepared) {
    try {
      await put(attachment.storageKey, Buffer.from(attachment.bytes), {
        access: "private",
        token,
        contentType: attachment.contentType,
        // The key already carries a UUID, so an extra random suffix would only
        // make the recorded key wrong.
        addRandomSuffix: false,
      });
    } catch (error) {
      const rolledBack = await rollback(written, token);
      logServerEvent({
        scope: "enquiry",
        event: "attachment_upload_failed",
        level: "error",
        data: {
          contentType: attachment.contentType,
          sizeBytes: attachment.sizeBytes,
          uploadedBeforeFailure: written.length,
          error: error instanceof Error ? error.name : "unknown",
        },
      });
      return { ok: false, reason: rolledBack ? "upload-failed" : "rollback-failed" };
    }

    written.push(attachment.storageKey);
    stored.push({
      name: attachment.name,
      // Key only — never the object's URL (§57, and the note at the top).
      storageKey: attachment.storageKey,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
    });
  }

  logServerEvent({
    scope: "enquiry",
    event: "attachments_stored",
    level: "info",
    data: {
      count: stored.length,
      totalBytes: stored.reduce((sum, attachment) => sum + attachment.sizeBytes, 0),
      access: "private",
    },
  });

  return { ok: true, attachments: stored };
}
