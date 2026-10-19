/**
 * Session tokens and cookies — `decisions.md` **D-027**.
 *
 * "A signed, expiring session token in an `httpOnly`, `Secure`, `SameSite=Lax`
 * cookie, signed with HMAC via Node `crypto` (no dependency). Secret from
 * `ADMIN_SESSION_SECRET`. … Expiry is enforced **server-side on every request**."
 *
 * ### Token format
 *
 * ```
 *   v1.<base64url(payload)>.<base64url(hmac-sha256)>
 *   payload = { sub: <AdminUser.id>, em: <email>, iat: <unix seconds>, exp: <unix seconds> }
 * ```
 *
 * Three properties the format is chosen for:
 *
 * 1. **No dependency.** HMAC-SHA256 over the version-and-payload segment, using
 *    `node:crypto`. Nothing to keep patched, nothing to misconfigure.
 * 2. **The payload is integrity-protected, not encrypted.** It carries an account
 *    id and an email — both already known to the person holding the cookie — so
 *    there is no secret in it, and the signature is what stops anyone editing it.
 * 3. **Expiry is inside the signed payload *and* checked on every verification.**
 *    A clock-based check on a signed value cannot be skipped by editing the token,
 *    and the same `exp` also sets the cookie's own `Max-Age` so the browser
 *    discards it at the same moment the server stops accepting it.
 *
 * ### The one recorded weakness
 *
 * There is no server-side session store, so **logout clears the cookie and expiry
 * is the only revocation mechanism** (D-027, recorded there rather than only here).
 * A stolen token stays valid until `exp`. Accepted for a single-operator portal;
 * the upgrade path is a revocation list keyed by `sub`+`iat`. The compensating
 * control that *is* present: `lib/auth/guard.ts` re-resolves the account on every
 * request, so deleting or re-provisioning the admin row invalidates every existing
 * token immediately.
 */

import { createHmac, randomBytes } from "node:crypto";

import { logServerEvent } from "../log/server-log";
import {
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_HEADER,
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
} from "../admin/contract";
import { constantTimeEqual } from "./constant-time";
import { resolveAdminSessionSecret } from "./config";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cookie names and the CSRF header are declared in `lib/admin/contract.ts` — the
 * client-safe module both sides import — and re-exported here so a server-only caller
 * has one import. There is exactly one declaration of each name.
 */
export {
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_HEADER,
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
};

const TOKEN_VERSION = "v1";
const PAYLOAD_MAX_BYTES = 512;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

/** The signed claims. Field names are short because they travel on every request. */
export interface AdminSessionClaims {
  /** `AdminUser.id`. */
  sub: string;
  /** `AdminUser.email`. */
  em: string;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expiry, unix seconds. `exp <= now` means the session is over. */
  exp: number;
}

/** What a verified session looks like to callers. */
export interface AdminSession {
  adminId: string;
  email: string;
  /** Unix seconds. */
  issuedAt: number;
  /** Unix seconds. */
  expiresAt: number;
}

/**
 * Payload guard. A signed payload is trusted *because* it is signed, so this is not
 * a security boundary against forgery — it is a boundary against a token signed by
 * an older version of this application whose payload shape has since changed.
 */
function isClaims(value: unknown): value is AdminSessionClaims {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sub === "string" &&
    record.sub.length > 0 &&
    record.sub.length <= 64 &&
    typeof record.em === "string" &&
    record.em.length > 0 &&
    record.em.length <= 254 &&
    typeof record.iat === "number" &&
    Number.isFinite(record.iat) &&
    typeof record.exp === "number" &&
    Number.isFinite(record.exp)
  );
}

