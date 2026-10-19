/**
 * `POST /api/enquiries` — the enquiry endpoint.
 *
 * A Route Handler rather than a Server Action, for one reason that matters to this
 * project: the QA gate requires the endpoint to be provable **without the client
 * form** ("Prove the endpoint rejects a malformed payload submitted without the
 * client form", `qa-task.md` gate 3). An HTTP endpoint is testable with a raw
 * request; a Server Action is reachable only through the framework's own
 * invocation protocol.
 *
 * This file is transport only. Every rule — validation, spam control, rate
 * limiting, attachment policy, persistence order, notification — lives in
 * `lib/enquiry/`, so it is testable without HTTP and so no rule can be bypassed
 * by a second entry point appearing later.
 *
 * Two transport-level controls are applied here because they need the raw
 * request:
 *
 * 1. **Body ceiling** (`ENQUIRY_MAX_REQUEST_BYTES`) — refused from
 *    `Content-Length` before the multipart body is parsed. Measured behaviour of
 *    the Node runtime: Next buffers a POST body before a Route Handler runs, so
 *    this ceiling bounds what a request may **contain**, not how much is read.
 *    The true memory bound is the hosting platform's request-size limit; that is
 *    recorded as a deployment prerequisite rather than claimed here.
 * 2. **Same-origin enforcement** (`06` §33, "CSRF protection on all mutating
 *    requests"). A browser always attaches `Origin` to a cross-origin POST, so a
 *    mismatched `Origin` — or `Sec-Fetch-Site: cross-site` — is rejected. A
 *    request with no `Origin` at all is not a browser-driven forgery (curl, a
 *    server-to-server call, a health check); this endpoint holds no cookies and
 *    no session, so ambient authority is not available to be abused. Turnstile,
 *    the honeypot and the rate limit remain the controls for those callers.
 *
 * `06` §43: an unexpected fault returns the generic approved message and logs the
 * detail. No stack trace, driver message or adapter error crosses this boundary.
 */

import type { NextRequest } from "next/server";

import {
  ENQUIRY_API_STATUS,
  ENQUIRY_MAX_REQUEST_BYTES,
  ENQUIRY_TURNSTILE_HEADER,
  type EnquiryApiResponse,
} from "@/lib/enquiry/contract";
import { logEnquiryIntegrationStatus } from "@/lib/enquiry/config";
import { clientAddressFromHeaders } from "@/lib/enquiry/network";
import { submitEnquiry, type EnquirySubmissionSource } from "@/lib/enquiry/submit";
import { logServerEvent } from "@/lib/log/server-log";
import { ENQUIRY_ERROR_MESSAGES } from "@/lib/validation/enquiry";

/** The pipeline reaches MongoDB and the Blob SDK, both of which need Node. */
export const runtime = "nodejs";

/**
 * Integration state is logged once per process, before the first submission is
 * handled. It is the quickest way to see, from a deployment's own logs, whether
 * the client has provisioned the vendors yet — the answer is a set of booleans
 * and never a secret (`lib/enquiry/config.ts`).
 */
let integrationStatusLogged = false;

const JSON_SOURCE = "application/json";
const FORM_SOURCE = "multipart/form-data";
const URLENCODED_SOURCE = "application/x-www-form-urlencoded";

const BASE_HEADERS: Record<string, string> = {
  // A mutation response is never cacheable, and must not be sniffed as another type.
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

function respond(status: number, body: EnquiryApiResponse, extraHeaders?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { ...BASE_HEADERS, ...extraHeaders },
  });
}

function genericFailure(status: number, requestId: string, retryAfterSeconds?: number) {
  return respond(
    status,
    {
      ok: false,
      requestId,
      formError: ENQUIRY_ERROR_MESSAGES.generic,
      fieldErrors: [],
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    },
    retryAfterSeconds === undefined ? undefined : { "retry-after": String(retryAfterSeconds) },
  );
}

