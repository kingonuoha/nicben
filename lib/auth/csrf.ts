/**
 * CSRF protection for admin mutations — `docs/06-tech-and-security-spec.md` §33
 * ("CSRF protection on all mutating requests").
 *
 * The admin portal is the first surface in this project that carries **ambient
 * authority**: a request arrives with a session cookie the browser attaches on its
 * own. The Phase 05 enquiry endpoint has no cookie, which is why it could be
 * protected by an origin check alone. Here that is not enough, and the difference is
 * the reason this module exists rather than the enquiry route's check being reused.
 *
 * ### Double-submit token, plus the origin gate
 *
 * On login the portal is issued a second cookie, `ADMIN_CSRF_COOKIE`, which is
 * **script-readable on purpose**. Every mutating request must echo its value in the
 * `x-nicben-csrf` header, compared in constant time.
 *
 * Why that is a real control and not ceremony:
 *
 * - A cross-site request **cannot set a custom header**. Adding one turns the request
 *   into a preflighted `fetch`, and this application answers no CORS preflight, so the
 *   browser refuses to send it. A `<form>` cannot set one at all.
 * - It does not depend on the browser attaching `Origin` or `Sec-Fetch-Site`. Those
 *   are checked as well, as a second layer, but a control whose only mechanism is an
 *   optional header the browser *may* omit would fail open in exactly the client that
 *   omitted it.
 * - The token is not a credential: it grants nothing without the session cookie, and
 *   it carries no account information.
 *
 * `SameSite=Lax` on the session cookie is a third layer, not a substitute — it is a
 * browser default that private/legacy clients and non-browser callers do not honour,
 * and it does not protect against a same-site subdomain.
 *
 * ### Which requests are exempt
 *
 * Only `POST /api/admin/auth/login`. There is no session and no CSRF cookie before a
 * login, so there is nothing to double-submit; the attempt is instead covered by the
 * origin gate (`06` §33 applied to the cases where it is the only available
 * mechanism), by §30/§31 throttling (`lib/auth/login-rate-limit.ts`) and by the fact
 * that a forced login requires the operator's password to be known. Exempting
 * **nothing** else is deliberate: an exception here is the usual way a CSRF control
 * acquires a hole.
 *
 * Server-only.
 */

import { constantTimeEqual } from "./constant-time";
import { ADMIN_CSRF_COOKIE, ADMIN_CSRF_HEADER } from "../admin/contract";

export { ADMIN_CSRF_COOKIE, ADMIN_CSRF_HEADER };

export interface CsrfRequestInput {
  /** `Origin` header, when the client sent one. */
  origin: string | null;
  /** `Host` header, always present on a real HTTP/1.1 or HTTP/2 request. */
  host: string | null;
  /** `Sec-Fetch-Site` header, absent on non-browser clients. */
  secFetchSite: string | null;
  /** Value of `ADMIN_CSRF_COOKIE`. */
  cookieToken: string | null;
  /** Value of the `x-nicben-csrf` header. */
  headerToken: string | null;
}

export type CsrfFailureReason =
  | "cross-site-fetch-metadata"
  | "origin-mismatch"
  | "origin-unparseable"
  | "missing-host"
  | "missing-csrf-cookie"
  | "missing-csrf-header"
  | "csrf-token-mismatch";

export type CsrfAssessment = { ok: true } | { ok: false; reason: CsrfFailureReason };

/**
 * Layer 1: the request must not announce itself as cross-site, and if it declares an
 * origin, that origin must be this host. Returns `null` when it passes.
 */
export function checkRequestOrigin(input: Pick<CsrfRequestInput, "origin" | "host" | "secFetchSite">): CsrfFailureReason | null {
  // A browser only sets this on a request it knows the relationship for; `same-site`
  // (a sibling subdomain) is not accepted, because a sibling subdomain is not this
  // application.
  if (input.secFetchSite && input.secFetchSite !== "same-origin") {
    return "cross-site-fetch-metadata";
  }

  if (!input.origin) return null;

  let originHost: string;
  try {
    originHost = new URL(input.origin).host;
  } catch {
    return "origin-unparseable";
  }

  if (!input.host) return "missing-host";
  return originHost === input.host ? null : "origin-mismatch";
}

/**
 * Layer 2: double-submit. The header must be present and must equal the cookie.
 *
 * An absent cookie is a rejection rather than a skip. If it were a skip, deleting a
 * cookie would disable CSRF protection — which is the whole attack.
 */
export function checkDoubleSubmitToken(
  input: Pick<CsrfRequestInput, "cookieToken" | "headerToken">,
): CsrfFailureReason | null {
  if (!input.cookieToken) return "missing-csrf-cookie";
  if (!input.headerToken) return "missing-csrf-header";
  return constantTimeEqual(input.headerToken, input.cookieToken) ? null : "csrf-token-mismatch";
}

/** Both layers. Returns `null` when the request may proceed. */
export function assessCsrf(input: CsrfRequestInput): CsrfFailureReason | null {
  return checkRequestOrigin(input) ?? checkDoubleSubmitToken(input);
}

/** Read the two header values a mutation is judged on, from a `Headers` object. */
export function csrfInputFromHeaders(headers: Headers, cookieToken: string | null): CsrfRequestInput {
  return {
    origin: headers.get("origin"),
    host: headers.get("host"),
    secFetchSite: headers.get("sec-fetch-site"),
    cookieToken,
    headerToken: headers.get(ADMIN_CSRF_HEADER),
  };
}
