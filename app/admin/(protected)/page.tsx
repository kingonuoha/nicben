import type { Metadata } from "next";
import Link from "next/link";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import type { Enquiry, EnquiryStatus } from "@/lib/data/types";
import { enquiryTypeLabel } from "@/lib/validation/enquiry-options";
import { AdminPageHeader, AdminSection, MetricCard } from "@/components/admin/AdminPageHeader";
import { deliveryLabel, deliveryNeedsAttention, deliveryShortLabel, deliveryState } from "@/components/admin/delivery";
import {
  ENQUIRY_STATUS_LABELS,
  enquiryStatusTone,
} from "@/components/admin/nav";
import { AlertIcon, ArrowRightIcon, CheckIcon, InboxIcon, NoteIcon } from "@/components/admin/icons";
import {
  EmptyNotice,
  Pill,
  TableShell,
  Td,
  Th,
  adminLinkButtonClass,
  formatTimestamp,
  formatTimestampCompact,
} from "@/components/admin/primitives";

/**
 * `/admin` — the dashboard.
 *
 * "New enquiries, recent activity" (`docs/01-sitemap-wireframes.md` §5).
 *
 * Every number on this page was read from the repository during this render. There
 * is no placeholder metric, no trend line, and no sparkline: the design screen's
 * KPI cards carry a "+3 this week" deltas chart, a `~$184,000` pipeline value, a
 * "92% Resolution Rate" and a "Q2 Target Met" badge, and **none of those four can
 * be computed from the data model** (`06` §19–24) — they are mock artefacts
 * (`decisions.md` D-008), and the pipeline figure in particular reads as revenue
 * the company has not reported. The card structure, the icon medallion and the
 * footer row are kept; the invented metrics are replaced with real reads or with a
 * link to the list that produced them.
 *
 * The mail-outage panel is D-021's whole point: an enquiry that was stored but not
 * delivered has to be visible without opening each record.
 */

export const metadata: Metadata = {
  title: "Dashboard | NICBEN admin",
};

/** What the delivery panel counts. Documented so the limit is not mistaken for "all". */
const DELIVERY_SCAN_LIMIT = 200;

