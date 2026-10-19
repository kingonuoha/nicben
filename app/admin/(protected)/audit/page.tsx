import type { Metadata } from "next";
import Link from "next/link";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import {
  AUDIT_ACTION_VALUES,
  AUDIT_RESOURCE_TYPE_VALUES,
  type AuditAction,
  type AuditResourceType,
} from "@/lib/data/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ArrowRightIcon } from "@/components/admin/icons";
import {
  EmptyNotice,
  Pill,
  TableShell,
  Td,
  Th,
  adminButtonClass,
  formatTimestamp,
} from "@/components/admin/primitives";

/**
 * `/admin/audit` — the audit log.
 *
 * `docs/06-tech-and-security-spec.md` §39 ("Admin actions logged (who, what,
 * when)") and §60 ("Log admin logins, failed logins, enquiry status changes and
 * content edits").
 *
 * ### Read-only by construction, not by permission
 *
 * The port exposes `appendAuditLog` and `listAuditLog` and nothing that can modify
 * or delete an entry (`lib/data/repository.ts`), and the route exports only `GET`
 * (`app/api/admin/audit/route.ts` answers a guarded `405` for anything else). This
 * screen is therefore a view over an append-only store: there is no edit control to
 * omit because there is no edit path to call. A trail an operator can edit is not a
 * trail.
 *
 * ### What is shown, and what is deliberately not
 *
 * Shown: the time, the actor (denormalised at write time so the trail survives the
 * account being removed), the action, the resource, the shortened network pseudonym
 * and the length-capped client string, plus the bounded detail payload.
 *
 * Not shown: anything the writer refuses to store. `lib/audit/log.ts` keeps only
 * primitives and references, so a message body, a password hash or a nested record
 * cannot be read back out of this table even if a future call site tried to write
 * one. The cell below renders whatever survived that bound, verbatim.
 */

export const metadata: Metadata = {
  title: "Audit log | NICBEN admin",
};

const PAGE_SIZE = 25;

interface AuditPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseAction(value: string | undefined): AuditAction | undefined {
  if (!value) return undefined;
  return (AUDIT_ACTION_VALUES as readonly string[]).includes(value) ? (value as AuditAction) : undefined;
}

function parseResourceType(value: string | undefined): AuditResourceType | undefined {
  if (!value) return undefined;
  return (AUDIT_RESOURCE_TYPE_VALUES as readonly string[]).includes(value)
    ? (value as AuditResourceType)
    : undefined;
}

function buildHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `/admin/audit?${query}` : "/admin/audit";
}

