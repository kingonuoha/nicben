/**
 * Cloudflare Turnstile verification — `decisions.md` **D-022**.
 *
 * The decision, in full: "When `TURNSTILE_SECRET_KEY` is absent, verification is
 * **skipped only when `NODE_ENV !== "production"`**, with a logged warning. In
 * production it **rejects**. The honeypot is always active regardless."
 *
 * So there are four outcomes, not two:
 *
 * | Secret | Token | `NODE_ENV`  | Outcome                                  |
 * |--------|-------|-------------|------------------------------------------|
 * | set    | sent  | any         | verified against Cloudflare; fail closed |
 * | set    | none  | any         | rejected (`missing-token`)               |
 * | absent | any   | development | **skipped**, warning logged              |
 * | absent | any   | production  | rejected (`not-configured`) — fail closed |
 *
 * "Fail closed" also covers the network: a timeout, a non-2xx response or an
 * unparseable body is a rejection, never an accidental pass. An unverified
 * submission is exactly the case the control exists for.
 *
 * The token is single-use and short-lived, so it is sent straight to Cloudflare
 * and never stored or logged.
 *
 * Server-only.
 */

import { logServerEvent } from "../log/server-log";
import { getTurnstileSecretKey } from "./config";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5000;

export type TurnstileRejectionReason =
  | "not-configured"
  | "missing-token"
  | "rejected"
  | "verification-error";

export type TurnstileResult =
  | { ok: true; verified: boolean; skipped: boolean }
  | { ok: false; reason: TurnstileRejectionReason; codes: string[] };

interface SiteVerifyResponse {
  success?: unknown;
  "error-codes"?: unknown;
}

/** Cloudflare's codes are short identifiers; keep them, discard anything else. */
function readErrorCodes(body: SiteVerifyResponse): string[] {
  const raw = body["error-codes"];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((code): code is string => typeof code === "string")
    .map((code) => code.slice(0, 64))
    .slice(0, 8);
}

export interface TurnstileVerificationInput {
  /** Value of the `cf-turnstile-response` field, or `null` when none was sent. */
  token: string | null;
  /** Network address, passed to Cloudflare for its own risk scoring. */
  remoteAddress?: string | null;
}

export async function verifyTurnstileToken(
  input: TurnstileVerificationInput,
): Promise<TurnstileResult> {
  const secret = getTurnstileSecretKey();
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (!isProduction) {
      // D-022: development and test are allowed to run without credentials so
      // the build and the pipeline tests do not depend on a Cloudflare account.
      logServerEvent({
        scope: "enquiry",
        event: "turnstile_skipped",
        level: "warn",
        data: {
          reason: "TURNSTILE_SECRET_KEY is not set",
          nodeEnv: process.env.NODE_ENV ?? "development",
        },
      });
      return { ok: true, verified: false, skipped: true };
    }
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_not_configured",
      level: "error",
      data: { reason: "TURNSTILE_SECRET_KEY is required in production (D-022)" },
    });
    return { ok: false, reason: "not-configured", codes: [] };
  }

  const token = input.token?.trim();
  if (!token) {
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_missing_token",
      level: "warn",
      data: {},
    });
    return { ok: false, reason: "missing-token", codes: [] };
  }

  const form = new URLSearchParams({ secret, response: token });
  if (input.remoteAddress) form.set("remoteip", input.remoteAddress);

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      // Fail closed on a slow vendor: a hung verification must not hold a
      // request open until the platform timeout.
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_verification_error",
      level: "error",
      data: { kind: "network", error: error instanceof Error ? error.name : "unknown" },
    });
    return { ok: false, reason: "verification-error", codes: [] };
  }

  if (!response.ok) {
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_verification_error",
      level: "error",
      data: { kind: "http", status: response.status },
    });
    return { ok: false, reason: "verification-error", codes: [] };
  }

  let body: SiteVerifyResponse;
  try {
    body = (await response.json()) as SiteVerifyResponse;
  } catch {
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_verification_error",
      level: "error",
      data: { kind: "parse" },
    });
    return { ok: false, reason: "verification-error", codes: [] };
  }

  if (body.success !== true) {
    const codes = readErrorCodes(body);
    logServerEvent({
      scope: "enquiry",
      event: "turnstile_rejected",
      level: "warn",
      data: { codes: codes.length > 0 ? codes : ["unspecified"] },
    });
    return { ok: false, reason: "rejected", codes };
  }

  return { ok: true, verified: true, skipped: false };
}
