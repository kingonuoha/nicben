/**
 * In-process token-bucket limiter — `decisions.md` **D-023**.
 *
 * Extracted from the Phase 05 enquiry limiter so that **both** call sites share
 * one engine rather than each carrying a copy of the arithmetic:
 *
 * - `lib/enquiry/rate-limit.ts` — the public enquiry endpoint (Phase 05).
 * - `lib/auth/login-rate-limit.ts` — admin login, keyed by address **and** account
 *   (Phase 06, the extension D-023 itself anticipated: "applied to the enquiry
 *   endpoint now and to admin login in Phase 06").
 *
 * ### Honest scope of this control
 *
 * This limiter is **per-instance and in-memory**. On a serverless platform each
 * concurrent instance holds its own buckets, so the effective limit is
 * `capacity × instances`, and a cold start resets every count. It therefore raises
 * the cost of a scripted flood; it does not stop one. That is the one genuinely
 * partial security control in these phases, and it is stated rather than presented
 * as complete. The upgrade path is an Upstash Redis token bucket — every call site
 * goes through this module, so only this file changes.
 *
 * Keys are caller-supplied and are always **hashed or account-derived** by the
 * caller (`lib/enquiry/network.ts` for addresses), so this module's memory never
 * holds a raw address or an email in the clear.
 *
 * Server-only: imported by request pipelines, never by a client component.
 */

import { logServerEvent } from "../log/server-log";

export interface TokenBucketPolicy {
  /** Burst size and the ceiling a bucket refills to. */
  capacity: number;
  /** Time to refill from empty to `capacity`. */
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** Tokens left after this call. */
  remaining: number;
  /** Seconds until the next token; `0` when the call was allowed. */
  retryAfterSeconds: number;
  /** The configured capacity, so a caller can render a truthful `X-RateLimit-*`. */
  limit: number;
}

interface Bucket {
  tokens: number;
  /** Millisecond timestamp of the last refill. */
  updatedAt: number;
}

export interface TokenBucketLimiterOptions {
  /**
   * Ceiling on tracked keys, so a spoofed-key flood cannot grow memory without
   * bound. Defaults to 5000.
   */
  maxTracked?: number;
  /** Log scope for the prune event. Defaults to `"rate-limit"`. */
  scope?: string;
  /** Event name for the prune log line. */
  pruneEvent?: string;
}

export interface TokenBucketLimiter {
  readonly policy: TokenBucketPolicy;
  /**
   * Consume one token for `key`. `now` is injectable so a test can advance time
   * instead of sleeping for the length of the window.
   */
  consume(key: string, now?: number): RateLimitDecision;
  /**
   * Inspect a bucket without consuming. Returns the tokens currently available,
   * which a lockout check needs: "is this key exhausted" is a different question
   * from "may this request proceed".
   */
  peek(key: string, now?: number): { tokens: number; available: boolean };
  /** Drop every bucket. Test/lifecycle helper. */
  reset(): void;
  /** Tracked-bucket count, for diagnostics only. */
  size(): number;
}

const DEFAULT_MAX_TRACKED = 5000;

export function createTokenBucketLimiter(
  policy: TokenBucketPolicy,
  options: TokenBucketLimiterOptions = {},
): TokenBucketLimiter {
  const buckets = new Map<string, Bucket>();
  const maxTracked = options.maxTracked ?? DEFAULT_MAX_TRACKED;
  const scope = options.scope ?? "rate-limit";
  const pruneEvent = options.pruneEvent ?? "rate_limit_pruned";

  const refillPerMillisecond = policy.capacity / policy.windowMs;

  /**
   * Drop fully-replenished buckets when the map grows past its ceiling. A bucket
   * that has refilled to capacity carries no information — its next request would
   * behave identically whether it was tracked or not — so discarding it is safe and
   * keeps a flood from turning into unbounded memory growth.
   */
  function prune(now: number): void {
    if (buckets.size <= maxTracked) return;
    for (const [key, bucket] of buckets) {
      const refilled = bucket.tokens + (now - bucket.updatedAt) * refillPerMillisecond;
      if (refilled >= policy.capacity) buckets.delete(key);
      if (buckets.size <= maxTracked) break;
    }
    // If everything was still throttled the map stays over the ceiling for this
    // call only; the next full-window entries expire and are pruned.
    logServerEvent({ scope, event: pruneEvent, level: "debug", data: { tracked: buckets.size } });
  }

  /** Tokens available after elapsed time, clamped. A backwards clock credits nothing. */
  function refilled(key: string, now: number): number {
    const bucket = buckets.get(key);
    if (!bucket) return policy.capacity;
    const elapsed = Math.max(0, now - bucket.updatedAt);
    return Math.min(policy.capacity, bucket.tokens + elapsed * refillPerMillisecond);
  }

  return {
    policy,

    consume(key: string, now: number = Date.now()): RateLimitDecision {
      const limit = policy.capacity;
      const bucket = buckets.get(key);

      if (!bucket) {
        buckets.set(key, { tokens: limit - 1, updatedAt: now });
        prune(now);
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0, limit };
      }

      const available = refilled(key, now);

      if (available >= 1) {
        bucket.tokens = available - 1;
        bucket.updatedAt = now;
        return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0, limit };
      }

      bucket.tokens = available;
      bucket.updatedAt = now;
      const secondsUntilNextToken = Math.ceil((1 - available) / refillPerMillisecond / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, secondsUntilNextToken),
        limit,
      };
    },

    peek(key: string, now: number = Date.now()) {
      const tokens = refilled(key, now);
      return { tokens, available: tokens >= 1 };
    },

    reset(): void {
      buckets.clear();
    },

    size(): number {
      return buckets.size;
    },
  };
}
