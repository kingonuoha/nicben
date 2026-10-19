/**
 * `GET /api/admin/enquiries` — the enquiry list. Session-guarded (`401` unauthenticated).
 *
 * Reads only. `decisions.md` D-021's notification-failure flag travels on each record
 * (`Enquiry.notification`) so the portal can surface a mail outage on the affected
 * enquiry; nothing here writes to the Phase 05 pipeline.
 *
 * `GET /api/admin/enquiries?status=…&limit=…&cursor=…`
 */

import type { NextRequest } from "next/server";

import { adminApiRoute, jsonOk, validateBody } from "@/lib/admin/api";
import { enquiryListQuerySchema } from "@/lib/validation/admin";
import { ENQUIRY_STATUS_VALUES } from "@/lib/data/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const query = validateBody(enquiryListQuerySchema, {
      status: api.searchParams.get("status") ?? undefined,
      limit: api.searchParams.get("limit") ?? undefined,
      cursor: api.searchParams.get("cursor") ?? undefined,
    });
    if (!query.ok) return query.response;

    const page = await api.repository.listEnquiries({
      ...(query.data.status === undefined ? {} : { status: query.data.status }),
      ...(query.data.limit === undefined ? {} : { limit: query.data.limit }),
      cursor: query.data.cursor ?? null,
    });

    // A new-enquiry count for the dashboard header, computed from the same read rather
    // than a second query the portal would have to trust separately.
    const newCount = await api.repository
      .listEnquiries({ status: "new", limit: 1 })
      .then((result) => result.total);

    return jsonOk({
      items: page.items,
      total: page.total,
      nextCursor: page.nextCursor,
      /** `new` only. The dashboard's headline number. */
      newCount,
      statuses: ENQUIRY_STATUS_VALUES,
      adapter: api.repository.kind,
    });
  });
}
