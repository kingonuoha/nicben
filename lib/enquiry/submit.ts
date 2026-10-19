/**
 * The enquiry pipeline.
 *
 * Order is fixed and each step is placed where it is for a reason:
 *
 * ```
 *  1. honeypot        cheapest, and a bot must get no signal (D-022)
 *  2. rate limit      cheap, protects everything below it (D-023)
 *  3. Turnstile       the only external call in the request path (D-022)
 *  4. validation      Zod, server-side, authoritative (06 §32)
 *  5. attachments     type by magic bytes, size, rename, private store (06 §34/§57)
 *  6. persist         the record is written *before* any mail is attempted (D-021)
 *  7. notify          failure flags the stored record, never the user (D-021)
 * ```
 *
 * Three invariants hold across the whole function:
 *
 * - **Nothing submitted is ever returned.** Every failure produces one of the six
 *   approved messages from `03-copy-deck.md:195` and a field *name* (`06` §40).
 * - **Nothing internal is ever returned.** Adapter errors, driver messages and
 *   provider responses are logged with references only (`06` §43); the client
 *   receives the generic approved message.
 * - **A mail outage does not lose an enquiry** (D-021). The user sees the success
 *   card because the enquiry genuinely was stored.
 */

import { randomUUID } from "node:crypto";

import { getEnquiryRepository } from "../data/index";
import type { EnquiryAttachment, NewEnquiry } from "../data/types";
import { logServerEvent } from "../log/server-log";
import {
  ENQUIRY_ERROR_MESSAGES,
  ENQUIRY_HONEYPOT_FIELD,
  formDataToEnquiryCandidate,
  isHoneypotFilled,
  jsonToEnquiryCandidate,
  validateEnquirySubmission,
  type EnquiryFieldError,
  type ValidatedEnquiry,
} from "../validation/enquiry";
import { prepareAttachments } from "./attachments";
import {
  ENQUIRY_API_STATUS,
  ENQUIRY_ATTACHMENT_FIELD,
  ENQUIRY_TURNSTILE_FIELD,
} from "./contract";
import { hashNetworkAddress } from "./network";
import { sendEnquiryNotification } from "./notify";
import { consumeEnquiryRateLimit } from "./rate-limit";
import { storePrivateAttachments } from "./storage";
import { verifyTurnstileToken } from "./turnstile";

/** A submission's body, in whichever form it arrived. */
export type EnquirySubmissionSource =
  | { kind: "form"; formData: FormData }
  | { kind: "json"; body: unknown };

export interface EnquirySubmissionInput {
  source: EnquirySubmissionSource;
  /** Value of `x-turnstile-token`, when the client sends it as a header. */
  turnstileHeaderToken?: string | null;
  /** `null` when no address could be determined. */
  clientAddress: string | null;
  /** Whether the client sent a `User-Agent`. The value itself is not used. */
  hasUserAgent?: boolean;
  /** Injectable clock so a test can drive the rate limiter without sleeping. */
  now?: number;
}

export type EnquirySubmissionOutcome =
  | {
      ok: true;
      requestId: string;
      /**
       * `"stored"` — a real enquiry was persisted. `"honeypot"` — discarded
       * silently; the response is identical on purpose so an automated client
       * cannot distinguish rejection from success.
       */
      outcome: "stored" | "honeypot";
    }
  | {
      ok: false;
      status: number;
      requestId: string;
      fieldErrors: EnquiryFieldError[];
      formError: string | null;
      retryAfterSeconds?: number;
    };

interface ExtractedSource {
  candidate: ReturnType<typeof formDataToEnquiryCandidate>;
  honeypotFilled: boolean;
  turnstileToken: string | null;
  files: File[];
}