function sign(segment: string): string {
  const { secret } = resolveAdminSessionSecret();
  return createHmac("sha256", secret).update(segment).digest("base64url");
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

/* -------------------------------------------------------------------------- */
/* Issue                                                                       */
/* -------------------------------------------------------------------------- */

export interface IssuedSession {
  /** The cookie value. Never logged. */
  token: string;
  csrfToken: string;
  claims: AdminSessionClaims;
  /** `Max-Age` for both cookies, in seconds. */
  maxAgeSeconds: number;
}

/**
 * Issue a session for an already-authenticated account.
 *
 * `now` is injectable so the expiry demonstration in
 * `tests/phase-06/verify.mjs` can mint an already-expired token and one that is
 * about to expire, without waiting eight hours.
 */
export function issueAdminSession(
  input: { adminId: string; email: string; ttlSeconds?: number },
  now: number = Math.floor(Date.now() / 1000),
): IssuedSession {
  const ttl = input.ttlSeconds ?? ADMIN_SESSION_TTL_SECONDS;
  const claims: AdminSessionClaims = {
    sub: input.adminId,
    em: input.email,
    iat: now,
    exp: now + ttl,
  };
  const payloadSegment = `${TOKEN_VERSION}.${base64UrlEncode(JSON.stringify(claims))}`;
  return {
    token: `${payloadSegment}.${sign(payloadSegment)}`,
    csrfToken: randomBytes(32).toString("base64url"),
    claims,
    maxAgeSeconds: ttl,
  };
}

/* -------------------------------------------------------------------------- */
/* Verify                                                                      */
/* -------------------------------------------------------------------------- */

export type SessionVerificationFailure =
  | "absent"
  | "malformed"
  | "bad-signature"
  | "expired"
  | "unreadable-payload";

export type SessionVerification =
  | { ok: true; session: AdminSession; claims: AdminSessionClaims }
  | { ok: false; reason: SessionVerificationFailure };

/**
 * Verify a session token. Pure with respect to the network: it checks the
 * signature, the shape and the expiry, and nothing else. Resolving the account is
 * `lib/auth/guard.ts`'s job, because that needs the repository and this module must
 * stay testable without one.
 */
export function verifyAdminSessionToken(
  token: string | null | undefined,
  now: number = Math.floor(Date.now() / 1000),
): SessionVerification {
  if (!token) return { ok: false, reason: "absent" };
  if (token.length > PAYLOAD_MAX_BYTES + 128) return { ok: false, reason: "malformed" };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [version, payloadSegment, signature] = parts;
  if (version !== TOKEN_VERSION || payloadSegment.length === 0 || signature.length === 0) {
    return { ok: false, reason: "malformed" };
  }

  const segment = `${version}.${payloadSegment}`;
  // Constant-time, and the length check inside it is the first thing that runs, so
  // a token of the wrong shape is rejected without a comparison that could vary.
  if (!constantTimeEqual(signature, sign(segment))) {
    return { ok: false, reason: "bad-signature" };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "unreadable-payload" };
  }
  if (!isClaims(decoded)) return { ok: false, reason: "unreadable-payload" };

  // Server-side expiry. This is the check that revokes a session; there is no
  // session store to consult (D-027).
  if (decoded.exp <= now) return { ok: false, reason: "expired" };
  // A token issued in the future is not one this server produced under a sane
  // clock. Rejected rather than accepted, so a stolen secret plus a forged `iat`
  // still cannot extend past `exp` indefinitely.
  if (decoded.iat > now + 60) return { ok: false, reason: "malformed" };

  return {
    ok: true,
    claims: decoded,
    session: {
      adminId: decoded.sub,
      email: decoded.em,
      issuedAt: decoded.iat,
      expiresAt: decoded.exp,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Cookie attributes                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The cookie options D-027 fixes: `httpOnly`, `Secure`, `SameSite=Lax`, path `/`,
 * with a `Max-Age` equal to the signed `exp`.
 *
 * `Secure` is set unconditionally rather than only in production. Browsers treat
 * `http://localhost` as a trustworthy origin and accept a `Secure` cookie from it,
 * so the development flow works — and a conditional would be one environment
 * variable away from shipping a session cookie over plaintext.
 */
export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

/**
 * The CSRF cookie's options. Identical except for `httpOnly: false`: the portal's
 * client code has to read this value to echo it back in `ADMIN_CSRF_HEADER`, and
 * that read is the mechanism, not an oversight.
 */
export const ADMIN_CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

/** Convenience: the `Set-Cookie` attributes as an ordered list, for documentation. */
export const ADMIN_SESSION_COOKIE_ATTRIBUTES = [
  "HttpOnly",
  "Secure",
  "SameSite=Lax",
  "Path=/",
] as const;

/** Log a session lifecycle event. Never the token, never the secret. */
export function logSessionEvent(
  event: string,
  level: "debug" | "info" | "warn" | "error",
  data: Record<string, unknown>,
): void {
  logServerEvent({ scope: "auth", event, level, data });
}
