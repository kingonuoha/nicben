/**
 * The admin authentication surface, in one place.
 *
 * **Server-only.** This barrel is imported by route handlers, server components and
 * server actions. A client component must import `@/lib/admin/contract` or
 * `@/lib/admin/client` instead; importing this module from the browser would pull
 * `node:crypto` — and, through `./password`, a N-API binary — into the client bundle.
 *
 * `@/lib/admin/client.ts` is the browser counterpart. The two share no code except the
 * names in `@/lib/admin/contract`.
 *
 * ### What a consumer needs, and from where
 *
 * | Need                                              | Symbol                                                        |
 * |---------------------------------------------------|---------------------------------------------------------------|
 * | guard a page                                      | `requireAdminSession` (`@/lib/auth/guard`)                    |
 * | guard an API route                                | `adminApiRoute` (`@/lib/admin/api`) — wraps `requireAdminApiSession` |
 * | guard a server action                             | `requireAdminSession` / `getAdminSessionForAction`            |
 * | the signed-in operator                            | `requireAdminSession()` → `{ adminId, email, issuedAt, expiresAt }` |
 * | sign in / out                                     | `attemptAdminLogin`, `issueAdminSession` (server actions) or the login API |
 * | CSRF for a hand-written mutation                  | `assessCsrf` (`@/lib/auth/csrf`)                              |
 * | validate a mutation body                          | `@/lib/validation/admin` schemas + `validateBody` (`@/lib/admin/api`) |
 * | write an audit entry                              | `recordAuditEvent` (`@/lib/audit/log`)                        |
 * | CSV                                          | `@/lib/admin/csv`                                             |
 */

export {
  getAdminSession,
  getAdminSessionForAction,
  guardAdminApi,
  requireAdminApiSession,
  requireAdminSession,
  AdminUnauthorizedError,
} from "./guard";

export {
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_COOKIE_OPTIONS,
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_ATTRIBUTES,
  ADMIN_SESSION_COOKIE_OPTIONS,
  ADMIN_SESSION_TTL_SECONDS,
  issueAdminSession,
  logSessionEvent,
  verifyAdminSessionToken,
  type AdminSession,
  type AdminSessionClaims,
  type SessionVerification,
  type SessionVerificationFailure,
} from "./session";

export {
  ADMIN_CSRF_HEADER,
  assessCsrf,
  checkDoubleSubmitToken,
  checkRequestOrigin,
  csrfInputFromHeaders,
  type CsrfFailureReason,
  type CsrfRequestInput,
} from "./csrf";

export {
  adminSessionSecretFingerprint,
  adminSessionSecretSource,
  getAdminAuthConfigStatus,
  getAdminEmail,
  getAdminPasswordHash,
  isAdminCredentialConfigured,
  logAdminAuthConfigStatus,
  resetAdminSessionSecret,
  type AdminAuthConfigStatus,
} from "./config";

export { constantTimeEqual } from "./constant-time";

export {
  ADMIN_PASSWORD_POLICY,
  ARGON2_OPTIONS,
  checkAdminPasswordPolicy,
  hashAdminPassword,
  isAdminPasswordAcceptable,
  looksLikeArgon2Hash,
  verifyAdminPassword,
  verifyAgainstDummyHash,
  type PasswordPolicyViolation,
  type PasswordVerificationResult,
} from "./password";

export {
  ADMIN_LOGIN_LOCKOUT,
  ADMIN_LOGIN_RATE_LIMIT,
  adminLoginAccountKey,
  checkLoginThrottle,
  loginThrottleSnapshot,
  recordLoginFailure,
  recordLoginSuccess,
  resetLoginThrottle,
  type LoginThrottleDecision,
} from "./login-rate-limit";

export {
  ADMIN_LOGIN_REJECTED_MESSAGE,
  ADMIN_LOGIN_THROTTLED_MESSAGE,
  attemptAdminLogin,
  resetLoginWarnings,
  type LoginAttemptInput,
  type LoginOutcome,
} from "./login";