function extract(source: EnquirySubmissionSource): ExtractedSource {
  if (source.kind === "json") {
    // A JSON body cannot carry a file: attachments are multipart-only, and the
    // endpoint documents that.
    const record = (source.body && typeof source.body === "object" ? source.body : {}) as Record<
      string,
      unknown
    >;
    const honeypot = record[ENQUIRY_HONEYPOT_FIELD];
    const token = record[ENQUIRY_TURNSTILE_FIELD];
    return {
      candidate: jsonToEnquiryCandidate(source.body),
      honeypotFilled: typeof honeypot === "string" && honeypot.trim().length > 0,
      turnstileToken: typeof token === "string" && token.trim().length > 0 ? token : null,
      files: [],
    };
  }

  const formData = source.formData;
  const token = formData.get(ENQUIRY_TURNSTILE_FIELD);
  return {
    candidate: formDataToEnquiryCandidate(formData),
    honeypotFilled: isHoneypotFilled(formData),
    turnstileToken: typeof token === "string" && token.trim().length > 0 ? token : null,
    files: formData
      .getAll(ENQUIRY_ATTACHMENT_FIELD)
      .filter((entry): entry is File => entry instanceof File && entry.size > 0),
  };
}

function failure(
  requestId: string,
  status: number,
  fieldErrors: EnquiryFieldError[],
  formError: string | null,
  retryAfterSeconds?: number,
): EnquirySubmissionOutcome {
  return {
    ok: false,
    requestId,
    status,
    fieldErrors,
    formError,
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  };
}

interface PersistInput {
  requestId: string;
  startedAt: number;
  data: ValidatedEnquiry;
  attachments: EnquiryAttachment[];
  ipHash: string | null;
}

async function persistAndNotify(input: PersistInput): Promise<EnquirySubmissionOutcome> {
  const { requestId, startedAt, data, attachments, ipHash } = input;

  const newEnquiry: NewEnquiry = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    enquiryType: data.enquiryType,
    location: data.location,
    message: data.message,
    attachments,
    // 06 §55 — the consent timestamp is stored, not a boolean.
    consentAt: new Date().toISOString(),
    ipHash,
  };

  const repository = await getEnquiryRepository();

  let enquiry;
  try {
    enquiry = await repository.createEnquiry(newEnquiry);
  } catch (error) {
    logServerEvent({
      scope: "enquiry",
      event: "persist_failed",
      level: "error",
      data: {
        requestId,
        adapter: repository.kind,
        error: error instanceof Error ? error.name : "unknown",
      },
    });
    // The sender cannot fix this, so it is reported as a server fault with the
    // generic approved message. No driver or adapter detail leaves the server.
    return failure(requestId, ENQUIRY_API_STATUS.serverError, [], ENQUIRY_ERROR_MESSAGES.generic);
  }

  logServerEvent({
    scope: "enquiry",
    event: "enquiry_created",
    level: "info",
    data: {
      requestId,
      enquiryId: enquiry.id,
      adapter: repository.kind,
      // Durable is false with the dev adapter; the flag makes that visible in
      // production logs rather than only in the adapter warning.
      durable: repository.kind === "mongo",
      attachments: enquiry.attachments.length,
    },
  });

  /* 7. Notify — a failure is recorded, never shown (D-021). ---------------- */
  const notification = await sendEnquiryNotification(enquiry);
  try {
    await repository.setEnquiryNotification(enquiry.id, notification);
  } catch (error) {
    // The enquiry is stored, so the submission has succeeded. The flag exists for
    // admin triage; failing to write it is logged and nothing more.
    logServerEvent({
      scope: "enquiry",
      event: "notification_flag_failed",
      level: "error",
      data: {
        requestId,
        enquiryId: enquiry.id,
        adapter: repository.kind,
        error: error instanceof Error ? error.name : "unknown",
      },
    });
  }

  logServerEvent({
    scope: "enquiry",
    event: "submission_stored",
    level: "info",
    data: {
      requestId,
      enquiryId: enquiry.id,
      notified: notification.delivered,
      notificationError: notification.error,
      durationMs: Date.now() - startedAt,
    },
  });

  return { ok: true, requestId, outcome: "stored" };
}

