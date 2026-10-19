/**
 * `GET /api/admin/content/[pageKey]` — the editable copy for one page. Session-guarded.
 * `PUT /api/admin/content/[pageKey]` — replace its section list. Session-guarded, CSRF-protected, audited.
 *
 * `06` §21 models `PageContent` with `pageKey` as the route key, so the key is in the path
 * and is the sole addressing mechanism — there is no create-a-page operation, because a
 * new page is a code change that adds sections, not a row an operator conjures.
 *
 * `GET` returns `content: null` for a page with no stored row rather than an empty
 * document. That distinction matters: `decisions.md` D-012 forbids substituting a value
 * for a `[CLIENT TO CONFIRM]` detail, so "never entered" must be visible to the portal and
 * not rendered as "entered and empty".
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonOk, validateBody } from "@/lib/admin/api";
import { pageContentUpsertSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ pageKey: string }>;
}

/**
 * Next hands the segment over already decoded. `decodeURIComponent` is applied as a
 * fallback only for the case where it is not, and is guarded because a malformed escape
 * (`%`, `%zz`) throws `URIError` — which would have become a `500` on a request the caller
 * could have fixed.
 */
function pageKeyFromSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export async function GET(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const { pageKey } = await context.params;
      const key = pageKeyFromSegment(pageKey);
      const content = await api.repository.getPageContent(key);
      return jsonOk({ pageKey: key, content });
    },
    { csrf: false, body: false },
  );
}

export async function PUT(request: NextRequest, context: RouteParams): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const { pageKey } = await context.params;

    const validated = validateBody(pageContentUpsertSchema, {
      ...(api.body && typeof api.body === "object" ? (api.body as Record<string, unknown>) : {}),
      pageKey: pageKeyFromSegment(pageKey),
    });
    if (!validated.ok) return validated.response;

    const content = await api.repository.upsertPageContent({
      pageKey: validated.data.pageKey,
      sections: validated.data.sections,
    });

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "page-content-upsert",
      resourceType: "page-content",
      resourceId: content.pageKey,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: {
        sections: content.sections.length,
        headings: content.sections.filter((section) => section.heading !== null).length,
        bodies: content.sections.filter((section) => section.body !== null).length,
      },
    });

    return jsonOk(content);
  });
}

/** Content is not deletable: unpublishing a page is a code change, and an empty section list is already expressible. */
export async function DELETE(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    () =>
      Response.json(
        {
          ok: false,
          error: "forbidden",
          message: "Page content is not deletable. Replace the section list instead.",
        },
        { status: 405, headers: { allow: "GET, PUT", "cache-control": "no-store, private" } },
      ),
    { csrf: false, body: false },
  );
}
