/**
 * `GET /api/admin/projects` — list (published and drafts). Session-guarded.
 * `POST /api/admin/projects` — create. Session-guarded, CSRF-protected, audited.
 *
 * The public read path is a separate concern: `GET` here returns drafts too, because the
 * operator has to see them. A public listing must filter on `published: true` — the port
 * applies the filter only when the caller asks for it, so a public caller that forgets
 * would leak a draft. That is stated here rather than left to be rediscovered.
 *
 * `DELETE` is not offered. The removal path is the `published` toggle: there is no
 * `deleteProject` in the port (`docs/tasks/phase-06-hidden-admin-portal/backend-task.md`
 * fixes the method list) and an unpublished record is indistinguishable from a deleted one
 * to every public reader.
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonOk, validateBody } from "@/lib/admin/api";
import { projectListQuerySchema, projectUpsertSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const query = validateBody(projectListQuerySchema, {
        published: api.searchParams.get("published") ?? undefined,
        limit: api.searchParams.get("limit") ?? undefined,
        cursor: api.searchParams.get("cursor") ?? undefined,
      });
      if (!query.ok) return query.response;

      const page = await api.repository.listProjects({
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
    const validated = validateBody(projectUpsertSchema, api.body);
    if (!validated.ok) return validated.response;

    const project = await api.repository.upsertProject({
      // A create never honours a body-supplied id. `POST` means "new record"; letting the
      // body choose an id would turn create into an unconditional overwrite.
      id: null,
      title: validated.data.title,
      slug: validated.data.slug,
      serviceTag: validated.data.serviceTag,
      location: validated.data.location,
      images: validated.data.images,
      summary: validated.data.summary,
      published: validated.data.published,
    });

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "project-upsert",
      resourceType: "project",
      resourceId: project.id,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: { created: true, slug: project.slug, published: project.published, images: project.images.length },
    });

    return jsonOk(project, { status: 201 });
  });
}
