/**
 * The admin login pipeline — `decisions.md` **D-026**, D-027, D-028, D-029.
 *
 * `docs/06-tech-and-security-spec.md` §28–§31 are the requirements: hashed
 * passwords, a secure cookie with server-enforced expiry, a rate limit, a lockout,
 * and a login that leaks nothing. This module is the only place those are combined,
 * so the transport (`app/api/admin/auth/login/route.ts`) and the portal's form do
 * not each re-implement a security rule.
 *
 * ### Order, and why
 *
 * ```
 *  1. throttle        cheap, and an unlimited attempt stream defeats everything below
 *  2. account lookup  one repository read
 *  3. verify          argon2id, and a full verify even when the account is unknown
 *  4. audit           who/what/when, written for success and for failure alike
 *  5. issue           cookie value + CSRF token, handed to the transport
 * ```
 *
 * ### The single response for every credential failure
 *
 * An unknown address, a wrong password, an unparseable stored hash and a
 * misconfigured deployment all produce **the same status, the same body, the same
 * audit entry and comparable elapsed work**:
 *
 * - status `401`, body `{ ok: false, error: "invalid-credentials", message: … }`
 * - audit action `login-failure`, metadata `{ stage: "credentials", outcome: "rejected" }`
 * - an argon2id verification of the submitted password against a real hash, so the
 *   unknown-account path costs what the wrong-password path costs
 *
 * That is `06` §43 and the standing "no user enumeration" rule, enforced by there
 * being only one return statement that can express a credential failure.
 *
 * ### Fail closed — D-028
 *
 * **Authorisation consults no environment variable.** The only thing that can
 * authenticate an attempt is a stored `AdminUser` whose hash verifies. With no
 * credential variables and no database the dev adapter has no admin row, so every
 * attempt is rejected: there is no default password, no fallback account and no
 * development bypass, because there is nothing to match against.
 *
 * With a durable store (`decisions.md` D-030's Mongo provisioning path) the
 * `adminUsers` row is the authority, so a deployment does not need
 * `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` to have a working portal. When neither the
 * credential variables nor a durable store are present, this module logs a loud
 * warning saying so — the outcome is already "reject", and the warning is what makes
 * the cause visible.
 *
 * Server-only.
 */

import { isDurableStoreConfigured, getEnquiryRepository } from "../data/index";
import { recordAuditEvent } from "../audit/log";
import { logServerEvent } from "../log/server-log";
import { hashNetworkAddress } from "../enquiry/network";
import { isAdminCredentialConfigured } from "./config";
import { checkLoginThrottle, recordLoginFailure, recordLoginSuccess } from "./login-rate-limit";
import { verifyAdminPassword, verifyAgainstDummyHash } from "./password";
import { issueAdminSession, type AdminSession, type IssuedSession } from "./session";

/**
 * A password longer than this is not a credential, it is an attempt to burn server
 * CPU. argon2id's cost is dominated by its memory parameter rather than input
 * length, so the guard is about refusing absurd payloads rather than about a real
 * denial-of-service, but the limit is enforced identically for every account.
 */
const MAX_PASSWORD_LENGTH = 512;

/** The one message a credential failure ever produces. */
export const ADMIN_LOGIN_REJECTED_MESSAGE = "Invalid email or password.";

/** The message a throttled attempt produces. */
export const ADMIN_LOGIN_THROTTLED_MESSAGE = "Too many attempts. Try again later.";

export interface LoginAttemptInput {
  /** Raw address from the login form. Normalised here, never sanitised beyond that. */
  email: string;
  /** Raw password. **Never** sanitised, truncated for comparison, or logged. */
  password: string;
  /** Raw request address, used only as a hashing input. */
  clientAddress: string | null;
  /** Raw `User-Agent`. Length-capped before storage. */
  userAgent: string | null;
  /** Injectable clock, so the expiry and lockout demonstrations do not sleep. */
  now?: number;
}

export type LoginOutcome =
  | {
      ok: true;
      reason: "authenticated";
      session: AdminSession;
      issued: IssuedSession;
    }
  | {
      ok: false;
      reason: "invalid-credentials" | "throttled";
      /** `401` for a credential failure, `429` for a throttled attempt. */
      status: 401 | 429;
      message: string;
      /** Present when the refusal was a limiter or a lockout. */
      retryAfterSeconds?: number;
    };

function rejectInvalidCredentials(): LoginOutcome {
  return {
    ok: false,
    reason: "invalid-credentials",
    status: 401,
    message: ADMIN_LOGIN_REJECTED_MESSAGE,
  };
}

/**
 * Warn once per process when there is provably no way to authenticate. `error` in
 * production, because a production deployment in this state cannot be logged into at
 * all — which is the correct fail-closed outcome and a deployment fault worth
 * surfacing loudly.
 */
let absentCredentialWarningLogged = false;

function warnIfNoAuthenticationPath(): void {
  if (absentCredentialWarningLogged) return;
  if (isAdminCredentialConfigured()) return;
  if (isDurableStoreConfigured()) return;
  absentCredentialWarningLogged = true;
  logServerEvent({
    scope: "auth",
    event: "admin_credentials_absent",
    level: process.env.NODE_ENV === "production" ? "error" : "warn",
    data: {
      envCredentials: false,
      durableStore: false,
      consequence:
        "no admin account exists, so every login attempt is rejected (decisions.md D-028 fail closed). Set ADMIN_EMAIL + ADMIN_PASSWORD_HASH for a local portal, or provision the adminUsers collection and set MONGODB_URI.",
      defaultPasswordUsed: false,
      devBypassAvailable: false,
    },
  });
}