export default async function AdminDashboardPage() {
  const session = await adminSession();
  const repository = await getEnquiryRepository();

  const [recentPage, newPage, contactedPage, quotedPage, closedPage, auditPage] = await Promise.all([
    repository.listEnquiries({ limit: DELIVERY_SCAN_LIMIT, cursor: null }),
    repository.listEnquiries({ status: "new", limit: 1, cursor: null }),
    repository.listEnquiries({ status: "contacted", limit: 1, cursor: null }),
    repository.listEnquiries({ status: "quoted", limit: 1, cursor: null }),
    repository.listEnquiries({ status: "closed", limit: 1, cursor: null }),
    repository.listAuditLog({ limit: 6, cursor: null }),
  ]);

  const statusCounts: Record<EnquiryStatus, number> = {
    new: newPage.total,
    contacted: contactedPage.total,
    quoted: quotedPage.total,
    closed: closedPage.total,
  };

  const scanned: Enquiry[] = recentPage.items;
  const undelivered = scanned.filter((enquiry) => deliveryNeedsAttention(deliveryState(enquiry.notification)));
  const unconfigured = scanned.filter(
    (enquiry) => deliveryState(enquiry.notification) === "not-configured",
  );
  const recentEnquiries = scanned.slice(0, 5);

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations console"
        title="Dashboard"
        description={`Signed in as ${session.email}. Every number below was read from the data store during this render.`}
        actions={
          <>
            <Link href="/admin/enquiries" className={adminLinkButtonClass("secondary")}>
              Enquiries
            </Link>
            <Link href="/admin/audit" className={adminLinkButtonClass("primary")}>
              Audit log
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </>
        }
      />

      {/* KPI row ----------------------------------------------------------- */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Awaiting first contact"
          value={statusCounts.new}
          icon={<InboxIcon />}
          footer={
            <>
              <span>Status “new”</span>
              <Link href="/admin/enquiries?status=new" className="font-semibold text-brand-700 hover:underline">
                Review
              </Link>
            </>
          }
        />
        <MetricCard
          label="Quoted"
          value={statusCounts.quoted}
          icon={<NoteIcon />}
          footer={
            <>
              <span>Status “quoted”</span>
              <Link href="/admin/enquiries?status=quoted" className="font-semibold text-brand-700 hover:underline">
                Review
              </Link>
            </>
          }
        />
        <MetricCard
          label="Closed"
          value={statusCounts.closed}
          icon={<CheckIcon />}
          footer={
            <>
              <span>Status “closed”</span>
              <Link href="/admin/enquiries?status=closed" className="font-semibold text-brand-700 hover:underline">
                Review
              </Link>
            </>
          }
        />
        <MetricCard
          tone="dark"
          label="Stored enquiries"
          value={recentPage.total}
          icon={<InboxIcon />}
          footer={
            <>
              <span>All statuses</span>
              <Link
                href="/admin/enquiries"
                className="font-semibold text-accent-400 hover:underline"
              >
                Open the table
              </Link>
            </>
          }
        />
      </div>

      {/* Delivery --------------------------------------------------------- */}
      <AdminSection
        title="Enquiry notifications"
        description={`Notification state for the ${scanned.length} most recent record${
          scanned.length === 1 ? "" : "s"
        } (the repository port reads one page at a time; this panel is not a collection-wide count).`}
      >
        {scanned.length === 0 ? (
          <EmptyNotice>
            No enquiries are stored yet. When one arrives it appears here with its notification state.
          </EmptyNotice>
        ) : (
          <div className="flex flex-col gap-3">
            {undelivered.length > 0 ? (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-sm border border-status-error/50 bg-status-error/10 px-4 py-3"
              >
                <p className="flex items-center gap-2 font-body text-sm font-semibold text-ink-950">
                  <AlertIcon width={16} height={16} className="text-status-error" />
                  {undelivered.length} enquir{undelivered.length === 1 ? "y" : "ies"} stored but not
                  delivered by email
                </p>
                <p className="font-body text-xs leading-relaxed text-text-600">
                  The sender was told their enquiry was received, so it will not be resubmitted. Open
                  each one and contact them directly.
                </p>
                <ul className="flex flex-col gap-1 pt-1">
                  {undelivered.slice(0, 5).map((enquiry) => (
                    <li key={enquiry.id} className="font-body text-xs">
                      <Link
                        href={`/admin/enquiries?enquiry=${encodeURIComponent(enquiry.id)}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {enquiry.name}
                      </Link>
                      <span className="text-text-600">
                        {" · "}
                        {formatTimestampCompact(enquiry.createdAt)}
                        {" · "}
                        {enquiry.notification.error ?? "no detail recorded"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-body text-sm text-text-600">
                No delivery failure is recorded on the scanned records.
              </p>
            )}

            {unconfigured.length > 0 ? (
              <div className="flex flex-col gap-1 rounded-sm border border-status-warning/50 bg-status-warning/10 px-4 py-3">
                <p className="font-body text-sm font-semibold text-ink-950">
                  Notifications are not configured on this deployment
                </p>
                <p className="font-body text-xs leading-relaxed text-text-600">
                  {unconfigured.length} of the scanned records were stored without a send attempt
                  (`notification.error` is <span className="font-semibold">not-configured</span>). The
                  enquiries are safe and complete; only the email was skipped.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </AdminSection>

      {/* Recent enquiries ------------------------------------------------- */}
      <AdminSection
        title="Recent enquiries"
        description="The five most recent records, newest first."
        action={
          <Link href="/admin/enquiries" className={adminLinkButtonClass("secondary", "sm")}>
            All enquiries
          </Link>
        }
      >
        {recentEnquiries.length === 0 ? (
          <EmptyNotice>Nothing has been submitted yet.</EmptyNotice>
        ) : (
          <TableShell>
            <caption className="sr-only">Five most recent enquiries</caption>
            <thead>
              <tr>
                <Th>Received</Th>
                <Th>Name</Th>
                <Th>Enquiry type</Th>
                <Th>Status</Th>
                <Th>Notification</Th>
                <Th align="right">Open</Th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.map((enquiry) => {
                const state = deliveryState(enquiry.notification);
                return (
                  <tr key={enquiry.id}>
                    <Td className="whitespace-nowrap text-xs text-text-600">
                      {formatTimestampCompact(enquiry.createdAt)}
                    </Td>
                    <Td>{enquiry.name}</Td>
                    <Td className="text-xs">
                      <Pill tone="neutral" wrap>
                        {enquiryTypeLabel(enquiry.enquiryType)}
                      </Pill>
                    </Td>
                    <Td>
                      <Pill tone={enquiryStatusTone(enquiry.status)}>
                        {ENQUIRY_STATUS_LABELS[enquiry.status]}
                      </Pill>
                    </Td>
                    <Td>
                      <Pill
                        tone={state === "failed" ? "error" : state === "delivered" ? "success" : "warning"}
                        title={deliveryLabel(state)}
                      >
                        {deliveryShortLabel(state)}
                      </Pill>
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <Link
                        href={`/admin/enquiries?enquiry=${encodeURIComponent(enquiry.id)}`}
                        className="font-body text-xs font-semibold uppercase tracking-wider text-brand-700 hover:underline"
                      >
                        View &amp; notes
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </AdminSection>

      {/* Recent activity --------------------------------------------------- */}
      <AdminSection
        title="Recent activity"
        description="The audit trail's newest entries: who did what, and when (`06` §39, §60)."
        action={
          <Link href="/admin/audit" className={adminLinkButtonClass("secondary", "sm")}>
            Full log
          </Link>
        }
      >
        {auditPage.items.length === 0 ? (
          <EmptyNotice>No audited action has been recorded yet.</EmptyNotice>
        ) : (
          <TableShell>
            <caption className="sr-only">Most recent audit entries</caption>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Resource</Th>
              </tr>
            </thead>
            <tbody>
              {auditPage.items.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap text-xs text-text-600">
                    {formatTimestamp(entry.createdAt)}
                  </Td>
                  <Td className="text-xs">{entry.actorEmail ?? "system"}</Td>
                  <Td className="text-xs">{entry.action}</Td>
                  <Td className="text-xs text-text-600">
                    {entry.resourceType}
                    {entry.resourceId ? ` · ${entry.resourceId}` : ""}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </AdminSection>
    </>
  );
}
