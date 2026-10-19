/**
 * `GET /api/admin/testimonials` — list (published and unpublished). Session-guarded.
 * `POST /api/admin/testimonials` — create. Session-guarded, CSRF-protected, audited.
 *
 * Same shape as the projects collection, and for the same reason: one admin list
 * surface, one mutation surface, no second data layer.
 *
 * Testimonials are client-identifying content. `decisions.md` D-008 forbids inventing any,
 * and neither this route nor the schema can invent one — only the operator can author the
 * text, and it is stored exactly as entered after sanitisation.
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonOk, validateBody } from "@/lib/admin/api";
import { testimonialListQuerySchema, testimonialUpsertSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const query = validateBody(testimonialListQuerySchema, {
        published: api.searchParams.get("published") ?? undefined,
        limit: api.searchParams.get("limit") ?? undefined,
        cursor: api.searchParams.get("cursor") ?? undefined,
      });
      if (!query.ok) return query.response;

      const page = await api.repository.listTestimonials({
        ...(query.data.published === undefined ? {} : { published: query.data.published }),
        ...(query.data.limit === undefined ? {} : { limit: query.data.limit }),
        cursor: query.data.cursor ?? null,
      });

      return jsonOk({
        items: page.items,
        total: page.total,
        nextCursor: page.nextCursor,
        adapter: api.repository.kind,
      });
    },
    { csrf: false, body: false },
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const validated = validateBody(testimonialUpsertSchema, api.body);
    if (!validated.ok) return validated.response;

    const testimonial = await api.repository.upsertTestimonial({
      id: null,
      name: validated.data.name,
      quote: validated.data.quote,
      projectRef: validated.data.projectRef,
      published: validated.data.published,
    });

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "testimonial-upsert",
      resourceType: "testimonial",
      resourceId: testimonial.id,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: {
        created: true,
        published: testimonial.published,
        // A boolean, not the client's name or the quote: both are personal data, and the
        // audit detail payload carries references only (`lib/audit/log.ts`).
        hasProjectRef: testimonial.projectRef !== null,
      },
    });

    return jsonOk(testimonial, { status: 201 });
  });
}
