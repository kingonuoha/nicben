"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Enquiry } from "@/lib/data/types";
import { deliveryLabel, deliveryNeedsAttention, deliveryState } from "@/components/admin/delivery";
import { EnquiryNoteForm } from "@/components/admin/EnquiryNoteForm";
import { EnquiryStatusForm } from "@/components/admin/EnquiryStatusForm";
import { CloseIcon, DownloadIcon } from "@/components/admin/icons";
import {
  DetailItem,
  Pill,
  Notice,
  adminButtonClass,
  formatBytes,
  formatTimestamp,
  initialsOf,
} from "@/components/admin/primitives";
import { ENQUIRY_STATUS_LABELS, enquiryStatusTone } from "@/components/admin/nav";

/**
 * The enquiry detail overlay.
 *
 * Structure follows the design screen's slide-over drawer: header with the record's
 * identifier and status, a client card, the selected discipline, the original
 * message, an attachments deck, an internal notes trail with an input, and a
 * pinned action dock. Content is entirely from the stored record.
 *
 * ### What was replaced, and why
 *
 * | Design element                       | What is rendered instead                                        |
 * |--------------------------------------|-----------------------------------------------------------------|
 * | `#ENQ-2025-089`, `Intake ID: SOS-TX-88219` | the record's real id and real timestamps                |
 * | "Commercial Property Portfolio Director"   | omitted — the model stores no job title                 |
 * | "Verified Corp Rep" badge                  | "Consent recorded" + the real consent timestamp          |
 * | "Target Start Date"                        | omitted — not a field in `06` §19                        |
 * | "High Priority" (fixed)                    | the real notification state                              |
 * | "Scanned & Cleared" attachments            | "metadata only — stored privately" (see below)           |
 * | "Assign Contractor"                        | omitted — there is no contractor model                   |
 * | "Update Status to Quoted"                  | a real status control over all four statuses             |
 *
 * Every string above with no source is a mock artefact (`decisions.md` D-008), and
 * two of them are worse than decoration: "Scanned & Cleared" asserts a malware scan
 * that does not exist, and a fixed "High Priority" tells the operator something the
 * data does not support.
 *
 * ### Attachments are listed, not served
 *
 * `Enquiry.attachments` carries a display name, a private storage key, a magic-byte
 * content type and a size. The portal shows the metadata and states plainly that the
 * bytes are not downloadable from here — the backend deliberately shipped no
 * attachment-read route, because that would be a new authorisation surface
 * (`docs/tasks/phase-06-hidden-admin-portal/backend-notes.md` §7.8). A download icon
 * that 404s would be worse than a caption that is true.
 *
 * ### Accessibility
 *
 * `role="dialog"` + `aria-modal`, the panel takes focus on open, Escape closes, the
 * backdrop is a real link so closing works without JavaScript, and body scroll is
 * locked while it is open and restored on unmount.
 */

export interface EnquiryDrawerProps {
  enquiry: Enquiry;
  /** The deck-sourced label for this enquiry's type, supplied by the server. */
  typeLabel: string;
  /** The list URL without the `?enquiry=` parameter. */
  closeHref: string;
  /** The four statuses, from the server. */
  statuses: readonly Enquiry["status"][];
  loginRedirectHref: string;
}

