/**
 * `GET /api/admin/enquiries/export` — the server-generated CSV. Session-guarded.
 *
 * ### Why it is a route and not a `Blob` in the browser
 *
 * The export contains personal data the portal already displays, and the requirement is
 * that the **file** be generated with escaping applied (`lib/admin/csv.ts`). Building it
 * in the browser would mean shipping every row to the client twice and trusting a client
 * library to escape correctly. Generating it here means one implementation, applied once,
 * where the data already is.
 *
 * ### Escaping
 *
 * `toCsv` neutralises a leading `=`, `+`, `-`, `@`, tab or carriage return — the values a
 * spreadsheet evaluates as a formula — and applies RFC 4180 quoting for commas, quotes,
 * newlines and surrounding whitespace. The enquiry `message` field is written by an
 * **unauthenticated member of the public**, so the formula path is a real route from a
 * stranger to code execution on the operator's desktop; it is the reason the export is
 * not simply `rows.join(",")`.
 *
 * The route is a `GET`, so it needs no CSRF token; it is still session-guarded, which is
 * what stops the export being the one admin endpoint that leaks personal data.
 */

import type { NextRequest } from "next/server";

import { adminApiRoute, jsonInvalid, validateBody } from "@/lib/admin/api";
import { CSV_RECORD_SEPARATOR, csvResponse, toCsv } from "@/lib/admin/csv";
import { logServerEvent } from "@/lib/log/server-log";
import { enquiryExportQuerySchema } from "@/lib/validation/admin";
import type { Enquiry } from "@/lib/data/types";

export const runtime = "nodejs";

/** Header row. Stable names so a spreadsheet column mapping does not break between exports. */
const CSV_COLUMNS = [
  "id",
  "createdAt",
  "updatedAt",
  "status",
  "enquiryType",
  "name",
  "email",
  "phone",
  "location",
  "message",
  "attachmentCount",
  "attachmentKeys",
  "consentAt",
  "notificationDelivered",
  "notificationError",
  "notes",
] as const;

/** One record as CSV cells. Every value is passed through `escapeCsvValue` by `toCsv`. */
function toRow(enquiry: Enquiry): string[] {
  return [
    enquiry.id,
    enquiry.createdAt,
    enquiry.updatedAt,
    enquiry.status,
    enquiry.enquiryType,
    enquiry.name,
    enquiry.email,
    enquiry.phone ?? "",
    enquiry.location ?? "",
    enquiry.message,
    String(enquiry.attachments.length),
    // Storage keys, never URLs: `06` §57 requires attachments to be unreachable from a
    // public address, so the export must not hand out one.
    enquiry.attachments.map((attachment) => attachment.storageKey).join(" "),
    enquiry.consentAt,
    String(enquiry.notification.delivered),
    enquiry.notification.error ?? "",
    String(enquiry.notes.length),
  ];
}

/** `%Y-%m-%dT%H%M%SZ`, filesystem-safe and sortable. No user input contributes to it. */
function exportFilename(now: Date): string {
  return `nicben-enquiries-${now.toISOString().replace(/[:.]/g, "-").replace(/-\d{3}Z$/, "Z")}.csv`;
}

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const query = validateBody(enquiryExportQuerySchema, {
        status: api.searchParams.get("status") ?? undefined,
      });
      if (!query.ok) return query.response;

      const repository = api.repository;
      const filter = query.data.status === undefined ? {} : { status: query.data.status };

      // One page size, bounded by the adapter's own ceiling (`lib/data/adapters/*`). A
      // larger export is a deliberate future change, not an unbounded read.
      const page = await repository.listEnquiries({ ...filter, limit: 200 });

      const rows: string[][] = [Array.from(CSV_COLUMNS), ...page.items.map(toRow)];
      const csv = toCsv(rows);
      const filename = exportFilename(new Date());

      logServerEvent({
        scope: "admin-api",
        event: "enquiry_export",
        level: "info",
        data: {
          actor: api.session.adminId,
          rows: page.items.length,
          total: page.total,
          truncated: page.nextCursor !== null,
          escapedRecords: page.items.length,
        },
      });

      if (page.nextCursor !== null) {
        // Documented rather than silent: the export is the most recent page, not the
        // whole collection. A streaming export belongs in its own change.
        logServerEvent({
          scope: "admin-api",
          event: "enquiry_export_truncated",
          level: "warn",
          data: { returned: page.items.length, total: page.total, separator: JSON.stringify(CSV_RECORD_SEPARATOR) },
        });
      }

      return csvResponse(csv, filename);
    },
    { csrf: false, body: false },
  );
}

/** `POST` is not a supported export. Guarded so an unauthenticated probe still receives `401`. */
export async function POST(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    () => jsonInvalid([], "Use GET to download the export."),
    { csrf: false, body: false },
  );
}
