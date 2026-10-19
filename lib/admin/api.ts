/**
 * Admin API plumbing: the response envelope, the per-route guard wrapper, and the
 * error boundary. `docs/06-tech-and-security-spec.md` §27 (server-side session check
 * on every admin API), §32 (server-side validation), §33 (CSRF), §43 (no stack traces
 * to the client).
 *
 * Every admin route file is three things and nothing else:
 *
 * ```ts
 * export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/…">) {
 *   const { id } = await ctx.params;
 *   return adminApiRoute(request, async (api) => {
 *     // validate, act through the port, record an audit entry, return jsonOk(...)
 *   });
 * }
 * ```
 *
 * ### Why a wrapper rather than a call in each route
 *
 * The session check and the CSRF check happen **inside** `adminApiRoute`, before the
 * handler is reached. A route cannot forget them: there is no code path from the
 * request to the handler that skips them. That is the property
 * `docs/tasks/phase-06-hidden-admin-portal/admin-task.md` §29 asks for — "enumeration
 * passes by construction … not per-page copy-paste" — and it is verified by
 * `tests/phase-06/http-tests.mjs`, which enumerates the route files on disk, derives
 * the URL for each HTTP method they export, and asserts an unauthenticated `401`.
 *
 * ### Nothing internal crosses the boundary
 *
 * Every failure returns a fixed `{ ok: false, error, message }` built here. A thrown
 * error is logged with its **name only** and answered with `server-error`, so a driver
 * message carrying a connection string, a Zod issue carrying a schema path, or a stack
 * frame cannot reach a client (`06` §43, §37).
 *
 * Server-only.
 */

import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

import { getEnquiryRepository } from "../data/index";
import { logServerEvent } from "../log/server-log";
import { clientAddressFromHeaders } from "../enquiry/network";
import {
  ADMIN_CSRF_COOKIE,
  csrfInputFromHeaders,
  checkRequestOrigin,
  assessCsrf,
  type CsrfFailureReason,
} from "../auth/csrf";
import { AdminUnauthorizedError, requireAdminApiSession } from "../auth/guard";
import type { AdminSession } from "../auth/session";

/* -------------------------------------------------------------------------- */
/* Envelope                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The envelope types are declared in `lib/admin/contract.ts` — the client-safe module
 * both sides import — and re-exported here so a route file has one import. The
 * declarations are not repeated.
 */
export type {
  AdminApiBody,
  AdminApiErrorBody,
  AdminApiErrorCode,
  AdminApiFieldError,
  AdminApiSuccessBody,
} from "./contract";

import type {
  AdminApiErrorBody,
  AdminApiErrorCode,
  AdminApiFieldError,
  AdminApiSuccessBody,
} from "./contract";

/**
 * A mutation response is never cacheable and must not be sniffed as another type.
 * `Vary: Cookie` is explicit because the response is session-dependent and a shared
 * cache that ignored `Cache-Control` must still not serve one admin's data to another.
 */
