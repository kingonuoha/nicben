/**
 * `GET /api/admin/testimonials/[id]` — one record. Session-guarded.
 * `PUT` · `PATCH /api/admin/testimonials/[id]` — update. Session-guarded, CSRF-protected, audited.
 *
 * The path id is authoritative over a body id, exactly as in the projects route.
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonNotFound, jsonOk, validateBody } from "@/lib/admin/api";
import { testimonialUpsertSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const { id } = await context.params;
      const page = await api.repository.listTestimonials({ limit: 200 });
      const testimonial = page.items.find((item) => item.id === id) ?? null;
      if (!testimonial) return jsonNotFound("No testimonial carries that id.");
      return jsonOk(testimonial);
    },
    { csrf: false, body: false },
  );
}

async function update(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const { id } = await context.params;

    const validated = validateBody(testimonialUpsertSchema, {
      ...(api.body && typeof api.body === "object" ? (api.body as Record<string, unknown>) : {}),
      id,
    });
    if (!validated.ok) return validated.response;

    const testimonial = await api.repository.upsertTestimonial({
      id,
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
        created: false,
        published: testimonial.published,
        hasProjectRef: testimonial.projectRef !== null,
      },
    });

    return jsonOk(testimonial);
  });
}

export const PUT = update;
export const PATCH = update;

/** No delete method in the port; the removal path is the `published` toggle. Guarded so a probe still gets `401`. */
export async function DELETE(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    () =>
      Response.json(
        {
          ok: false,
          error: "forbidden",
          message: "Testimonials are not deletable. Set published to false instead.",
        },
        { status: 405, headers: { allow: "GET, PUT, PATCH", "cache-control": "no-store, private" } },
      ),
    { csrf: false, body: false },
  );
}
