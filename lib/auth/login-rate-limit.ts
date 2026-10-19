/**
 * Admin login throttling and lockout — `decisions.md` **D-023**, D-028, D-029.
 *
 * `docs/06-tech-and-security-spec.md` §30 ("Rate limiting on login") and §31
 * ("Lockout or backoff after repeated failed logins"), plus D-029's implementation
 * of the spec's stated alternative to TOTP: "strong password policy plus rate limit
 * and lockout".
 *
 * ### Two keys, on purpose
 *
 * | Key                 | What it stops                                        | Derived from                          |
 * |---------------------|------------------------------------------------------|---------------------------------------|
 * | `login:ip:<h>`      | one host grinding many accounts (password spraying)   | SHA-256 of the pseudonymised address  |
 * | `login:account:<h>` | many hosts grinding one account (targeted guessing)   | SHA-256 of the submitted address      |
 *
 * Requiring a token from **both** buckets, and counting a failure against **both**,
 * is what makes the control cover both shapes of attack. Either key alone leaves one
 * of them open.
 *
 * ### Keys are hashes, never the values
 *
 * The Phase 05 limiter stores hashed addresses (`lib/enquiry/network.ts`); the
 * account key is hashed here for the same reason (`06` §42, "collect only what the
 * form needs"). An account email is personal data, and a limiter's memory is not a
 * place to accumulate it. Domain-separated so the digest cannot be compared against
 * a hash of the same email computed for another purpose.
 *
 * ### Honest scope
 *
 * The bucket arithmetic is the Phase 05 engine
 * (`lib/rate-limit/token-bucket.ts`), so the same limitation applies and is stated
 * rather than implied: **per-instance and in-memory**. On a serverless platform each
 * instance counts separately, and a cold start resets every count and every lockout.
 * The upgrade path (Upstash Redis) is the same one Phase 05 recorded.
 *
 * ### The trade-off the account lockout makes
 *
 * An account lockout can be triggered deliberately by anyone who knows an address,
 * which is a denial-of-service vector against the operator. That is why the lockout
 * window is short (15 minutes) and why the **IP** limit is the primary control —
 * a locked-out operator waits, rather than being permanently excluded. Recorded here
 * because it is a real cost of the requirement, not a defect to be discovered later.
 *
 * Server-only: imported by the login pipeline.
 */

import { createHash } from "node:crypto";

import { logServerEvent } from "../log/server-log";
import { createTokenBucketLimiter, type TokenBucketPolicy } from "../rate-limit/token-bucket";

/** Five attempts per address per ten minutes before throttling. */
export const ADMIN_LOGIN_RATE_LIMIT = {
  capacity: 5,
  windowMs: 10 * 60 * 1000,
} as const satisfies TokenBucketPolicy;

/** Five consecutive failures lock a key for fifteen minutes. */
export const ADMIN_LOGIN_LOCKOUT = {
  threshold: 5,
  lockoutMs: 15 * 60 * 1000,
} as const;

const KEY_DOMAIN = "nicben:admin-login-key:v1:";

/** Domain-separated, truncated digest. Reduced data, not secret data. */
function hashKey(value: string): string {
  return createHash("sha256").update(`${KEY_DOMAIN}${value}`).digest("hex").slice(0, 32);
}

function ipKey(ipHash: string | null): string {
  return `login:ip:${ipHash ?? "unresolved-address"}`;
}

function accountKey(email: string): string {
  return `login:account:${hashKey(email.trim().toLowerCase())}`;
}

const ipLimiter = createTokenBucketLimiter(ADMIN_LOGIN_RATE_LIMIT, {
  scope: "auth",
  pruneEvent: "login_rate_limit_pruned",
});

const accountLimiter = createTokenBucketLimiter(ADMIN_LOGIN_RATE_LIMIT, {
  scope: "auth",
  pruneEvent: "login_rate_limit_pruned",
});

interface LockState {
  /** Consecutive failures since the last success. */
  failures: number;
  /** Millisecond timestamp the lock expires, or `0` when not locked. */
  lockedUntil: number;
}

const lockStates = new Map<string, LockState>();

function lockState(key: string): LockState {
  const existing = lockStates.get(key);
  if (existing) return existing;
  const created: LockState = { failures: 0, lockedUntil: 0 };
  lockStates.set(key, created);
  return created;
}

function secondsUntil(millis: number, now: number): number {
  return Math.max(1, Math.ceil((millis - now) / 1000));
}

export interface LoginThrottleInput {
  /** The hashed submitting address, or `null` when none could be determined. */
  ipHash: string | null;
  /** The address supplied in the attempt. Used only as a hashing input. */
  email: string;
  now?: number;
}

export interface LoginThrottleDecision {
  allowed: boolean;
  /** Seconds to wait. `0` when allowed. */
  retryAfterSeconds: number;
  /** Which key refused, for the log line. `null` when allowed. */
  blockedBy: "ip" | "account" | null;
  /** Which limit refused — a bucket or a lockout. `null` when allowed. */
  cause: "rate-limit" | "lockout" | null;
}