/**
 * `06` §33 — CSRF. Returns `null` when the request is acceptable, or a reason
 * string when it is not.
 */
function crossOriginReason(request: NextRequest): string | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return "sec-fetch-site";

  const origin = request.headers.get("origin");
  if (!origin) return null;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return "unparseable-origin";
  }

  const requestHost = request.headers.get("host");
  if (!requestHost) return "missing-host";
  return originHost === requestHost ? null : "origin-mismatch";
}

async function readSource(
  request: NextRequest,
): Promise<{ source: EnquirySubmissionSource } | { error: "unsupported-type" | "unreadable" }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes(JSON_SOURCE)) {
    try {
      return { source: { kind: "json", body: await request.json() } };
    } catch {
      return { error: "unreadable" };
    }
  }

  if (contentType.includes(FORM_SOURCE) || contentType.includes(URLENCODED_SOURCE)) {
    try {
      return { source: { kind: "form", formData: await request.formData() } };
    } catch {
      return { error: "unreadable" };
    }
  }

  return { error: "unsupported-type" };
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!integrationStatusLogged) {
    integrationStatusLogged = true;
    logEnquiryIntegrationStatus();
  }

  // 1. Body ceiling, from the header, before anything is buffered.
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > ENQUIRY_MAX_REQUEST_BYTES) {
    logServerEvent({
      scope: "enquiry",
      event: "request_too_large",
      level: "warn",
      data: { declaredLength, limit: ENQUIRY_MAX_REQUEST_BYTES },
    });
    return genericFailure(
      ENQUIRY_API_STATUS.tooLarge,
      "request-rejected-before-read",
    );
  }

  // 2. Same-origin enforcement (06 §33).
  const originReason = crossOriginReason(request);
  if (originReason) {
    logServerEvent({
      scope: "enquiry",
      event: "origin_rejected",
      level: "warn",
      data: { reason: originReason },
    });
    return genericFailure(ENQUIRY_API_STATUS.forbidden, "request-rejected-before-read");
  }

  // 3. Transport parsing.
  const read = await readSource(request);
  if ("error" in read) {
    logServerEvent({
      scope: "enquiry",
      event: "request_unreadable",
      level: "warn",
      data: { reason: read.error, contentType: request.headers.get("content-type") ?? "none" },
    });
    return genericFailure(ENQUIRY_API_STATUS.invalid, "request-rejected-before-read");
  }

  // 4. The pipeline.
  try {
    const outcome = await submitEnquiry({
      source: read.source,
      turnstileHeaderToken: request.headers.get(ENQUIRY_TURNSTILE_HEADER),
      clientAddress: clientAddressFromHeaders(request.headers),
      hasUserAgent: request.headers.has("user-agent"),
    });

    if (outcome.ok) {
      return respond(ENQUIRY_API_STATUS.ok, { ok: true, requestId: outcome.requestId });
    }

    if (outcome.retryAfterSeconds !== undefined) {
      return respond(
        outcome.status,
        {
          ok: false,
          requestId: outcome.requestId,
          formError: outcome.formError,
          fieldErrors: outcome.fieldErrors,
          retryAfterSeconds: outcome.retryAfterSeconds,
        },
        { "retry-after": String(outcome.retryAfterSeconds) },
      );
    }

    return respond(outcome.status, {
      ok: false,
      requestId: outcome.requestId,
      formError: outcome.formError,
      fieldErrors: outcome.fieldErrors,
    });
  } catch (error) {
    // Transport-level backstop. The pipeline handles its own failures; anything
    // reaching here is a bug, and a bug must not become a stack trace on a public
    // page (06 §43).
    logServerEvent({
      scope: "enquiry",
      event: "unhandled_pipeline_error",
      level: "error",
      data: { error: error instanceof Error ? error.name : "unknown" },
    });
    return genericFailure(ENQUIRY_API_STATUS.serverError, "unhandled");
  }
}
