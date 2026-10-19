/**
 * Rate limiting for the enquiry endpoint — `decisions.md` **D-023**.
 *
 * "In-process token bucket keyed by client IP, applied to the enquiry endpoint
 * now and to admin login in Phase 06."
 *
 * This module is the **enquiry policy** only. The bucket arithmetic lives in
 * `lib/rate-limit/token-bucket.ts`, which Phase 06's login limiter also uses, so
 * there is one implementation of the algorithm and two policies rather than two
 * copies of the algorithm. The exports below are unchanged from Phase 05 —
 * `ENQUIRY_RATE_LIMIT`, `consumeEnquiryRateLimit`, `resetEnquiryRateLimit`,
 * `enquiryRateLimitBucketCount` and the `RateLimitDecision` shape — and the Phase
 * 05 verification harness (`tests/phase-05/lib-tests.mjs`) re-runs against them.
 *
 * ### Honest scope of this control
 *
 * See `lib/rate-limit/token-bucket.ts`: per-instance and in-memory, so the
 * effective limit is `capacity × instances` and a cold start resets it. It raises
 * the cost of a scripted flood; it does not stop one. This is the one security
 * control in Phase 05 that is genuinely partial, and the upgrade path (Upstash
 * Redis) is recorded in the phase completion notes.
 *
 * Buckets are keyed by the **hashed** network address, never the raw one, so the
 * limiter's memory does not hold personal data (`06` §42).
 *
 * Server-only: imported by the request pipeline.
 */

import {
  createTokenBucketLimiter,
  type RateLimitDecision,
  type TokenBucketPolicy,
} from "../rate-limit/token-bucket";

/** Three submissions per address per ten minutes — the phase brief's limit. */
export const ENQUIRY_RATE_LIMIT = {
  capacity: 3,
  windowMs: 10 * 60 * 1000,
} as const satisfies TokenBucketPolicy;

const limiter = createTokenBucketLimiter(ENQUIRY_RATE_LIMIT, {
  scope: "enquiry",
  pruneEvent: "rate_limit_pruned",
});

export type { RateLimitDecision };

/**
 * Consume one token for `key`. `now` is injectable so a test can advance time
 * instead of sleeping for ten minutes.
 */
export function consumeEnquiryRateLimit(key: string, now: number = Date.now()): RateLimitDecision {
  return limiter.consume(key, now);
}

/**
 * Test/lifecycle helper: clear all buckets so a harness can start from a known
 * state without rotating addresses. Not used by application code.
 */
export function resetEnquiryRateLimit(): void {
  limiter.reset();
}

/** Tracked-bucket count, for diagnostics only. */
export function enquiryRateLimitBucketCount(): number {
  return limiter.size();
}
