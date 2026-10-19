/**
 * Audit trail writer — `docs/06-tech-and-security-spec.md` §39 and §60.
 *
 * §39: "Admin actions logged (who, what, when)."
 * §60: "Log admin logins, failed logins, enquiry status changes and content edits
 * (who, what, when)."
 *
 * Two rules are enforced here rather than trusted to call sites:
 *
 * 1. **The actor comes from the session.** Callers pass `adminId`/`actorEmail`
 *    straight out of a verified `AdminSession` (`lib/auth/guard.ts`). Nothing in
 *    this module reads a request body. That is what makes "a session for user A
 *    cannot act as user B" true for the trail as well as for the data.
 * 2. **The detail payload is bounded and primitive.** A metadata value that is an
 *    object, a function, a `Buffer` or a 100 KB string is either truncated or
 *    dropped, so no call site can accidentally write an enquiry message body, a
 *    password hash or a whole record into the log. `06` §43 forbids leaking
 *    internals, and an audit table is a durable, queryable place to leak them.
 *
 * A failure to write the audit entry is **logged and swallowed**. The mutation it
 * describes has already been applied, so failing the request afterwards would tell
 * the operator their change was rejected when it was not. The consequence is
 * recorded: with a durable store unavailable, admin actions still happen and are
 * only visible in the process log line.
 *
 * Server-only.
 */

import { getEnquiryRepository } from "../data/index";
import type { AuditAction, AuditLog, AuditResourceType } from "../data/types";
import { hashNetworkAddress } from "../enquiry/network";
import { logServerEvent } from "../log/server-log";

/** A `User-Agent` this long is not a browser; it is a payload. */
const MAX_USER_AGENT_LENGTH = 256;
const MAX_METADATA_KEYS = 24;
const MAX_METADATA_STRING = 200;
const MAX_METADATA_KEY_LENGTH = 60;

export interface RecordAuditEventInput {
  /** `AdminUser.id` from the verified session, or `null` for a system action. */
  adminId: string | null;
  /** The actor's email from the verified session, or `null`. */
  actorEmail: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  /** Raw request address. Hashed before storage; never persisted raw. */
  clientAddress?: string | null;
  /** Raw `User-Agent`. Length-capped before storage. */
  userAgent?: string | null;
  /** References only — see the module comment. */
  metadata?: Record<string, unknown> | null;
}

/**
 * Bound one metadata value. Only primitives survive; a string is truncated and an
 * object is replaced by its kind name, so a nested record cannot smuggle a payload
 * in.
 */
function boundValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean" || typeof value === "number") {
    return Number.isFinite(value as number) || typeof value === "boolean" ? (value as number | boolean) : null;
  }
  if (typeof value === "string") {
    return value.length > MAX_METADATA_STRING ? `${value.slice(0, MAX_METADATA_STRING)}…` : value;
  }
  if (Array.isArray(value)) return `[array:${value.length}]`;
  return `[${typeof value}]`;
}

/** Bound the whole payload. Returns `null` when nothing usable remains. */
export function boundAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const output: Record<string, unknown> = {};
  let count = 0;
  for (const key of Object.keys(metadata)) {
    if (count >= MAX_METADATA_KEYS) break;
    if (key.length === 0 || key.length > MAX_METADATA_KEY_LENGTH) continue;
    output[key] = boundValue(metadata[key]);
    count += 1;
  }
  return count > 0 ? output : null;
}

/** Bound a `User-Agent` before it reaches storage. */
export function boundUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const trimmed = userAgent.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > MAX_USER_AGENT_LENGTH
    ? trimmed.slice(0, MAX_USER_AGENT_LENGTH)
    : trimmed;
}

/**
 * Append one audit entry. Returns the stored record, or `null` when the write
 * failed — a caller must not treat `null` as "the action did not happen".
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<AuditLog | null> {
  try {
    const repository = await getEnquiryRepository();
    return await repository.appendAuditLog({
      adminId: input.adminId,
      actorEmail: input.actorEmail,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      // `06` §42: the raw address is not stored. The pseudonym is enough for abuse
      // triage and is the same reduction the enquiry pipeline applies.
      ipHash: hashNetworkAddress(input.clientAddress ?? null),
      userAgent: boundUserAgent(input.userAgent),
      metadata: boundAuditMetadata(input.metadata),
    });
  } catch (error) {
    logServerEvent({
      scope: "audit",
      event: "audit_write_failed",
      level: "error",
      data: {
        action: input.action,
        resourceType: input.resourceType,
        // The handler's name, never its message: a driver error message can carry a
        // connection string (`06` §43, §37).
        error: error instanceof Error ? error.name : "unknown",
      },
    });
    return null;
  }
}
