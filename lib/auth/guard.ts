/**
 * Server-side session guards — `docs/06-tech-and-security-spec.md` §27.
 *
 * > Admin routes and admin APIs must all check the session **on the server**;
 * > never rely on hidden UI.
 *
 * That sentence is the whole reason this module exists as a module rather than as
 * three lines repeated in every route. **Two failure modes, deliberately different:**
 *
 * | Caller     | Helper                    | Unauthenticated outcome                          |
 * |------------|---------------------------|--------------------------------------------------|
 * | a page     | `requireAdminSession()`   | `redirect("/admin/login")` — a person is looking  |
 * | an API     | `requireAdminApiSession()`| throws `AdminUnauthorizedError` → **`401`**       |
 *
 * Answering an API request with a redirect would give a `fetch` an HTML login page
 * and status `200`, which is exactly the kind of "the guard is somewhere else"
 * failure the audit enumerates for. Keep them separate.
 *
 * ### What verification actually checks, on every request
 *
 * 1. the cookie exists;
 * 2. the HMAC signature is valid (constant-time) and the token version is known;
 * 3. the signed `exp` has not passed;
 * 4. **the account still exists**, re-resolved through the repository port, and its
 *    id still equals the signed `sub`.
 *
 * Step 4 is what turns "delete the admin row" into an immediate revocation, which is
 * the compensating control for D-027's recorded limitation that expiry is otherwise
 * the only revocation mechanism. It also means a tampered `sub` — which would break
 * the signature anyway — could not be used to act as a re-provisioned account.
 *
 * Cost: one repository read per admin request. Correct trade for a single-operator
 * portal; the alternative is a session store, which D-027 explicitly did not take on.
 *
 * Server-only: reads cookies and the repository.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getEnquiryRepository } from "../data/index";
import { logServerEvent } from "../log/server-log";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
  type AdminSession,
} from "./session";

/**
 * Thrown by `requireAdminApiSession()` when there is no valid session. It carries no
 * detail on purpose: the response body is a fixed 401 and everything worth knowing
 * goes to the server log.
 */
export class AdminUnauthorizedError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super("admin session required");
    this.name = "AdminUnauthorizedError";
    this.reason = reason;
  }
}

/**
 * The session for the current request, or `null`.
 *
 * Never throws for an absent, malformed, forged or expired cookie — a caller that
 * wants a decision gets one. Use this where a page needs to *render differently*
 * when signed in; use a guard where it must not render at all.
 *
 * Returns `null` outside a request scope (for example during a static render), which
 * is the fail-closed answer rather than an exception.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  let token: string | undefined;
  try {
    const store = await cookies();
    token = store.get(ADMIN_SESSION_COOKIE)?.value;
  } catch {
    // No request scope. Fail closed; there is nobody to authenticate.
    return null;
  }

  const verification = verifyAdminSessionToken(token);
  if (!verification.ok) {
    if (verification.reason === "expired") {
      logServerEvent({
        scope: "auth",
        event: "session_expired",
        level: "info",
        data: { enforcedAt: "server", mechanism: "signed-exp" },
      });
    } else if (verification.reason !== "absent") {
      logServerEvent({
        scope: "auth",
        event: "session_rejected",
        level: "warn",
        data: { reason: verification.reason },
      });
    }
    return null;
  }

  // 4. The account must still exist and must still be the one the token names.
  try {
    const repository = await getEnquiryRepository();
    const admin = await repository.findAdminByEmail(verification.claims.em);
    if (!admin || admin.id !== verification.claims.sub) {
      logServerEvent({
        scope: "auth",
        event: "session_account_gone",
        level: "warn",
        data: { matched: admin !== null, adapter: repository.kind },
      });
      return null;
    }
  } catch (error) {
    // A store that cannot be reached cannot confirm the account, so the session is
    // not honoured. Fail closed, and never surface the driver message (`06` §43).
    logServerEvent({
      scope: "auth",
      event: "session_account_lookup_failed",
      level: "error",
      data: { error: error instanceof Error ? error.name : "unknown" },
    });
    return null;
  }

  return verification.session;
}

/**
 * Page guard. An unauthenticated request is **redirected** to the login route; this
 * function does not return in that case (`redirect()` throws a framework control-flow
 * error that must not be caught).
 *
 * Put it in the protected segment's layout so a new page cannot be added without it,
 * or at the top of each page. Do **not** call it from the layout that also wraps
 * `/admin/login` — that would redirect the login page to itself.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

/**
 * API guard. Throws `AdminUnauthorizedError`, which `adminApiRoute` in
 * `lib/admin/api.ts` converts into a `401`. Same verification as
 * `requireAdminSession()`; only the failure mode differs.
 *
 * A route handler written by hand can use `guardAdminApi()` instead, which returns
 * the response rather than throwing.
 */
export async function requireAdminApiSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new AdminUnauthorizedError("no-valid-session");
  return session;
}

/** The session for a server action, or `null`. Same verification as the guards. */
export async function getAdminSessionForAction(): Promise<AdminSession | null> {
  return getAdminSession();
}

/**
 * Convenience for a hand-written route handler: either the session, or the exact
 * response to return. Exported so a future route cannot invent its own 401 body and
 * drift from the contract.
 */
export async function guardAdminApi(): Promise<
  { ok: true; session: AdminSession } | { ok: false; session: null }
> {
  const session = await getAdminSession();
  return session ? { ok: true, session } : { ok: false, session: null };
}
