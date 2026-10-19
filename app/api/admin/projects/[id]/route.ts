/**
 * `GET /api/admin/projects/[id]` — one project. Session-guarded.
 * `PUT` · `PATCH /api/admin/projects/[id]` — update. Session-guarded, CSRF-protected, audited.
 *
 * The id in the path is authoritative: a body `id` is overwritten with it, so a caller
 * cannot address one record and write to another. `PUT` and `PATCH` are the same handler
 * because a project form submits the whole record either way — there is no partial-update
 * semantic to preserve, and offering one would mean two validation paths for one screen.
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonNotFound, jsonOk, validateBody } from "@/lib/admin/api";
import { projectUpsertSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const { id } = await context.params;
      const page = await api.repository.listProjects({ limit: 200 });
      const project = page.items.find((item) => item.id === id) ?? null;
      if (!project) return jsonNotFound("No project carries that id.");
      return jsonOk(project);
    },
    { csrf: false, body: false },
  );
}

async function update(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const { id } = await context.params;

    const validated = validateBody(projectUpsertSchema, {
      ...(api.body && typeof api.body === "object" ? (api.body as Record<string, unknown>) : {}),
      // Path wins. See the file comment.
      id,
    });
    if (!validated.ok) return validated.response;

    const project = await api.repository.upsertProject({
      id,
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
      metadata: { created: false, slug: project.slug, published: project.published, images: project.images.length },
    });

    return jsonOk(project);
  });
}

export const PUT = update;
export const PATCH = update;

/** No `deleteProject` in the port; the removal path is the `published` toggle. Guarded so a probe still gets `401`. */
export async function DELETE(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    () =>
      Response.json(
        {
          ok: false,
          error: "forbidden",
          message: "Projects are not deletable. Set published to false instead.",
        },
        { status: 405, headers: { allow: "GET, PUT, PATCH", "cache-control": "no-store, private" } },
      ),
    { csrf: false, body: false },
  );
}