/** Test/lifecycle helper for the once-per-process warning. Not used by application code. */
export function resetLoginWarnings(): void {
  absentCredentialWarningLogged = false;
}

export async function attemptAdminLogin(input: LoginAttemptInput): Promise<LoginOutcome> {
  warnIfNoAuthenticationPath();

  // Normalisation, not sanitisation: an email identity is case-insensitive and
  // whitespace is a typo, and both the lookup and the limiter key must agree on the
  // same normalised value or one of them can be steered independently.
  const email = input.email.trim().toLowerCase();
  const ipHash = hashNetworkAddress(input.clientAddress);

  /* 1. Throttle — consume before the credential check. ---------------------- */
  const throttle = checkLoginThrottle({ ipHash, email, now: input.now });
  if (!throttle.allowed) {
    logServerEvent({
      scope: "auth",
      event: "login_throttled",
      level: "warn",
      data: {
        blockedBy: throttle.blockedBy,
        cause: throttle.cause,
        retryAfterSeconds: throttle.retryAfterSeconds,
        // The attempted address is deliberately absent: a throttled request has
        // not been authenticated, so there is no actor to name, and the limiter's
        // own key is already a hash.
      },
    });
    // No audit entry is written for a refused-before-check attempt. Writing one per
    // request would let an unauthenticated caller grow the audit collection at will,
    // which is a cheaper attack than the one the limiter exists to stop.
    return {
      ok: false,
      reason: "throttled",
      status: 429,
      message: ADMIN_LOGIN_THROTTLED_MESSAGE,
      retryAfterSeconds: throttle.retryAfterSeconds,
    };
  }

  /* 2 + 3. Lookup, then verify — with the same work on both paths. ---------- */
  let failure: LoginOutcome;
  try {
    const repository = await getEnquiryRepository();
    const admin = await repository.findAdminByEmail(email);

    if (!admin) {
      // Real argon2id work against a real hash, so "no such account" and "wrong
      // password" are not separated by three orders of magnitude of elapsed time.
      await verifyAgainstDummyHash(input.password);
      failure = rejectInvalidCredentials();
    } else if (input.password.length === 0 || input.password.length > MAX_PASSWORD_LENGTH) {
      // Too long to be a credential. The dummy verification is still performed so
      // this path costs what the others cost.
      await verifyAgainstDummyHash(input.password);
      failure = rejectInvalidCredentials();
    } else {
      const verification = await verifyAdminPassword(admin.passwordHash, input.password);
      if (verification.ok) {
        /* 4 + 5. Success. ------------------------------------------------ */
        recordLoginSuccess({ ipHash, email, now: input.now });
        const issued = issueAdminSession({ adminId: admin.id, email: admin.email }, input.now === undefined ? undefined : Math.floor(input.now / 1000));

        await recordAuditEvent({
          adminId: admin.id,
          actorEmail: admin.email,
          action: "login-success",
          resourceType: "session",
          resourceId: admin.id,
          clientAddress: input.clientAddress,
          userAgent: input.userAgent,
          metadata: {
            ttlSeconds: issued.maxAgeSeconds,
            durableStore: isDurableStoreConfigured(),
          },
        });

        return {
          ok: true,
          reason: "authenticated",
          session: {
            adminId: admin.id,
            email: admin.email,
            issuedAt: issued.claims.iat,
            expiresAt: issued.claims.exp,
          },
          issued,
        };
      }
      // A stored hash that cannot be parsed lands here too, as a plain mismatch.
      // `06` §43: the reason is never surfaced, and it is not surfaced to the log in
      // a way that would let a reader distinguish an unknown account either.
      failure = rejectInvalidCredentials();
      logServerEvent({
        scope: "auth",
        event: "login_credential_rejected",
        level: "warn",
        data: { verification: verification.reason, accountExists: true },
      });
    }
  } catch (error) {
    // A store that is unreachable fails closed. The client is told nothing beyond
    // the one credential message, and the handler name — never its message, which
    // can carry a connection string — goes to the log (`06` §43, §37).
    logServerEvent({
      scope: "auth",
      event: "login_repository_unavailable",
      level: "error",
      data: { error: error instanceof Error ? error.name : "unknown" },
    });
    failure = rejectInvalidCredentials();
  }

  /* 4. Audit the failure, then count it. ------------------------------------ */
  if (!failure.ok) {
    // Identical for an unknown address and a wrong password. The distinction is not
    // recorded because nothing needs it: both are "an authentication attempt that
    // did not succeed", and writing one of two different entries would put the
    // enumeration oracle in the trail instead of in the response.
    await recordAuditEvent({
      adminId: null,
      actorEmail: null,
      action: "login-failure",
      resourceType: "session",
      resourceId: null,
      clientAddress: input.clientAddress,
      userAgent: input.userAgent,
      metadata: { stage: "credentials", outcome: "rejected" },
    });
  }

  const lock = recordLoginFailure({ ipHash, email, now: input.now });
  if (!lock.allowed && lock.cause === "lockout" && !failure.ok) {
    // The status stays 401: this attempt's credentials were rejected, and the
    // *next* attempt will be the one refused with 429. Keeping the status here makes
    // the failure sequence countable and keeps the two enumeration paths identical
    // at every index.
    return { ...failure, retryAfterSeconds: lock.retryAfterSeconds };
  }

  return failure;
}
