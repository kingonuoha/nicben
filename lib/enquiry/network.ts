/**
 * Network-address handling for the enquiry pipeline.
 *
 * `docs/06-tech-and-security-spec.md` section 42 requires the form to "collect
 * only what the form needs", and section 55 lists the fields an enquiry stores —
 * a network address is not among them. `decisions.md` D-023 needs an
 * abuse-control *key* rather than an identity, so the raw address is hashed and
 * only the truncated pseudonym reaches storage or a log line.
 *
 * Honest limits of this module:
 * - A hash of an IPv4 address is **pseudonymisation, not anonymisation**: the
 *   address space is small enough to brute-force. It is reduced data, not
 *   secret data, and it is treated as personal data accordingly.
 * - `x-forwarded-for` is client-supplied unless a trusted proxy overwrites it.
 *   On Vercel the platform sets it; anywhere else it must not be treated as
 *   authoritative. This means rate limiting can be evaded by spoofing the header
 *   in a self-hosted deployment without a fronting proxy. Recorded as a
 *   limitation in the phase completion notes.
 *
 * Server-only: imports `node:crypto`, so it must never be reached from a client
 * component.
 */

import { createHash } from "node:crypto";

/**
 * Domain-separated so the digest cannot be compared against a hash of the same
 * address computed for another purpose.
 */
const HASH_DOMAIN = "nicben:enquiry-network-address:v1:";
const HASH_LENGTH = 32;

export function hashNetworkAddress(address: string | null): string | null {
  if (!address) return null;
  const digest = createHash("sha256").update(`${HASH_DOMAIN}${address}`).digest("hex");
  return digest.slice(0, HASH_LENGTH);
}

function firstForwardedAddress(value: string): string | null {
  // `x-forwarded-for` is a chain: "client, proxy1, proxy2". The first entry is
  // the originating address as reported by the last trusted hop.
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 && first.length <= 64 ? first : null;
}

export function clientAddressFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const address = firstForwardedAddress(forwarded);
    if (address) return address;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length > 0 && realIp.length <= 64) return realIp;
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp && cfIp.length > 0 && cfIp.length <= 64) return cfIp;
  return null;
}