const BASE_HEADERS: Record<string, string> = {
  "cache-control": "no-store, private",
  vary: "Cookie",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export function jsonOk<T>(data: T, init?: { status?: number; headers?: Record<string, string> }) {
  return Response.json({ ok: true, data } satisfies AdminApiSuccessBody<T>, {
    status: init?.status ?? 200,
    headers: { ...BASE_HEADERS, ...init?.headers },
  });
}

export function jsonError(
  status: number,
  error: AdminApiErrorCode,
  message: string,
  extra?: { fieldErrors?: AdminApiFieldError[]; retryAfterSeconds?: number },
) {
  const body: AdminApiErrorBody = {
    ok: false,
    error,
    message,
    ...(extra?.fieldErrors && extra.fieldErrors.length > 0
      ? { fieldErrors: extra.fieldErrors }
      : {}),
    ...(extra?.retryAfterSeconds === undefined
      ? {}
      : { retryAfterSeconds: extra.retryAfterSeconds }),
  };
  return Response.json(body, {
    status,
    headers:
      extra?.retryAfterSeconds === undefined
        ? BASE_HEADERS
        : { ...BASE_HEADERS, "retry-after": String(extra.retryAfterSeconds) },
  });
}

/** The one body an unauthenticated admin API request ever receives. */
export function jsonUnauthorized() {
  return jsonError(401, "unauthorized", "Authentication required.");
}

/** The one body a request that fails the CSRF checks ever receives. */
export function jsonForbidden(reason: CsrfFailureReason | "cross-origin") {
  return jsonError(403, "forbidden", `Request rejected (${reason}).`);
}

export function jsonNotFound(message = "Not found.") {
  return jsonError(404, "not-found", message);
}

export function jsonInvalid(fieldErrors: AdminApiFieldError[], message = "The request was rejected.") {
  return jsonError(400, "invalid", message, { fieldErrors });
}

export function jsonServerError() {
  // Deliberately says nothing. Everything worth knowing is in the server log
  // (`06` §43).
  return jsonError(500, "server-error", "The request could not be completed.");
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Map a Zod issue to a short, fixed description. Zod's own messages are never
 * returned: they are library text that changes between versions and can carry schema
 * detail, and `06` §43 wants a stable boundary.
 */
function describeIssueCode(code: string): string {
  switch (code) {
    case "invalid_type":
      return "has the wrong type";
    case "too_small":
      return "is too short or too small";
    case "too_big":
      return "is too long or too large";
    case "invalid_format":
    case "invalid_string":
      return "is not in the expected format";
    case "invalid_value":
    case "invalid_enum_value":
    case "invalid_union":
      return "is not one of the permitted values";
    case "unrecognized_keys":
      return "contains unknown fields";
    case "custom":
      return "is not permitted";
    default:
      return "is invalid";
  }
}

/** `["contact", "email"]` → `"contact.email"`. */
function issuePath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return "(request)";
  return path.map((segment) => String(segment)).join(".");
}

export type Validated<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Server-side validation (`06` §32). The schema is authoritative here and its output
 * — not the request — is what a handler stores, so a sanitisation transform inside the
 * schema cannot be bypassed by validating and then reading the raw input.
 */
export function validateBody<T>(schema: ZodType<T>, value: unknown): Validated<T> {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };

  const seen = new Set<string>();
  const fieldErrors: AdminApiFieldError[] = [];
  for (const issue of parsed.error.issues) {
    const field = issuePath(issue.path);
    if (seen.has(field)) continue;
    seen.add(field);
    fieldErrors.push({ field, message: describeIssueCode(issue.code) });
  }
  return { ok: false, response: jsonInvalid(fieldErrors) };
}

/* -------------------------------------------------------------------------- */
/* The wrapper                                                                 */
/* -------------------------------------------------------------------------- */

/** Body ceiling for an admin mutation. Admin payloads are form-sized; nothing is uploaded here. */
export const ADMIN_API_MAX_REQUEST_BYTES = 1 * 1024 * 1024;

export interface AdminApiContext {
  /** The verified session. The only source of actor identity (`lib/auth/guard.ts`). */
  session: AdminSession;
  /** The double-submit token the caller presented, for a handler that needs to re-issue. */
  csrfToken: string;
  request: NextRequest;
  url: URL;
  searchParams: URLSearchParams;
  /** Parsed JSON body, or `null` when the request has none or it is unreadable. */
  body: unknown;
  /** Raw address, for the audit entry. Hashed by `recordAuditEvent`, never stored raw. */
  clientAddress: string | null;
  /** Raw `User-Agent`, for the audit entry. Length-capped before storage. */
  userAgent: string | null;
  /** Convenience: the port. Re-read per request; `lib/data/index.ts` caches the adapter. */
  repository: Awaited<ReturnType<typeof getEnquiryRepository>>;
}

