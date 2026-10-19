/**
 * Constant-time comparison helpers.
 *
 * `docs/06-tech-and-security-spec.md` §28 requires hashed passwords and secure
 * cookies; the standing Phase 06 task states the requirement directly as
 * "constant-time comparison on every credential check". This module is where that
 * happens, so no call site has to remember to do it.
 *
 * `node:crypto`'s `timingSafeEqual` **throws** on a length mismatch, and a throw is
 * itself a signal — a naive wrapper that let it escape would leak the length of the
 * expected value as a distinguishable outcome. Both helpers below therefore
 * compare lengths first and return `false` without throwing, and the length check
 * is not a meaningful oracle for the values they guard: a session signature and a
 * CSRF token are both fixed-length by construction, so their lengths are public.
 *
 * Server-only: imports `node:crypto`.
 */

import { timingSafeEqual } from "node:crypto";

/** Constant-time equality. `false` for differing lengths; never throws. */
export function constantTimeEqual(
  left: string | Buffer | Uint8Array,
  right: string | Buffer | Uint8Array,
): boolean {
  const a = typeof left === "string" ? Buffer.from(left, "utf8") : Buffer.from(left);
  const b = typeof right === "string" ? Buffer.from(right, "utf8") : Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