export function EnquiryDrawer({
  enquiry,
  typeLabel,
  closeHref,
  statuses,
  loginRedirectHref,
}: EnquiryDrawerProps) {
  const router = useRouter();
  const closeRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const state = deliveryState(enquiry.notification);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        router.push(closeHref);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeHref, router]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink-950/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-drawer-title"
    >
      {/* Backdrop: a link, so closing works with JavaScript unavailable. */}
      <Link
        href={closeHref}
        className="hidden flex-1 cursor-default sm:block"
        aria-label="Close enquiry detail"
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-surface shadow-float"
      >
        {/* Header --------------------------------------------------------- */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-tint-50 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="enquiry-drawer-title"
                className="font-heading text-lg font-bold tracking-tight text-ink-950"
              >
                Enquiry
              </h2>
              <Pill tone={enquiryStatusTone(enquiry.status)}>
                {ENQUIRY_STATUS_LABELS[enquiry.status]}
              </Pill>
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-text-600">
              <span className="tabular-nums">{enquiry.id}</span>
              <span aria-hidden="true" className="text-line">
                /
              </span>
              <span>Received {formatTimestamp(enquiry.createdAt)}</span>
              <span aria-hidden="true" className="text-line">
                /
              </span>
              <span>Updated {formatTimestamp(enquiry.updatedAt)}</span>
            </p>
          </div>

          <Link
            ref={closeRef}
            href={closeHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint-100 text-text-900 transition-colors hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            aria-label="Close enquiry detail"
          >
            <CloseIcon width={18} height={18} />
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-4 py-5 sm:px-6">
          {/* Client card --------------------------------------------------- */}
          <section className="flex flex-col gap-4 rounded-md border border-line bg-tint-50 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink-950 font-heading text-base font-extrabold text-surface"
                  aria-hidden="true"
                >
                  {initialsOf(enquiry.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-bold text-ink-950">{enquiry.name}</p>
                  <p className="truncate font-body text-xs text-text-600">{enquiry.email}</p>
                </div>
              </div>
              <Pill tone="neutral">Consent recorded</Pill>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Email address">{enquiry.email}</DetailItem>
              <DetailItem label="Contact number">
                {enquiry.phone ? enquiry.phone : <span className="text-text-600">Not given</span>}
              </DetailItem>
              <DetailItem label="Location / market">
                {enquiry.location ? enquiry.location : <span className="text-text-600">Not given</span>}
              </DetailItem>
              <DetailItem label="Privacy consent">{formatTimestamp(enquiry.consentAt)}</DetailItem>
            </div>
            {/*
              The design links the address and the number as `mailto:` and `tel:`.
              The portal renders them as selectable text instead: `decisions.md` D-012
              forbids a `mailto:`/`tel:` until the client confirms the public contact
              details, and while this is an internal surface rather than a public
              one, the two values here are the sender's, not the company's. Reported
              in the completion notes as a deliberate omission.
            */}
          </section>

          {/* Enquiry type + notification state ----------------------------- */}
          <section className="flex flex-col gap-2">
            <h3 className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
              Selected discipline
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-tint-100 px-4 py-3">
              <span className="font-heading text-sm font-bold text-ink-950">{typeLabel}</span>
              <Pill
                tone={state === "failed" ? "error" : state === "delivered" ? "success" : "warning"}
                title={enquiry.notification.error ?? undefined}
              >
                {deliveryLabel(state)}
              </Pill>
            </div>
            {deliveryNeedsAttention(state) ? (
              <Notice tone="error" title="The notification email was not delivered">
                <p>
                  The sender saw the success card, so this enquiry will not be resubmitted. Reference:{" "}
                  <span className="font-semibold">
                    {enquiry.notification.error ?? "no detail recorded"}
                  </span>
                  {enquiry.notification.attemptedAt
                    ? ` · attempted ${formatTimestamp(enquiry.notification.attemptedAt)}`
                    : ""}
                </p>
              </Notice>
            ) : null}
            {state === "not-configured" ? (
              <Notice tone="warning" title="Email notifications were not configured">
                <p>
                  No send was attempted when this enquiry was stored, because the deployment has no mail
                  credentials. The record itself is complete; the notification is the only part missing.
                </p>
              </Notice>
            ) : null}
            {state === "not-attempted" ? (
              <Notice tone="warning" title="No send attempt is recorded">
                <p>Notifications are configured, but this record carries no attempt timestamp.</p>
              </Notice>
            ) : null}
          </section>

          {/* Message ------------------------------------------------------- */}
          <section className="flex flex-col gap-2">
            <h3 className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
              Original enquiry message
            </h3>
            {/*
              Rendered as text, never as markup: React escapes it, and there is no
              `dangerouslySetInnerHTML` anywhere in the portal. `whitespace-pre-line`
              preserves the paragraphs the sender typed.
            */}
            <p className="whitespace-pre-line rounded-sm border border-line bg-tint-50 px-4 py-4 font-body text-sm leading-relaxed text-text-900">
              {enquiry.message}
            </p>
          </section>

          {/* Attachments --------------------------------------------------- */}
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
                Submitted attachments ({enquiry.attachments.length})
              </h3>
              <span className="font-body text-[11px] uppercase tracking-wider text-text-600">
                Metadata only
              </span>
            </div>
            {enquiry.attachments.length === 0 ? (
              <p className="rounded-sm border border-dashed border-line bg-tint-50 px-4 py-4 font-body text-xs text-text-600">
                Nothing was attached to this enquiry.
              </p>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {enquiry.attachments.map((attachment, index) => (
                    <li
                      key={`${attachment.storageKey}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-sm border border-line bg-tint-50 px-3 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-body text-xs font-semibold text-ink-950">
                          {attachment.name}
                        </span>
                        <span className="block font-body text-[11px] text-text-600">
                          {attachment.contentType} · {formatBytes(attachment.sizeBytes)}
                        </span>
                      </span>
                      <DownloadIcon
                        width={16}
                        height={16}
                        className="shrink-0 text-line"
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
                <p className="font-body text-xs leading-relaxed text-text-600">
                  Files are held in private storage and are deliberately not served by this portal. The
                  stored key is retained with the record for retrieval by the approved process.
                </p>
              </>
            )}
          </section>

          {/* Notes --------------------------------------------------------- */}
          <section className="flex flex-col gap-3">
            <h3 className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
              Internal notes ({enquiry.notes.length})
            </h3>
            {enquiry.notes.length === 0 ? (
              <p className="rounded-sm border border-dashed border-line bg-tint-50 px-4 py-4 font-body text-xs text-text-600">
                No note has been recorded on this enquiry yet.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {enquiry.notes.map((note) => (
                  <li key={note.id} className="rounded-sm border border-line bg-tint-50 px-4 py-3">
                    <p className="font-body text-[11px] uppercase tracking-wider text-text-600">
                      {formatTimestamp(note.createdAt)} ·{" "}
                      {note.authorId === null ? "system" : "administrator"}
                    </p>
                    <p className="whitespace-pre-line pt-1 font-body text-sm leading-relaxed text-text-900">
                      {note.body}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            <EnquiryNoteForm enquiryId={enquiry.id} loginRedirectHref={loginRedirectHref} />
          </section>
        </div>

        {/* Action dock ----------------------------------------------------- */}
        <div className="sticky bottom-0 z-10 border-t border-line bg-tint-50 px-4 py-4 sm:px-6">
          <EnquiryStatusForm
            enquiry={enquiry}
            statuses={statuses}
            loginRedirectHref={loginRedirectHref}
          />
          <p className="pt-3 font-body text-xs leading-relaxed text-text-600">
            Every status change and note is written to the audit log with your account and the time.
            Enquiries cannot be deleted from the portal — close them instead.
          </p>
        </div>
      </div>
    </div>
  );
}
