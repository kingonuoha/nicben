"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { adminFetch } from "@/lib/admin/client";
import { ADMIN_API } from "@/lib/admin/contract";
import type { Enquiry } from "@/lib/data/types";
import { NoteIcon } from "@/components/admin/icons";
import { Notice, adminButtonClass, adminTextareaClass } from "@/components/admin/primitives";

/**
 * Append an internal note to an enquiry.
 *
 * `POST /api/admin/enquiries/[id]/notes` with `{ body }`, validated against
 * `enquiryNoteSchema` (sanitised multi-line text, capped at `ADMIN_LIMITS.enquiryNote`)
 * and written with `authorId` taken from the session. The route answers `201` with
 * the updated enquiry.
 *
 * Nothing leaves the portal: notes are never echoed to a public surface and the
 * enquiry pipeline never reads them.
 */

export function EnquiryNoteForm({
  enquiryId,
  loginRedirectHref,
}: {
  enquiryId: string;
  loginRedirectHref: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const trimmed = body.trim();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || trimmed.length === 0) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const result = await adminFetch<Enquiry>(ADMIN_API.enquiryNotes(enquiryId), {
        method: "POST",
        body: { body },
      });

      if (!result.ok) {
        if (result.status === 401) {
          router.replace(loginRedirectHref);
          return;
        }
        setError(
          result.error.fieldErrors && result.error.fieldErrors.length > 0
            ? `${result.error.message} (${result.error.fieldErrors
                .map((issue) => `${issue.field} ${issue.message}`)
                .join(", ")})`
            : result.error.message,
        );
        return;
      }

      setBody("");
      setSaved(true);
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label
        htmlFor="enquiry-note"
        className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-900"
      >
        Add an internal note
      </label>
      <textarea
        id="enquiry-note"
        className={adminTextareaClass}
        rows={3}
        maxLength={2000}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setSaved(false);
        }}
        placeholder="Call summary, site access details, what was quoted"
        disabled={busy}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-xs text-text-600">{trimmed.length}/2000 · internal only</p>
        <button
          type="submit"
          className={adminButtonClass("secondary", "sm")}
          disabled={busy || trimmed.length === 0}
        >
          <NoteIcon width={16} height={16} />
          <span>{busy ? "Saving…" : "Save note"}</span>
        </button>
      </div>

      {error ? (
        <Notice tone="error" title="The note was not saved">
          {error}
        </Notice>
      ) : null}
      {saved ? <Notice tone="success">The note was stored on the enquiry.</Notice> : null}
    </form>
  );
}