const ALLOWED: LoginThrottleDecision = {
  allowed: true,
  retryAfterSeconds: 0,
  blockedBy: null,
  cause: null,
};

/**
 * Decide whether an attempt may proceed, **consuming a token for both keys when it
 * may**. Call this once per attempt, before the credential check: the limiter
 * counts attempts, not failures, which is what stops an attacker from getting
 * unlimited guesses by never being counted.
 */
export function checkLoginThrottle(input: LoginThrottleInput): LoginThrottleDecision {
  const now = input.now ?? Date.now();
  const keys: Array<{ name: "ip" | "account"; key: string }> = [
    { name: "ip", key: ipKey(input.ipHash) },
    { name: "account", key: accountKey(input.email) },
  ];

  // 1. Lockout first, and without consuming: a locked key's timer must be able to
  //    run out on schedule.
  for (const { name, key } of keys) {
    const state = lockStates.get(key);
    if (state && state.lockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: secondsUntil(state.lockedUntil, now),
        blockedBy: name,
        cause: "lockout",
      };
    }
  }

  // 2. Then the buckets.
  for (const { name, key } of keys) {
    const limiter = name === "ip" ? ipLimiter : accountLimiter;
    const decision = limiter.consume(key, now);
    if (!decision.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: decision.retryAfterSeconds,
        blockedBy: name,
        cause: "rate-limit",
      };
    }
  }

  return ALLOWED;
}

/**
 * Count a failed credential check against both keys, locking a key that reaches
 * the threshold. Returns the decision the **next** attempt would receive, so the
 * caller can put a truthful `Retry-After` on the response that reports the failure
 * when that failure was the one that triggered the lock.
 */
export function recordLoginFailure(input: LoginThrottleInput): LoginThrottleDecision {
  const now = input.now ?? Date.now();
  const keys: Array<{ name: "ip" | "account"; key: string }> = [
    { name: "ip", key: ipKey(input.ipHash) },
    { name: "account", key: accountKey(input.email) },
  ];

  let locked: LoginThrottleDecision = ALLOWED;
  for (const { name, key } of keys) {
    const state = lockState(key);
    state.failures += 1;
    if (state.failures >= ADMIN_LOGIN_LOCKOUT.threshold) {
      state.lockedUntil = now + ADMIN_LOGIN_LOCKOUT.lockoutMs;
      if (locked.allowed) {
        locked = {
          allowed: false,
          retryAfterSeconds: secondsUntil(state.lockedUntil, now),
          blockedBy: name,
          cause: "lockout",
        };
      }
      logServerEvent({
        scope: "auth",
        event: "login_lockout_engaged",
        level: "warn",
        data: {
          key: name,
          failures: state.failures,
          threshold: ADMIN_LOGIN_LOCKOUT.threshold,
          lockoutSeconds: Math.round(ADMIN_LOGIN_LOCKOUT.lockoutMs / 1000),
        },
      });
    }
  }

  // Keep the lock map from growing without bound under a spoofed-address flood.
  pruneLockStates(now);
  return locked;
}

/**
 * Clear the failure counters and any lock for both keys. Called on a successful
 * login, so an operator who mistypes four times and then gets it right is not left
 * one failure away from a lock. The **token buckets are deliberately not reset** —
 * the rate limit governs attempt volume and should not be refunded.
 */
export function recordLoginSuccess(input: LoginThrottleInput): void {
  for (const key of [ipKey(input.ipHash), accountKey(input.email)]) {
    const state = lockStates.get(key);
    if (state) {
      state.failures = 0;
      state.lockedUntil = 0;
    }
  }
}

const MAX_TRACKED_LOCKS = 5000;

function pruneLockStates(now: number): void {
  if (lockStates.size <= MAX_TRACKED_LOCKS) return;
  for (const [key, state] of lockStates) {
    if (state.lockedUntil <= now && state.failures === 0) lockStates.delete(key);
    if (lockStates.size <= MAX_TRACKED_LOCKS) break;
  }
}

/**
 * Test/lifecycle helper: clear every bucket and lock so a harness can start from a
 * known state. Not used by application code.
 */
export function resetLoginThrottle(): void {
  ipLimiter.reset();
  accountLimiter.reset();
  lockStates.clear();
}

/** Counts only — never keys, never addresses. For diagnostics and the test harness. */
export function loginThrottleSnapshot(): {
  ipBuckets: number;
  accountBuckets: number;
  lockEntries: number;
} {
  return {
    ipBuckets: ipLimiter.size(),
    accountBuckets: accountLimiter.size(),
    lockEntries: lockStates.size,
  };
}

/** The hashed account key is exported so a harness can assert it is not the email. */
export function adminLoginAccountKey(email: string): string {
  return accountKey(email);
}
