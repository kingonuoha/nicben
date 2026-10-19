/**
 * `POST /api/admin/auth/logout` — end the session in this browser.
 *
 * Session-guarded: an unauthenticated `POST` is `401`, which is also what makes the
 * route appear correctly in the unauthenticated enumeration table. There is nothing to
 * clear without a session, so requiring one costs nothing.
 *
 * ### What this does and does not do — D-027
 *
 * It clears the session cookie and the CSRF cookie, and it records the logout as an
 * audit entry. It does **not** invalidate the token server-side, because there is no
 * server-side session store: a copy of the token that an attacker already holds stays
 * valid until its signed `exp` passes. That limitation is recorded in the decision and
 * restated at `lib/auth/session.ts`; the compensating control is that expiry is checked
 * on every request and that deleting the admin row revokes every token immediately
 * (`lib/auth/guard.ts`).
 */

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import {
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_COOKIE_OPTIONS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";
import { adminApiRoute, jsonOk } from "@/lib/admin/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const store = await cookies();
    // An empty value with `maxAge: 0` is what a browser actually honours; `delete()`
    // alone leaves the attributes to the framework and a `Secure` cookie set over
    // plaintext in development could survive.
    store.set(ADMIN_SESSION_COOKIE, "", { ...ADMIN_SESSION_COOKIE_OPTIONS, maxAge: 0 });
    store.set(ADMIN_CSRF_COOKIE, "", { ...ADMIN_CSRF_COOKIE_OPTIONS, maxAge: 0 });

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "logout",
      resourceType: "session",
      resourceId: api.session.adminId,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: { mechanism: "cookie-cleared", revocation: "expiry-only" },
    });

    return jsonOk({ loggedOut: true, revokedServerSide: false });
  });
}