/** `{ before: "new", after: "quoted" }` → `before=new · after=quoted`. */
function describeMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}=${value === null ? "null" : String(value)}`).join(" · ");
}

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  await adminSession();

  const params = await searchParams;
  const rawAction = firstValue(params.action);
  const rawResourceType = firstValue(params.resourceType);
  const action = parseAction(rawAction);
  const resourceType = parseResourceType(rawResourceType);
  const cursor = firstValue(params.cursor);

  const repository = await getEnquiryRepository();
  const page = await repository.listAuditLog({
    limit: PAGE_SIZE,
    cursor: cursor ?? null,
    ...(action ? { action } : {}),
    ...(resourceType ? { resourceType } : {}),
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Governance & audit"
        title="Audit log"
        description="Append-only. Sign-ins, sign-outs, failed sign-ins, status changes and content edits are written with the acting account and the time; nothing in the portal can modify or delete an entry."
      />

      {/* Filters ----------------------------------------------------------- */}
      <section className="mb-6 flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-2">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
            Action
          </span>
          <ul className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={buildHref({ resourceType: rawResourceType })}
                aria-current={action === undefined ? "true" : undefined}
                className={`inline-flex items-center rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                  action === undefined ? "bg-ink-950 text-surface" : "bg-tint-100 text-text-600 hover:text-ink-950"
                }`}
              >
                All actions
              </Link>
            </li>
            {AUDIT_ACTION_VALUES.map((value) => (
              <li key={value}>
                <Link
                  href={buildHref({ action: value, resourceType: rawResourceType })}
                  aria-current={action === value ? "true" : undefined}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                    action === value ? "bg-ink-950 text-surface" : "bg-tint-100 text-text-600 hover:text-ink-950"
                  }`}
                >
                  {value}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
            Resource type
          </span>
          <ul className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={buildHref({ action: rawAction })}
                aria-current={resourceType === undefined ? "true" : undefined}
                className={`inline-flex items-center rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                  resourceType === undefined
                    ? "bg-ink-950 text-surface"
                    : "bg-tint-100 text-text-600 hover:text-ink-950"
                }`}
              >
                All resources
              </Link>
            </li>
            {AUDIT_RESOURCE_TYPE_VALUES.map((value) => (
              <li key={value}>
                <Link
                  href={buildHref({ action: rawAction, resourceType: value })}
                  aria-current={resourceType === value ? "true" : undefined}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                    resourceType === value ? "bg-ink-950 text-surface" : "bg-tint-100 text-text-600 hover:text-ink-950"
                  }`}
                >
                  {value}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {action || resourceType ? (
          <div>
            <Link href="/admin/audit" className={adminButtonClass("secondary", "sm")}>
              Clear filters
            </Link>
          </div>
        ) : null}
      </section>

      {/* Trail ------------------------------------------------------------- */}
      <section className="mb-6 overflow-hidden rounded-md border border-line bg-surface shadow-card">
        {page.items.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyNotice>
              No audit entry matches this filter. An empty trail is the state of a deployment nothing
              has happened on yet — not a fault.
            </EmptyNotice>
          </div>
        ) : (
          <TableShell>
            <caption className="sr-only">Audit trail, newest first</caption>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Resource</Th>
                <Th>Client</Th>
                <Th>Detail</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap text-xs">{formatTimestamp(entry.createdAt)}</Td>
                  <Td className="text-xs">
                    {entry.actorEmail ?? <span className="text-text-600">system</span>}
                    {entry.adminId ? (
                      <span className="block break-all text-[11px] text-text-600 tabular-nums">
                        {entry.adminId}
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    <Pill tone={entry.action === "login-failure" ? "error" : "neutral"}>
                      {entry.action}
                    </Pill>
                  </Td>
                  <Td className="text-xs">
                    {entry.resourceType}
                    {entry.resourceId ? (
                      <span className="block break-all text-[11px] text-text-600 tabular-nums">
                        {entry.resourceId}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="text-xs text-text-600">
                    {entry.ipHash ? (
                      <span className="block break-all tabular-nums" title="Pseudonym, never the raw address">
                        {entry.ipHash.slice(0, 12)}…
                      </span>
                    ) : (
                      <span>no address</span>
                    )}
                    {entry.userAgent ? (
                      <span className="block max-w-[16rem] truncate" title={entry.userAgent}>
                        {entry.userAgent}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="max-w-sm break-words text-[11px] text-text-600">
                    {describeMetadata(entry.metadata)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}

        <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-body text-xs text-text-600">
            Showing <span className="font-semibold text-ink-950">{page.items.length}</span> of{" "}
            <span className="font-semibold text-ink-950">{page.total}</span> matching entries
            {cursor ? " (continued from a cursor)" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {cursor ? (
              <Link
                href={buildHref({ action: rawAction, resourceType: rawResourceType })}
                className={adminButtonClass("secondary", "sm")}
              >
                Back to the first page
              </Link>
            ) : null}
            {page.nextCursor ? (
              <Link
                href={buildHref({
                  action: rawAction,
                  resourceType: rawResourceType,
                  cursor: page.nextCursor,
                })}
                className={adminButtonClass("primary", "sm")}
              >
                Older entries
                <ArrowRightIcon width={14} height={14} />
              </Link>
            ) : (
              <span className="font-body text-[11px] uppercase tracking-wider text-text-600">
                End of the trail
              </span>
            )}
          </div>
        </div>
      </section>

      <p className="font-body text-xs leading-relaxed text-text-600">
        A failed sign-in is recorded identically whether the address exists or not, and the addresses
        shown are truncated SHA-256 pseudonyms — the portal never stores an IP address in the clear
        (`06` §42).
      </p>
    </>
  );
}