export async function submitEnquiry(
  input: EnquirySubmissionInput,
): Promise<EnquirySubmissionOutcome> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const extracted = extract(input.source);

  logServerEvent({
    scope: "enquiry",
    event: "submission_received",
    level: "info",
    data: {
      requestId,
      source: input.source.kind,
      hasUserAgent: input.hasUserAgent ?? false,
      hasAddress: input.clientAddress !== null,
    },
  });

  /* 1. Honeypot — always active, independent of Turnstile (D-022). ---------- */
  if (extracted.honeypotFilled) {
    logServerEvent({
      scope: "enquiry",
      event: "honeypot_rejected",
      level: "warn",
      data: { requestId, disposition: "discarded-silently" },
    });
    // Deliberately indistinguishable from a stored submission.
    return { ok: true, requestId, outcome: "honeypot" };
  }

  /* 2. Rate limit — per instance, keyed by a hashed address (D-023). -------- */
  const ipHash = hashNetworkAddress(input.clientAddress);
  const decision = consumeEnquiryRateLimit(ipHash ?? "unresolved-address", input.now ?? Date.now());
  if (!decision.allowed) {
    logServerEvent({
      scope: "enquiry",
      event: "rate_limited",
      level: "warn",
      data: {
        requestId,
        limit: decision.limit,
        windowMs: 10 * 60 * 1000,
        retryAfterSeconds: decision.retryAfterSeconds,
      },
    });
    return failure(
      requestId,
      ENQUIRY_API_STATUS.rateLimited,
      [],
      ENQUIRY_ERROR_MESSAGES.generic,
      decision.retryAfterSeconds,
    );
  }

  /* 3. Turnstile — fails closed in production (D-022). ---------------------- */
  const turnstile = await verifyTurnstileToken({
    token: input.turnstileHeaderToken?.trim() || extracted.turnstileToken,
    remoteAddress: input.clientAddress,
  });
  if (!turnstile.ok) {
    // The reason is logged; the client gets the generic approved message. There
    // is no approved copy for a challenge failure, and D-008 forbids writing one.
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_blocked",
      level: "warn",
      data: { requestId, reason: turnstile.reason, codes: turnstile.codes },
    });
    return failure(requestId, ENQUIRY_API_STATUS.forbidden, [], ENQUIRY_ERROR_MESSAGES.generic);
  }

  /* 4. Validation — server-side, authoritative (06 §32). ------------------- */
  const validation = validateEnquirySubmission(extracted.candidate);
  if (!validation.ok) {
    logServerEvent({
      scope: "enquiry",
      event: "validation_failed",
      level: "warn",
      data: {
        requestId,
        // Field names and counts only. Values are never logged.
        fields: validation.fieldErrors.map((entry) => entry.field),
        formLevel: validation.formError !== null,
      },
    });
    return failure(
      requestId,
      ENQUIRY_API_STATUS.invalid,
      validation.fieldErrors,
      validation.formError,
    );
  }

  /* 5. Attachments — magic bytes, size, rename, private store (06 §34/§57). - */
  let attachments: EnquiryAttachment[] = [];
  if (extracted.files.length > 0) {
    const prepared = await prepareAttachments(extracted.files);
    if (!prepared.ok) {
      logServerEvent({
        scope: "enquiry",
        event: "attachment_rejected",
        level: "warn",
        data: { requestId, reason: prepared.reason, count: extracted.files.length },
      });
      return failure(
        requestId,
        ENQUIRY_API_STATUS.invalid,
        [{ field: "attachments", message: ENQUIRY_ERROR_MESSAGES.attachment }],
        null,
      );
    }

    const stored = await storePrivateAttachments(prepared.attachments);
    if (!stored.ok) {
      // Both branches tell the sender the file could not be accepted rather than
      // discarding it silently (D-020: "a 'your file was ignored' path is worse
      // than an absent field").
      logServerEvent({
        scope: "enquiry",
        event: "attachment_storage_failed",
        level: "error",
        data: { requestId, reason: stored.reason },
      });
      return stored.reason === "not-configured"
        ? failure(
            requestId,
            ENQUIRY_API_STATUS.invalid,
            [{ field: "attachments", message: ENQUIRY_ERROR_MESSAGES.attachment }],
            null,
          )
        : failure(requestId, ENQUIRY_API_STATUS.serverError, [], ENQUIRY_ERROR_MESSAGES.generic);
    }
    attachments = stored.attachments;
  }

  /* 6 + 7. Persist, then notify (D-021). ----------------------------------- */
  return persistAndNotify({
    requestId,
    startedAt,
    data: validation.data,
    attachments,
    ipHash,
  });
}

/** Exposed so the verification harness can assert the order without reading code. */
export const ENQUIRY_PIPELINE_STEPS = [
  "honeypot",
  "rate-limit",
  "turnstile",
  "validation",
  "attachments",
  "persist",
  "notify",
] as const;
