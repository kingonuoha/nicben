/**
 * Browser-side helpers for the admin portal's screens.
 *
 * Everything here is safe to import from a client component: no Node imports, no
 * `zod`, no environment access. It imports only `./contract`, which is
 * client-safe by construction.
 *
 * ### Why a wrapper instead of bare `fetch`
 *
 * Every mutating admin request must echo the CSRF token from `ADMIN_CSRF_COOKIE` in the
 * `ADMIN_CSRF_HEADER` header (`lib/auth/csrf.ts`). A bare `fetch` call that forgets it
 * receives `403`, and "the portal is broken" is a much worse failure mode than "the
 * portal cannot be attacked". `adminFetch` sets the header, sets
 * `credentials: "same-origin"` so the session cookie is attached, and normalises the
 * envelope so a call site cannot mis-read a failure as a success.
 *
 * ### The CSRF token is read from the cookie, not from state
 *
 * Deliberately not cached in a module variable or React state: the token is rotated on
 * every login, and a stale copy in memory would produce a `403` that looks like a
 * server bug. Reading `document.cookie` per request is cheap and cannot go stale.
 */

import {
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_HEADER,
  ADMIN_API,
  isAdminApiSuccess,
  type AdminApiBody,
  type AdminApiErrorBody,
} from "./contract";

/** Read the double-submit token. `null` when there is no session cookie pair yet. */
export function readAdminCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${ADMIN_CSRF_COOKIE}=`;
  for (const part of document.cookie.split(";")) {
    const entry = part.trim();
    if (entry.startsWith(prefix)) {
      const value = entry.slice(prefix.length);
      return value.length > 0 ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

export type AdminFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: AdminApiErrorBody };

export interface AdminFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON when present. */
  body?: unknown;
  /** Query string parameters. `undefined`, `null` and `""` values are omitted. */
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

function withQuery(path: string, query: AdminFetchOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const serialised = params.toString();
  return serialised.length > 0 ? `${path}?${serialised}` : path;
}

/**
 * Call an admin API endpoint.
 *
 * Never throws for an HTTP failure — a non-`2xx` resolves to `{ ok: false }` carrying
 * the server's own envelope, so a screen can render `error.message` and
 * `error.fieldErrors` without a `try`/`catch` around every call. It **does** throw for a
 * network failure (the request never reached the server), which the caller should treat
 * as "offline" rather than as a rejection.
 */
export async function adminFetch<T>(
  path: string,
  options: AdminFetchOptions = {},
): Promise<AdminFetchResult<T>> {
  const method = options.method ?? "GET";
  const mutating = method !== "GET";
  const headers: Record<string, string> = { accept: "application/json" };

  if (mutating) {
    headers["content-type"] = "application/json";
    const token = readAdminCsrfToken();
    if (token) headers[ADMIN_CSRF_HEADER] = token;
  }

  const response = await fetch(withQuery(path, options.query), {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: options.signal,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

  let body: AdminApiBody<T> | null = null;
  try {
    body = (await response.json()) as AdminApiBody<T>;
  } catch {
    // A non-JSON body means the response did not come from an admin route — a proxy
    // error page, for example. Reported as a failure with the status, never as data.
    body = null;
  }

  if (!body) {
    return {
      ok: false,
      status: response.status,
      error: {
        ok: false,
        error: response.status === 401 ? "unauthorized" : "server-error",
        message: "The server returned an unexpected response.",
      },
    };
  }

  if (isAdminApiSuccess(body)) {
    return { ok: true, status: response.status, data: body.data };
  }
  return { ok: false, status: response.status, error: body };
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

export interface AdminLoginResult {
  adminId: string;
  email: string;
  expiresAt: string;
}

/**
 * Sign in. On success the server has set both cookies; the caller only needs to
 * navigate.
 *
 * A `401` is the **only** outcome for any credential failure — unknown address, wrong
 * password, or a deployment with no admin configured (`lib/auth/login.ts`). A screen
 * must therefore never try to distinguish them, because there is nothing to distinguish.
 */
export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminFetchResult<{ adminId: string; email: string; expiresAt: string }>> {
  return adminFetch(ADMIN_API.login, { method: "POST", body: { email, password } });
}

/** Clear both cookies server-side. Expiry is the real revocation; this ends the session in the browser. */
export async function adminLogout(): Promise<AdminFetchResult<{ loggedOut: true }>> {
  return adminFetch(ADMIN_API.logout, { method: "POST" });
}

/* -------------------------------------------------------------------------- */
/* CSV download                                                                */
/* -------------------------------------------------------------------------- */

export interface AdminDownloadResult {
  ok: boolean;
  status: number;
  /** The response body as text. `""` when the request failed. */
  text: string;
  /** Parsed from `Content-Disposition` when the server set one. */
  filename: string | null;
  /** The envelope, when a failure was answered with JSON rather than a file. */
  error: AdminApiErrorBody | null;
}

/**
 * Download the CSV export.
 *
 * Separate from `adminFetch` because the export is not the JSON envelope — asking one
 * function to return either a parsed envelope or raw text would make every call site
 * decide which it received, and a call site that guessed wrong would treat an error page
 * as a spreadsheet.
 */
export async function adminDownloadCsv(query?: AdminFetchOptions["query"]): Promise<AdminDownloadResult> {
  const response = await fetch(withQuery(ADMIN_API.enquiriesExport, query), {
    method: "GET",
    headers: { accept: "text/csv" },
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });

  const text = await response.text();
  if (!response.ok || !response.headers.get("content-type")?.includes("text/csv")) {
    let error: AdminApiErrorBody | null = null;
    try {
      const parsed = JSON.parse(text) as AdminApiBody<unknown>;
      if (!parsed.ok) error = parsed;
    } catch {
      error = null;
    }
    return { ok: false, status: response.status, text: "", filename: null, error };
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  return { ok: true, status: response.status, text, filename: match ? match[1] : null, error: null };
}
