/**
 * Rate limiting for the enquiry endpoint — `decisions.md` **D-023**.
 *
 * "In-process token bucket keyed by client IP, applied to the enquiry endpoint
 * now and to admin login in Phase 06."
 *
 * ### Honest scope of this control
 *
 * This limiter is **per-instance and in-memory**. On a serverless platform each
 * concurrent instance holds its own buckets, so the effective limit is
 * `capacity × instances`, and a cold start resets the count. It therefore raises
 * the cost of a scripted flood; it does not stop one, and it is the **one
 * security control in this phase that is genuinely partial**. That limitation is
 * stated here rather than presented as complete, and the upgrade path is
 * recorded in the phase completion notes: replace `consume` with an Upstash
 * Redis token bucket (the client already runs an Upstash MCP server), which the
 * caller will not notice because every call site goes through this module.
 *
 * Buckets are keyed by the **hashed** network address, never the raw one, so the
 * limiter's memory does not hold personal data (`06` §42).
 *
 * Server-only: imported by the request pipeline.
 */

import { logServerEvent } from "../log/server-log";

/** Three submissions per address per ten minutes — the phase brief's limit. */
export const ENQUIRY_RATE_LIMIT = {
  capacity: 3,
  windowMs: 10 * 60 * 1000,
} as const;

/** Ceiling on tracked keys, so a spoofed-address flood cannot grow memory without bound. */
const MAX_TRACKED_BUCKETS = 5000;

interface Bucket {
  tokens: number;
  /** Millisecond timestamp of the last refill. */
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Drop fully-replenished buckets when the map grows past its ceiling. A bucket
 * that has refilled to capacity carries no information — its next request would
 * behave identically whether it was tracked or not — so discarding it is safe and
 * keeps a flood from turning into unbounded memory growth.
 */
function prune(now: number): void {
  if (buckets.size <= MAX_TRACKED_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    const refilled = bucket.tokens + (now - bucket.updatedAt) * refillPerMillisecond();
    if (refilled >= ENQUIRY_RATE_LIMIT.capacity) buckets.delete(key);
    if (buckets.size <= MAX_TRACKED_BUCKETS) break;
  }
  // If everything was still throttled the map stays over the ceiling for this
  // call only; the next full-window entries expire and are pruned.
  logServerEvent({
    scope: "enquiry",
    event: "rate_limit_pruned",
    level: "debug",
    data: { tracked: buckets.size },
  });
}

function refillPerMillisecond(): number {
  return ENQUIRY_RATE_LIMIT.capacity / ENQUIRY_RATE_LIMIT.windowMs;
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

/**
 * Consume one token for `key`. `now` is injectable so a test can advance time
 * instead of sleeping for ten minutes.
 */
export function consumeEnquiryRateLimit(key: string, now: number = Date.now()): RateLimitDecision {
  const limit = ENQUIRY_RATE_LIMIT.capacity;
  const bucket = buckets.get(key);

  if (!bucket) {
    buckets.set(key, { tokens: limit - 1, updatedAt: now });
    prune(now);
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0, limit };
  }

  // A clock that goes backwards must not credit tokens.
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const refilled = Math.min(limit, bucket.tokens + elapsed * refillPerMillisecond());

  if (refilled >= 1) {
    bucket.tokens = refilled - 1;
    bucket.updatedAt = now;
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0, limit };
  }

  bucket.tokens = refilled;
  bucket.updatedAt = now;
  const secondsUntilNextToken = Math.ceil((1 - refilled) / refillPerMillisecond() / 1000);
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.max(1, secondsUntilNextToken),
    limit,
  };
}

/**
 * Test/lifecycle helper: clear all buckets so a harness can start from a known
 * state without rotating addresses. Not used by application code.
 */
export function resetEnquiryRateLimit(): void {
  buckets.clear();
}

/** Tracked-bucket count, for diagnostics only. */
export function enquiryRateLimitBucketCount(): number {
  return buckets.size;
}
