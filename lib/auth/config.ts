/**
 * Admin credential and session configuration — `decisions.md` **D-026 … D-030**.
 *
 * Everything here is read from `process.env`, is **server-only**, and behaves
 * correctly when the variable is absent. That last property is the standing
 * contract these decisions were chosen to preserve: "the build, type-check and
 * tests pass with **zero environment variables set**" (D-019 … D-024, restated by
 * D-026 … D-030).
 *
 * | Variable                | Purpose                       | Absent behaviour                                        |
 * |-------------------------|-------------------------------|---------------------------------------------------------|
 * | `ADMIN_EMAIL`           | the one admin account         | no admin exists → every login rejected (D-028)          |
 * | `ADMIN_PASSWORD_HASH`   | argon2id/bcrypt hash          | no admin exists → every login rejected (D-028)          |
 * | `ADMIN_SESSION_SECRET`  | HMAC key for session cookies  | per-boot ephemeral secret + loud warning (D-027)        |
 *
 * There is no `NEXT_PUBLIC_` prefix anywhere in this file: a secret handed to the
 * browser is not a secret (`06` §37).
 */

import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";

import { logServerEvent } from "../log/server-log";

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/* -------------------------------------------------------------------------- */
/* Admin account — D-028, D-030                                                */
/* -------------------------------------------------------------------------- */

/** The configured admin address, lower-cased, or `null`. */
export function getAdminEmail(): string | null {
  return readEnv("ADMIN_EMAIL")?.toLowerCase() ?? null;
}

/**
 * The configured password **hash**. Never a plaintext password: the shape check in
 * `lib/auth/password.ts` refuses anything that is not an argon2 or bcrypt hash, so
 * a plaintext value pasted into this variable cannot silently become a working
 * credential.
 */
export function getAdminPasswordHash(): string | null {
  return readEnv("ADMIN_PASSWORD_HASH");
}

/**
 * `decisions.md` D-028 — "When the admin credential variables are absent,
 * `/admin` login rejects every attempt and logs a warning."
 *
 * A half-configured pair (`ADMIN_EMAIL` without a hash, or the reverse) is treated
 * as **not configured**: there is no account that could be authenticated, and
 * inventing one is exactly what D-028 forbids.
 */
export function isAdminCredentialConfigured(): boolean {
  return getAdminEmail() !== null && getAdminPasswordHash() !== null;
}

/* -------------------------------------------------------------------------- */
/* Session secret — D-027                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Domain separation for the HMAC key, so a signature produced for a session can
 * never be replayed as a signature for any other purpose that later uses the same
 * secret. (`lib/enquiry/network.ts` uses the same discipline for its hash.)
 */
export const ADMIN_SESSION_SECRET_DOMAIN = "nicben:admin-session:v1:";

let cachedSecret: Buffer | null = null;
let cachedSecretSource: "env" | "ephemeral" | null = null;
let ephemeralWarningLogged = false;

/**
 * Resolve the session signing secret.
 *
 * `ADMIN_SESSION_SECRET` present → used verbatim.
 * Absent → a **per-boot ephemeral** secret is generated and a loud warning is
 * logged. **A hardcoded default is forbidden** (D-027): a literal in this
 * repository would be a universal forgery key, and it would be published to
 * everyone who can read the source.
 *
 * Consequence of the ephemeral path, stated where it is created rather than only
 * in the decision record: sessions do not survive a restart or a cold start, so
 * the operator is logged out. That is the correct degradation — the alternative
 * (a stable default) is worse than being logged out.
 */
export function resolveAdminSessionSecret(): { secret: Buffer; source: "env" | "ephemeral" } {
  if (cachedSecret && cachedSecretSource) {
    return { secret: cachedSecret, source: cachedSecretSource };
  }

  const configured = readEnv("ADMIN_SESSION_SECRET");
  if (configured) {
    cachedSecret = Buffer.from(`${ADMIN_SESSION_SECRET_DOMAIN}${configured}`, "utf8");
    cachedSecretSource = "env";
    return { secret: cachedSecret, source: "env" };
  }

  cachedSecret = randomBytes(48);
  cachedSecretSource = "ephemeral";
  if (!ephemeralWarningLogged) {
    ephemeralWarningLogged = true;
    logServerEvent({
      scope: "auth",
      event: "session_secret_ephemeral",
      // Loud on purpose: `error` in production, because a production deployment
      // without this variable has sessions that vanish on every cold start and
      // cannot be verified by a second instance.
      level: isProduction() ? "error" : "warn",
      data: {
        reason: "ADMIN_SESSION_SECRET is not set",
        consequence:
          "a per-boot secret was generated; admin sessions do not survive a restart and are not valid across instances. Set ADMIN_SESSION_SECRET before launch.",
        hardcodedDefaultUsed: false,
      },
    });
  }
  return { secret: cachedSecret, source: "ephemeral" };
}

/** `"env"` or `"ephemeral"`, resolved on first use. Diagnostics only — never a secret. */
export function adminSessionSecretSource(): "env" | "ephemeral" {
  return resolveAdminSessionSecret().source;
}

/**
 * A non-reversible fingerprint of the active secret, so a harness can prove two
 * independent boots with no environment produce **different** secrets (i.e. that
 * no hardcoded default is in play) without the secret itself ever being printed or
 * logged. Twelve hex characters of SHA-256 leak nothing usable about a 48-byte
 * random value.
 */
export function adminSessionSecretFingerprint(): string {
  const { secret } = resolveAdminSessionSecret();
  return createHash("sha256").update(secret).digest("hex").slice(0, 12);
}

/**
 * Test/lifecycle helper: forget the cached secret so a harness can re-resolve it
 * after changing the environment. Not used by application code.
 */
export function resetAdminSessionSecret(): void {
  cachedSecret = null;
  cachedSecretSource = null;
  ephemeralWarningLogged = false;
}

/* -------------------------------------------------------------------------- */
/* Diagnostics                                                                 */
/* -------------------------------------------------------------------------- */

export interface AdminAuthConfigStatus {
  /** `true` only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` are present. */
  credentialsConfigured: boolean;
  sessionSecret: "env" | "ephemeral";
}

/**
 * Non-secret state, for a health log line and for the phase verification run.
 * Booleans and a mode name only — never the email, the hash or the secret.
 */
export function getAdminAuthConfigStatus(): AdminAuthConfigStatus {
  return {
    credentialsConfigured: isAdminCredentialConfigured(),
    sessionSecret: adminSessionSecretSource(),
  };
}

export function logAdminAuthConfigStatus(): void {
  const status = getAdminAuthConfigStatus();
  logServerEvent({
    scope: "auth",
    event: "admin_auth_status",
    level: status.credentialsConfigured ? "info" : "warn",
    data: {
      adminCredentialsConfigured: status.credentialsConfigured,
      sessionSecretSource: status.sessionSecret,
      // Named `adminAccountConfigured`, not `email`: the redaction pass in
      // `lib/log/server-log.ts` masks any key called `email`, and a boolean is not
      // a secret.
      database: readEnv("MONGODB_URI") ? "mongodb" : "dev",
      nodeEnv: process.env.NODE_ENV ?? "development",
    },
  });
}
