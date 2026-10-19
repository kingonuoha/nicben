/**
 * `GET /api/admin/auth/session` — who am I?
 *
 * Session-guarded: an unauthenticated request is `401`. It exists so the portal's shell
 * can confirm the session is still valid **server-side** before rendering, and so a
 * client component can obtain the CSRF token without reading a cookie directly. Reading
 * this endpoint is not a security check the UI performs — the check is the server's, and
 * it has already happened by the time this body is produced.
 *
 * The response carries no secret: the operator's own id and address, the expiry the
 * server enforces, and the double-submit token they already hold in a cookie.
 */

import type { NextRequest } from "next/server";

import { adminApiRoute, jsonOk } from "@/lib/admin/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(request, async (api) =>
    jsonOk({
      adminId: api.session.adminId,
      email: api.session.email,
      issuedAt: new Date(api.session.issuedAt * 1000).toISOString(),
      expiresAt: new Date(api.session.expiresAt * 1000).toISOString(),
      csrfToken: api.csrfToken,
      csrfHeader: "x-nicben-csrf",
    }),
  );
}
