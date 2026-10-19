/**
 * The HTTP contract between the admin portal's screens and the admin API.
 *
 * Same purpose as `lib/enquiry/contract.ts`: both sides import this module so a
 * cookie name, a header name or a response key cannot change in one place and silently
 * break the other.
 *
 * **This module is client-safe by construction.** It has no Node imports, no `zod`
 * import and no environment access, so a client component can import it without pulling
 * `node:crypto` or a database driver into the browser bundle. That is why the cookie and
 * header names live here rather than in `lib/auth/session.ts`, which imports
 * `node:crypto`: `lib/auth/session.ts` and `lib/auth/csrf.ts` re-export these values, so
 * there is still exactly one declaration of each.
 */

/* -------------------------------------------------------------------------- */
/* Names                                                                       */
/* -------------------------------------------------------------------------- */

/** The `httpOnly` session cookie. `HttpOnly; Secure; SameSite=Lax; Path=/` — D-027. */
export const ADMIN_SESSION_COOKIE = "nicben_admin_session";

/**
 * The double-submit CSRF token cookie. Script-readable **on purpose**: the portal's
 * client code must echo its value in `ADMIN_CSRF_HEADER`, and being unable to do that
 * from a cross-site context is the entire mechanism (`lib/auth/csrf.ts`).
 */
export const ADMIN_CSRF_COOKIE = "nicben_admin_csrf";

/** The header a mutating request must echo `ADMIN_CSRF_COOKIE` in. */
export const ADMIN_CSRF_HEADER = "x-nicben-csrf";

/** Where an unauthenticated page request is sent. */
export const ADMIN_LOGIN_PATH = "/admin/login";

/** Where a successful login lands. */
export const ADMIN_HOME_PATH = "/admin";

/**
 * Session lifetime in seconds — eight hours. See `lib/auth/session.ts` for why this is
 * a constant rather than an environment variable.
 */
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                   */
/* -------------------------------------------------------------------------- */

/** Every admin API path, in one place, so the portal never hand-writes one. */
export const ADMIN_API = {
  login: "/api/admin/auth/login",
  logout: "/api/admin/auth/logout",
  session: "/api/admin/auth/session",
  enquiries: "/api/admin/enquiries",
  enquiry: (id: string) => `/api/admin/enquiries/${encodeURIComponent(id)}`,
  enquiryNotes: (id: string) => `/api/admin/enquiries/${encodeURIComponent(id)}/notes`,
  enquiriesExport: "/api/admin/enquiries/export",
  projects: "/api/admin/projects",
  project: (id: string) => `/api/admin/projects/${encodeURIComponent(id)}`,
  testimonials: "/api/admin/testimonials",
  testimonial: (id: string) => `/api/admin/testimonials/${encodeURIComponent(id)}`,
  pageContent: (pageKey: string) => `/api/admin/content/${encodeURIComponent(pageKey)}`,
  settings: "/api/admin/settings",
  auditLog: "/api/admin/audit",
} as const;

/* -------------------------------------------------------------------------- */
/* Envelope                                                                    */
/* -------------------------------------------------------------------------- */

export type AdminApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid"
  | "not-found"
  | "rate-limited"
  | "server-error";

export interface AdminApiFieldError {
  /** Dot path of the offending field. */
  field: string;
  /** Short, fixed description. Never a library message, never a submitted value. */
  message: string;
}

export interface AdminApiErrorBody {
  ok: false;
  error: AdminApiErrorCode;
  message: string;
  fieldErrors?: AdminApiFieldError[];
  retryAfterSeconds?: number;
}

export interface AdminApiSuccessBody<T> {
  ok: true;
  data: T;
}

export type AdminApiBody<T> = AdminApiSuccessBody<T> | AdminApiErrorBody;

/** Narrowing helper for the portal's `fetch` call sites. */
export function isAdminApiSuccess<T>(body: AdminApiBody<T>): body is AdminApiSuccessBody<T> {
  return body.ok;
}
