import type { Metadata } from "next";
import Link from "next/link";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import { ENQUIRY_STATUS_VALUES, type EnquiryStatus } from "@/lib/data/types";
import { enquiryTypeLabel } from "@/lib/validation/enquiry-options";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/contract";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EnquiryDrawer } from "@/components/admin/EnquiryDrawer";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { deliveryLabel, deliveryNeedsAttention, deliveryShortLabel, deliveryState } from "@/components/admin/delivery";
import { ENQUIRY_STATUS_LABELS, enquiryStatusTone } from "@/components/admin/nav";
import { AlertIcon, ArrowRightIcon } from "@/components/admin/icons";
import {
  EmptyNotice,
  Pill,
  TableShell,
  Td,
  Th,
  adminButtonClass,
  adminLinkButtonClass,
  formatTimestamp,
  formatTimestampCompact,
} from "@/components/admin/primitives";

/**
 * `/admin/enquiries` — the table, the filters, the detail overlay and the export.
 *
 * "Enquiries: table with type, status (`new, contacted, quoted, closed`), detail
 * view, notes, CSV export" (`docs/tasks/phase-06-hidden-admin-portal/brief.md` §5.3).
 *
 * ### The detail view is a URL, not local state
 *
 * The design's drawer is opened by a click. Here it is `?enquiry=<id>`: the server
 * reads the record and renders the overlay, so the drawer has the same URL, the
 * same history entry and the same server-side session check as every other view —
 * and it works with JavaScript unavailable. Closing it is a link, Escape is handled
 * by the overlay's own client component.
 *
 * ### Search parameters are re-validated here
 *
 * `status` is checked against `ENQUIRY_STATUS_VALUES` and anything else is treated
 * as "all statuses" rather than passed to the port. The API route validates its own
 * query string with a Zod schema; this page reads the port directly, so it does the
 * same check itself instead of assuming a caller is honest. `cursor` is opaque and
 * is only ever handed back to the adapter that produced it.
 *
 * ### Counts
 *
 * The filter pills carry real counts, one `total` read per status. On the dev
 * adapter that is in-memory; on MongoDB it is a count per status. Five reads per
 * render for a single-operator portal is the correct trade for a pill row that
 * cannot lie about the queue.
 */

export const metadata: Metadata = {
  title: "Enquiries | NICBEN admin",
};

const PAGE_SIZE = 25;

interface EnquiriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseStatus(value: string | undefined): EnquiryStatus | undefined {
  if (!value) return undefined;
  return (ENQUIRY_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as EnquiryStatus)
    : undefined;
}

function buildHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `/admin/enquiries?${query}` : "/admin/enquiries";
}