export interface AdminApiRouteOptions {
  /**
   * Whether the request must satisfy the double-submit CSRF check. Defaults to `true`
   * for every method except `GET`/`HEAD`, where nothing is mutated.
   */
  csrf?: boolean;
  /** Whether to read and parse a JSON body. Defaults to `true` for mutating methods. */
  body?: boolean;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Guard, validate and dispatch one admin API request.
 *
 * Failure modes, in the order they are evaluated:
 *
 * | Condition                                    | Response |
 * |----------------------------------------------|----------|
 * | no valid session                             | `401`    |
 * | declared body over the ceiling                | `413`    |
 * | CSRF layer 1 (cross-site metadata/origin)     | `403`    |
 * | CSRF layer 2 (double-submit token)            | `403`    |
 * | handler throws `AdminUnauthorizedError`        | `401`    |
 * | handler throws anything else                  | `500`    |
 *
 * The session check is first so that an unauthenticated probe of **any** admin API
 * receives `401` regardless of what else is wrong with the request — which is what
 * makes the enumeration table in the verification run meaningful.
 */
export async function adminApiRoute(
  request: NextRequest,
  handler: (api: AdminApiContext) => Promise<Response> | Response,
  options: AdminApiRouteOptions = {},
): Promise<Response> {
  const method = request.method.toUpperCase();
  const mutating = MUTATING_METHODS.has(method);
  const requireCsrf = options.csrf ?? mutating;
  const readBody = options.body ?? mutating;

  try {
    /* 1. Session — server-side, always (06 §27). --------------------------- */
    const session = await requireAdminApiSession();

    /* 2. Body ceiling, from the header, before the body is buffered. ------ */
    const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
    if (Number.isFinite(declaredLength) && declaredLength > ADMIN_API_MAX_REQUEST_BYTES) {
      logServerEvent({
        scope: "admin-api",
        event: "request_too_large",
        level: "warn",
        data: { declaredLength, limit: ADMIN_API_MAX_REQUEST_BYTES },
      });
      return jsonError(413, "invalid", "The request was rejected (too large).");
    }

    /* 3. CSRF (06 §33). ---------------------------------------------------- */
    const cookieToken = request.cookies.get(ADMIN_CSRF_COOKIE)?.value ?? null;
    if (requireCsrf) {
      const reason = assessCsrf(csrfInputFromHeaders(request.headers, cookieToken));
      if (reason) {
        logServerEvent({
          scope: "admin-api",
          event: "csrf_rejected",
          level: "warn",
          data: { reason, method, path: request.nextUrl.pathname, actor: session.adminId },
        });
        return jsonForbidden(reason);
      }
    } else {
      // Even where no token is required, a request that declares itself cross-site is
      // refused. There is no case in which this application wants one.
      const originReason = checkRequestOrigin({
        origin: request.headers.get("origin"),
        host: request.headers.get("host"),
        secFetchSite: request.headers.get("sec-fetch-site"),
      });
      if (originReason) {
        logServerEvent({
          scope: "admin-api",
          event: "origin_rejected",
          level: "warn",
          data: { reason: originReason, method, path: request.nextUrl.pathname },
        });
        return jsonForbidden(originReason);
      }
    }

    /* 4. Body. ------------------------------------------------------------- */
    let body: unknown = null;
    if (readBody) {
      try {
        const text = await request.text();
        body = text.length > 0 ? JSON.parse(text) : null;
      } catch {
        // An unreadable body is the handler's problem, not a transport error: the
        // schema rejects `null` and produces a field-level message the portal can
        // render.
        body = null;
      }
    }

    /* 5. Dispatch. --------------------------------------------------------- */
    return await handler({
      session,
      csrfToken: cookieToken ?? "",
      request,
      url: new URL(request.url),
      searchParams: new URL(request.url).searchParams,
      body,
      clientAddress: clientAddressFromHeaders(request.headers),
      userAgent: request.headers.get("user-agent"),
      repository: await getEnquiryRepository(),
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return jsonUnauthorized();
    }

    // A bug, a driver fault or a provider outage. `06` §43: name to the log,
    // nothing to the client.
    logServerEvent({
      scope: "admin-api",
      event: "unhandled_route_error",
      level: "error",
      data: {
        method,
        path: request.nextUrl.pathname,
        error: error instanceof Error ? error.name : "unknown",
      },
    });
    return jsonServerError();
  }
}

/**
 * The session cookie name, re-exported so a route that needs to clear it does not
 * import from two modules. Kept as a re-export rather than a second constant so the
 * name can only change in one place.
 */
export { ADMIN_SESSION_COOKIE } from "../admin/contract";
