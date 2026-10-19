/**
 * `POST /api/admin/enquiries/[id]/notes` — append an admin note. Session-guarded.
 *
 * `06` §39/§60 log "admin actions"; a note is an admin action on a record, so it is
 * audited. The audit entry records that a note was added and by whom — not the note text,
 * which is already stored on the enquiry (`lib/audit/log.ts` bounds the detail payload to
 * references for exactly this reason).
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonNotFound, jsonOk, validateBody } from "@/lib/admin/api";
import { enquiryNoteSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const { id } = await context.params;

    const validated = validateBody(enquiryNoteSchema, api.body);
    if (!validated.ok) return validated.response;

    const updated = await api.repository.addEnquiryNote(id, {
      body: validated.data.body,
      // From the session. A body-supplied author would let one operator write as another.
      authorId: api.session.adminId,
    });
    if (!updated) return jsonNotFound("No enquiry carries that id.");

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "enquiry-note-added",
      resourceType: "enquiry",
      resourceId: id,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: { notes: updated.notes.length },
    });

    return jsonOk(updated, { status: 201 });
  });
}