export default async function AdminEnquiriesPage({ searchParams }: EnquiriesPageProps) {
  // The page's own guard. `app/admin/(protected)/layout.tsx` has already run the
  // same check for this request; `adminSession()` memoises it, so this costs a
  // session read rather than a second one (`docs/06-tech-and-security-spec.md` §27).
  await adminSession();

  const params = await searchParams;
  const rawStatus = firstValue(params.status);
  const status = parseStatus(rawStatus);
  const cursor = firstValue(params.cursor);
  const selectedId = firstValue(params.enquiry);

  const repository = await getEnquiryRepository();

  const [page, newCount, contactedCount, quotedCount, closedCount] = await Promise.all([
    repository.listEnquiries({ limit: PAGE_SIZE, cursor: cursor ?? null, ...(status ? { status } : {}) }),
    repository.listEnquiries({ status: "new", limit: 1, cursor: null }),
    repository.listEnquiries({ status: "contacted", limit: 1, cursor: null }),
    repository.listEnquiries({ status: "quoted", limit: 1, cursor: null }),
    repository.listEnquiries({ status: "closed", limit: 1, cursor: null }),
  ]);

  const counts: Record<EnquiryStatus, number> = {
    new: newCount.total,
    contacted: contactedCount.total,
    quoted: quotedCount.total,
    closed: closedCount.total,
  };
  const allCount = counts.new + counts.contacted + counts.quoted + counts.closed;

  // The overlay's record. A well-formed but unknown id resolves to `null` from the
  // port and is reported as not found rather than as an error.
  const selected = selectedId ? await repository.getEnquiry(selectedId) : null;

  // Closing the drawer returns to the current filter, without the `?enquiry=`.
  const closeHref = buildHref({ status: rawStatus, cursor });

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations console"
        title="Enquiries &amp; lead management"
        description="Every inbound enquiry, newest first. Status changes and notes are attributed to your account in the audit log."
        actions={
          <ExportCsvButton
            {...(status ? { status } : {})}
            label={status ? `Export “${ENQUIRY_STATUS_LABELS[status]}” to CSV` : "Export all to CSV"}
          />
        }
      />

      {/* Filters ----------------------------------------------------------- */}
      <section className="mb-6 flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
            Filter by status
          </span>
          <ul className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={buildHref({})}
                aria-current={status === undefined ? "true" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                  status === undefined
                    ? "bg-ink-950 text-surface"
                    : "bg-tint-100 text-text-600 hover:text-ink-950"
                }`}
              >
                All statuses ({allCount})
              </Link>
            </li>
            {ENQUIRY_STATUS_VALUES.map((value) => (
              <li key={value}>
                <Link
                  href={buildHref({ status: value })}
                  aria-current={status === value ? "true" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                    status === value
                      ? "bg-ink-950 text-surface"
                      : "bg-tint-100 text-text-600 hover:text-ink-950"
                  }`}
                >
                  {ENQUIRY_STATUS_LABELS[value]} ({counts[value]})
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-body text-xs leading-relaxed text-text-600">
          Filtering happens on the server: each filter is its own URL, so a filtered view can be
          bookmarked or reloaded without losing it. The export honours the status filter and is
          generated on the server with every field escaped.
        </p>
      </section>

      {/* Table ------------------------------------------------------------- */}
      <section className="mb-6 overflow-hidden rounded-md border border-line bg-surface shadow-card">
        {page.items.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyNotice>
              {status
                ? `No enquiry currently has the status “${ENQUIRY_STATUS_LABELS[status]}”.`
                : "No enquiry has been submitted yet."}
            </EmptyNotice>
          </div>
        ) : (
          <TableShell>
            <caption className="sr-only">
              Inbound enquiries{status ? ` filtered to ${ENQUIRY_STATUS_LABELS[status]}` : ""}
            </caption>
            <thead>
              <tr>
                <Th>Date / time</Th>
                <Th>Client &amp; contact</Th>
                <Th>Enquiry category</Th>
                <Th>Location / market</Th>
                <Th>Scope summary</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((enquiry) => {
                const state = deliveryState(enquiry.notification);
                return (
                  <tr key={enquiry.id} className="align-top">
                    {/*
                      No `whitespace-nowrap` here: the timestamp is allowed to wrap,
                      which is what lets the seven-column ledger fit the content column
                      at 1440px instead of pushing the actions header and the delivery
                      note past the panel edge (measured: table 1,151px against a
                      1,110px column before, 1,0xx after).
                    */}
                    <Td>
                      <span className="block font-body text-xs font-semibold text-ink-950">
                        {formatTimestampCompact(enquiry.createdAt)}
                      </span>
                      <span className="block break-all font-body text-[11px] text-text-600 tabular-nums">
                        {enquiry.id}
                      </span>
                    </Td>
                    <Td>
                      <span className="block font-body text-sm font-semibold text-ink-950">
                        {enquiry.name}
                      </span>
                      <span className="block break-all font-body text-xs text-text-600">
                        {enquiry.email}
                      </span>
                      {enquiry.phone ? (
                        <span className="block font-body text-xs text-text-600">{enquiry.phone}</span>
                      ) : null}
                    </Td>
                    <Td>
                      <Pill tone="neutral" wrap>
                        {enquiryTypeLabel(enquiry.enquiryType)}
                      </Pill>
                    </Td>
                    <Td className="text-xs">
                      {enquiry.location ? enquiry.location : <span className="text-text-600">—</span>}
                    </Td>
                    <Td className="max-w-xs">
                      <span className="block whitespace-pre-line font-body text-xs leading-relaxed text-text-900">
                        {enquiry.message.length > 180
                          ? `${enquiry.message.slice(0, 180)}…`
                          : enquiry.message}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Pill tone={enquiryStatusTone(enquiry.status)}>
                        {ENQUIRY_STATUS_LABELS[enquiry.status]}
                      </Pill>
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <span className="flex flex-col items-end gap-2">
                        <Link
                          href={buildHref({
                            status: rawStatus,
                            cursor,
                            enquiry: enquiry.id,
                          })}
                          className={adminLinkButtonClass("secondary", "sm")}
                        >
                          <span>View &amp; notes</span>
                          <ArrowRightIcon width={14} height={14} />
                        </Link>
                        {/*
                          D-021: a notification that did not go out is not silent. Every
                          state except "delivered" gets a chip, because a deployment with
                          no mail credentials is the case where *no* enquiry reaches the
                          inbox — the most important one to see in the table.
                        */}
                        {state !== "delivered" ? (
                          <span
                            title={deliveryLabel(state)}
                            className={`inline-flex items-center gap-1 font-body text-[11px] font-semibold uppercase tracking-wider ${
                              deliveryNeedsAttention(state) ? "text-status-error" : "text-status-warning"
                            }`}
                          >
                            <AlertIcon width={13} height={13} />
                            {deliveryShortLabel(state)}
                          </span>
                        ) : null}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}

        {/* Pagination footer ---------------------------------------------- */}
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-body text-xs text-text-600">
            {page.items.length === 0 ? (
              <>
                Showing <span className="font-semibold text-ink-950">0</span> of{" "}
                <span className="font-semibold text-ink-950">{page.total}</span> matching enquiries
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-ink-950">{page.items.length}</span> of{" "}
                <span className="font-semibold text-ink-950">{page.total}</span> matching enquiries
                {cursor ? " (continued from a cursor)" : ""}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {cursor ? (
              <Link href={buildHref({ status: rawStatus })} className={adminButtonClass("secondary", "sm")}>
                Back to the first page
              </Link>
            ) : null}
            {page.nextCursor ? (
              <Link
                href={buildHref({ status: rawStatus, cursor: page.nextCursor })}
                className={adminButtonClass("primary", "sm")}
              >
                Next page
                <ArrowRightIcon width={14} height={14} />
              </Link>
            ) : (
              <span className="font-body text-[11px] uppercase tracking-wider text-text-600">
                End of results
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Detail overlay ----------------------------------------------------- */}
      {selectedId && !selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-md border border-line bg-surface p-4 shadow-float sm:p-6">
            <h2 className="font-heading text-lg font-bold text-ink-950">Enquiry not found</h2>
            <p className="pt-2 font-body text-sm text-text-600">
              No record carries the id <span className="tabular-nums">{selectedId}</span>. It may have
              been removed from the store, or the link may be mistyped.
            </p>
            <div className="pt-4">
              <Link href={closeHref} className={adminButtonClass("primary", "sm")}>
                Back to the table
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <EnquiryDrawer
          enquiry={selected}
          typeLabel={enquiryTypeLabel(selected.enquiryType)}
          closeHref={closeHref}
          statuses={ENQUIRY_STATUS_VALUES}
          loginRedirectHref={ADMIN_LOGIN_PATH}
        />
      ) : null}
    </>
  );
}
