/**
 * `GET /api/admin/enquiries/[id]` — one enquiry. Session-guarded (`401` unauthenticated).
 *
 * `PATCH /api/admin/enquiries/[id]` — change the status, optionally recording a note.
 *
 * The status change is one of the four actions `06` §60 requires to be logged, so it
 * writes an audit entry carrying the **previous and new** status. The entry's actor comes
 * from the session, never from the body: `enquiryStatusUpdateSchema` has no field for it.
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonNotFound, jsonOk, validateBody } from "@/lib/admin/api";
import { enquiryStatusUpdateSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const { id } = await context.params;
      const enquiry = await api.repository.getEnquiry(id);
      if (!enquiry) return jsonNotFound("No enquiry carries that id.");
      return jsonOk(enquiry);
    },
    { csrf: false, body: false },
  );
}

export async function PATCH(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const { id } = await context.params;

    const validated = validateBody(enquiryStatusUpdateSchema, api.body);
    if (!validated.ok) return validated.response;

    // Read first, so the audit entry can name the previous status. A status change that
    // recorded only the new value would not answer "what did it change from".
    const before = await api.repository.getEnquiry(id);
    if (!before) return jsonNotFound("No enquiry carries that id.");

    const updated = await api.repository.updateEnquiryStatus(id, {
      status: validated.data.status,
      ...(validated.data.note ? { note: validated.data.note } : {}),
      actorId: api.session.adminId,
    });
    if (!updated) return jsonNotFound("No enquiry carries that id.");

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "enquiry-status-change",
      resourceType: "enquiry",
      resourceId: id,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: {
        from: before.status,
        to: updated.status,
        // A boolean, not the note body: the note is stored on the enquiry, and the
        // audit entry's detail payload is bounded to references (`lib/audit/log.ts`).
        noteAdded: Boolean(validated.data.note),
      },
    });

    return jsonOk(updated);
  });
}

/** `DELETE` is intentionally absent: the enquiry record is evidence and is never removed by the portal. */
export async function DELETE(request: NextRequest): Promise<Response> {
  // Guarded even though the answer is `405`: every admin route method must refuse an
  // unauthenticated caller with `401`, or the enumeration check has a method-shaped hole
  // in it. Nothing is mutated here, so no CSRF token is required.
  return adminApiRoute(
    request,
    () =>
      Response.json(
        { ok: false, error: "forbidden", message: "Enquiries are not deletable." },
        { status: 405, headers: { allow: "GET, PATCH", "cache-control": "no-store, private" } },
      ),
    { csrf: false, body: false },
  );
}
