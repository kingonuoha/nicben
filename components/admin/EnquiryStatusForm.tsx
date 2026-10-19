"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { adminFetch } from "@/lib/admin/client";
import { ADMIN_API } from "@/lib/admin/contract";
import type { Enquiry } from "@/lib/data/types";
import { ENQUIRY_STATUS_LABELS, enquiryStatusTone } from "@/components/admin/nav";
import { CheckIcon } from "@/components/admin/icons";
import {
  Notice,
  Pill,
  adminButtonClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/primitives";

/**
 * Status change, plus the optional note that goes with it.
 *
 * `PATCH /api/admin/enquiries/[id]` with `{ status, note? }`. The route validates
 * the body against `enquiryStatusUpdateSchema` and takes the **actor from the
 * session** — the schema has no `actorId` field at all, which is what makes it
 * impossible for this form to attribute a change to another account even if it
 * tried.
 *
 * `docs/06-tech-and-security-spec.md` §60 requires a status change to be logged
 * with who/what/when; the route writes that audit entry, so nothing here needs to
 * and nothing here can skip it.
 *
 * The mutation is sent through `adminFetch`, which sets the `x-nicben-csrf` header
 * from the double-submit cookie. A bare `fetch` PATCH is `403` by design
 * (`lib/admin/api.ts`), which is the correct failure: the portal is not allowed to
 * mutate without the token.
 */

export interface EnquiryStatusFormProps {
  enquiry: Enquiry;
  /** The four statuses, passed down from the server so this file declares no vocabulary. */
  statuses: readonly Enquiry["status"][];
  /** Where to send the operator if the session has gone. */
  loginRedirectHref: string;
}

export function EnquiryStatusForm({ enquiry, statuses, loginRedirectHref }: EnquiryStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Enquiry["status"]>(enquiry.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const unchanged = status === enquiry.status;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSavedAt(null);

    try {
      const result = await adminFetch<Enquiry>(ADMIN_API.enquiry(enquiry.id), {
        method: "PATCH",
        body: note.trim().length > 0 ? { status, note } : { status },
      });

      if (!result.ok) {
        if (result.status === 401) {
          // The cookie expired or was revoked while the drawer was open. The
          // server has already refused; send the operator to sign in again.
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

      setNote("");
      setSavedAt(new Date().toISOString());
      // The record is read on the server; refresh re-renders the page and the
      // drawer with the stored values rather than with this component's guess.
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
          Current status
        </span>
        <Pill tone={enquiryStatusTone(enquiry.status)}>{ENQUIRY_STATUS_LABELS[enquiry.status]}</Pill>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="enquiry-status"
          className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-900"
        >
          Change status to
        </label>
        <select
          id="enquiry-status"
          className={adminSelectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as Enquiry["status"])}
          disabled={busy}
        >
          {statuses.map((value) => (
            <option key={value} value={value}>
              {ENQUIRY_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="enquiry-status-note"
          className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-900"
        >
          Note recorded with the change
        </label>
        <textarea
          id="enquiry-status-note"
          className={adminTextareaClass}
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What changed, and why"
          disabled={busy}
        />
        <p className="font-body text-xs text-text-600">
          Optional. Stored on the enquiry and attributed to your account in the audit log.
        </p>
      </div>

      {error ? (
        <Notice tone="error" title="The change was not saved">
          {error}
        </Notice>
      ) : null}
      {savedAt ? (
        <Notice tone="success" title="Status saved">
          The stored record was updated and the change was audited.
        </Notice>
      ) : null}

      <div>
        <button type="submit" className={adminButtonClass("primary")} disabled={busy || unchanged}>
          <CheckIcon width={16} height={16} />
          <span>{busy ? "Saving…" : unchanged ? "Choose a different status" : "Save status change"}</span>
        </button>
      </div>
    </form>
  );
}
