/**
 * `POST /api/admin/auth/login` — the admin credential exchange.
 *
 * ### Why this route does not use `adminApiRoute`
 *
 * `adminApiRoute` (in `lib/admin/api.ts`) requires a valid session before it reaches the
 * handler, which is exactly right everywhere else and impossible here: this is the
 * endpoint that **creates** the session.
 *
 * ### Why every failure is `401`
 *
 * A malformed body, a missing field, an unknown address, a wrong password, a throttled
 * attempt and a deployment with no admin configured all resolve to the same `401`
 * envelope with the same message, and the credential paths additionally do comparable
 * work (`lib/auth/login.ts`). Two consequences, both intended:
 *
 * - **No enumeration.** A caller cannot tell an unknown address from a wrong password —
 *   not by status, not by body, not by timing.
 * - **The enumeration table holds.** An unauthenticated probe of this route returns
 *   `401` whatever shape the probe takes, so the Phase 06 audit's per-endpoint `401`
 *   check passes for this route as well as for the session-guarded ones. It is the one
 *   route where `401` is the authentication answer rather than a guard refusal, and the
 *   distinction is recorded in `docs/tasks/phase-06-hidden-admin-portal/backend-notes.md`.
 *
 * `403` is returned only for a request that declares itself cross-site — a browser-driven
 * forgery, which `06` §33 asks to be refused wherever the origin gate is applicable.
 * `429` is returned only for a throttled or locked-out attempt (`06` §30, §31), and only
 * after the configured number of failures.
 */

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { logAdminAuthConfigStatus } from "@/lib/auth/config";
import { checkRequestOrigin } from "@/lib/auth/csrf";
import { attemptAdminLogin } from "@/lib/auth/login";
import {
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_COOKIE_OPTIONS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";
import {
  ADMIN_API_MAX_REQUEST_BYTES,
  jsonError,
  jsonForbidden,
  jsonOk,
  validateBody,
} from "@/lib/admin/api";
import { clientAddressFromHeaders } from "@/lib/enquiry/network";
import { logServerEvent } from "@/lib/log/server-log";
import { adminLoginSchema } from "@/lib/validation/admin";

/** argon2id is a N-API call and the pipeline reaches the repository. Both need Node. */
export const runtime = "nodejs";

/** The configuration state is logged once per process, so a deployment's own logs say whether it can be logged into. */
let authStatusLogged = false;

export async function POST(request: NextRequest): Promise<Response> {
  if (!authStatusLogged) {
    authStatusLogged = true;
    logAdminAuthConfigStatus();
  }

  /* 1. Origin gate (06 §33). This route has no token to double-submit yet. */
  const originReason = checkRequestOrigin({
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    secFetchSite: request.headers.get("sec-fetch-site"),
  });
  if (originReason) {
    logServerEvent({
      scope: "auth",
      event: "login_origin_rejected",
      level: "warn",
      data: { reason: originReason },
    });
    return jsonForbidden(originReason);
  }

  /* 2. Body ceiling. */
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > ADMIN_API_MAX_REQUEST_BYTES) {
    logServerEvent({
      scope: "auth",
      event: "login_request_too_large",
      level: "warn",
      data: { declaredLength, limit: ADMIN_API_MAX_REQUEST_BYTES },
    });
    return jsonError(413, "invalid", "The request was rejected (too large).");
  }

  /* 3. Body. A body that does not validate is not an error response of its own: it is
   *    an attempt without valid credentials, and it is answered as one. */
  let body: unknown = null;
  try {
    const text = await request.text();
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const validated = validateBody(adminLoginSchema, body);
  const email = validated.ok ? validated.data.email : "";
  const password = validated.ok ? validated.data.password : "";

  if (!validated.ok) {
    logServerEvent({
      scope: "auth",
      event: "login_body_malformed",
      level: "warn",
      // No field values, and no field names either: this route answers every rejection
      // identically, and a log line that itemised the field would be one more place the
      // shape of an attempt could be read from.
      data: { answeredAs: "invalid-credentials" },
    });
  }

  /* 4. The pipeline. */
  const outcome = await attemptAdminLogin({
    email,
    password,
    clientAddress: clientAddressFromHeaders(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  if (!outcome.ok) {
    return jsonError(outcome.status, outcome.status === 429 ? "rate-limited" : "unauthorized", outcome.message, {
      ...(outcome.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: outcome.retryAfterSeconds }),
    });
  }

  /* 5. Cookies. Set through `next/headers`, which merges them into this response. */
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, outcome.issued.token, {
    ...ADMIN_SESSION_COOKIE_OPTIONS,
    maxAge: outcome.issued.maxAgeSeconds,
  });
  store.set(ADMIN_CSRF_COOKIE, outcome.issued.csrfToken, {
    ...ADMIN_CSRF_COOKIE_OPTIONS,
    maxAge: outcome.issued.maxAgeSeconds,
  });

  return jsonOk({
    adminId: outcome.session.adminId,
    email: outcome.session.email,
    issuedAt: new Date(outcome.session.issuedAt * 1000).toISOString(),
    expiresAt: new Date(outcome.session.expiresAt * 1000).toISOString(),
  });
}
