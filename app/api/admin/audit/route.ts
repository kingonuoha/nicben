/**
 * `GET /api/admin/audit` — the audit trail. Session-guarded (`401` unauthenticated).
 *
 * Read-only by design, and read-only by construction: the port exposes `appendAuditLog` and
 * `listAuditLog` and **nothing** that can modify or remove an entry
 * (`lib/data/repository.ts`). A trail an operator can edit is not a trail, so the absence
 * of a mutation method is the control rather than a permission check inside this route.
 *
 * The attributes the trail carries are the ones `06` §39 requires — who, what, when — and
 * the detail payload is bounded by `lib/audit/log.ts` to primitives and references, so an
 * enquiry message body and a password hash cannot be read back out of it.
 *
 * `GET /api/admin/audit?action=…&resourceType=…&limit=…&cursor=…`
 */

import type { NextRequest } from "next/server";

import { adminApiRoute, jsonOk, validateBody } from "@/lib/admin/api";
import { auditLogQuerySchema } from "@/lib/validation/admin";
import { AUDIT_ACTION_VALUES, AUDIT_RESOURCE_TYPE_VALUES } from "@/lib/data/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const query = validateBody(auditLogQuerySchema, {
        action: api.searchParams.get("action") ?? undefined,
        resourceType: api.searchParams.get("resourceType") ?? undefined,
        limit: api.searchParams.get("limit") ?? undefined,
        cursor: api.searchParams.get("cursor") ?? undefined,
      });
      if (!query.ok) return query.response;

      const page = await api.repository.listAuditLog({
        ...(query.data.action === undefined ? {} : { action: query.data.action }),
        ...(query.data.resourceType === undefined ? {} : { resourceType: query.data.resourceType }),
        ...(query.data.limit === undefined ? {} : { limit: query.data.limit }),
        cursor: query.data.cursor ?? null,
      });

      return jsonOk({
        items: page.items,
        total: page.total,
        nextCursor: page.nextCursor,
        /** The closed vocabularies, so the portal can render filters without hard-coding them. */
        actions: AUDIT_ACTION_VALUES,
        resourceTypes: AUDIT_RESOURCE_TYPE_VALUES,
        adapter: api.repository.kind,
      });
    },
    { csrf: false, body: false },
  );
}
