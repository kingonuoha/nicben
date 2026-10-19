/**
 * Enquiry integration configuration.
 *
 * Every integration this phase touches is **optional at build time** and that is
 * the whole point: `decisions.md` D-019/D-020/D-022 were chosen so that "the
 * build, type-check, tests and deployment stay green with **zero environment
 * variables set**", letting the client provision MongoDB, Resend, Vercel Blob and
 * Cloudflare Turnstile later without a code change.
 *
 * The three integrations therefore each have an explicit tri-state, and the app
 * must behave correctly in the middle state:
 *
 * | Integration | Configured when              | Unconfigured behaviour                    |
 * |-------------|------------------------------|-------------------------------------------|
 * | Database    | `MONGODB_URI`                | dev adapter (D-019)                       |
 * | Attachments | `BLOB_READ_WRITE_TOKEN`      | **field not rendered** (D-020)            |
 * | Turnstile   | `TURNSTILE_SECRET_KEY`       | skipped in dev, **rejected in production** (D-022) |
 * | Email       | `RESEND_API_KEY` + `ENQUIRY_NOTIFY_TO` | enquiry persisted, notification flagged (D-021) |
 *
 * Server-only. Reads secrets, so it must never be imported from a client
 * component. The one value a browser needs — the Turnstile **site** key, which is
 * public by design — is exposed by `getTurnstileSiteKey()` and passed down as a
 * prop by a server component.
 */

import { logServerEvent } from "../log/server-log";

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/* -------------------------------------------------------------------------- */
/* Turnstile — decisions.md D-022                                              */
/* -------------------------------------------------------------------------- */

export function getTurnstileSecretKey(): string | null {
  return readEnv("TURNSTILE_SECRET_KEY");
}

/**
 * The site key is not a secret (Cloudflare publishes it to the browser), but it
 * is read server-side and handed to the client component as a prop. It is
 * deliberately **not** named `NEXT_PUBLIC_*`: D-024 fixes the variable list and
 * the brief calls it `TURNSTILE_SITE_KEY`.
 */
export function getTurnstileSiteKey(): string | null {
  return readEnv("TURNSTILE_SITE_KEY");
}

export function isTurnstileConfigured(): boolean {
  return getTurnstileSecretKey() !== null;
}

/**
 * Whether the `/contact` page should render the Turnstile widget. Only when a
 * secret exists — without one, verification cannot succeed, so presenting the
 * widget would be theatre. In production that combination rejects every
 * submission (D-022 "fail closed"), which is recorded as a launch prerequisite.
 */
export function isTurnstileWidgetEnabled(): boolean {
  return isTurnstileConfigured() && getTurnstileSiteKey() !== null;
}

/* -------------------------------------------------------------------------- */
/* Attachments — decisions.md D-020                                            */
/* -------------------------------------------------------------------------- */

/**
 * `decisions.md` D-020: "When `BLOB_READ_WRITE_TOKEN` is absent the attachment
 * field is not rendered at all." The `/contact` page calls this **on the server**
 * to decide whether to render the field, and `lib/enquiry/submit.ts` uses it to
 * refuse a file the form could not have offered — refusing rather than ignoring,
 * because "a 'your file was ignored' path is worse than an absent field".
 */
export function isAttachmentStorageConfigured(): boolean {
  return readEnv("BLOB_READ_WRITE_TOKEN") !== null;
}

export function getBlobReadWriteToken(): string | null {
  return readEnv("BLOB_READ_WRITE_TOKEN");
}

/* -------------------------------------------------------------------------- */
/* Email — decisions.md D-021                                                  */
/* -------------------------------------------------------------------------- */

export function getResendApiKey(): string | null {
  return readEnv("RESEND_API_KEY");
}

/** The inbox that receives enquiry notifications. */
export function getEnquiryNotificationRecipient(): string | null {
  return readEnv("ENQUIRY_NOTIFY_TO");
}

export function isEmailNotificationConfigured(): boolean {
  return getResendApiKey() !== null && getEnquiryNotificationRecipient() !== null;
}

/**
 * The notification sender.
 *
 * A verified sending domain is a client-provisioned item and D-024 fixes the
 * environment variable list, so there is no `ENQUIRY_NOTIFY_FROM`. Resend's own
 * documented sandbox sender is used until the client verifies a domain: it is a
 * Resend-owned address, so it cannot be mistaken for a NICBEN address, which is
 * what `decisions.md` D-012 forbids. **Recorded as a launch prerequisite** — mail
 * sent from the sandbox sender is restricted and must be replaced with the
 * client's verified domain before launch.
 */
export const NOTIFICATION_FROM_ADDRESS = "onboarding@resend.dev";

/* -------------------------------------------------------------------------- */
/* Diagnostics                                                                 */
/* -------------------------------------------------------------------------- */

export interface EnquiryIntegrationStatus {
  database: "mongodb" | "dev";
  attachments: boolean;
  turnstile: { required: boolean; widget: boolean };
  email: boolean;
}

/**
 * Non-secret integration state, for a health log line and for the phase
 * verification run. Contains booleans and a mode name only.
 */
export function getEnquiryIntegrationStatus(): EnquiryIntegrationStatus {
  const database = readEnv("MONGODB_URI") ? "mongodb" : "dev";
  return {
    database,
    attachments: isAttachmentStorageConfigured(),
    turnstile: {
      required: isTurnstileConfigured() || isProduction(),
      widget: isTurnstileWidgetEnabled(),
    },
    email: isEmailNotificationConfigured(),
  };
}

export function logEnquiryIntegrationStatus(): void {
  const status = getEnquiryIntegrationStatus();
  logServerEvent({
    scope: "enquiry",
    event: "integration_status",
    level: status.database === "dev" ? "warn" : "info",
    data: {
      database: status.database,
      attachments: status.attachments,
      turnstileRequired: status.turnstile.required,
      turnstileWidget: status.turnstile.widget,
      // Named `emailConfigured`, not `email`: the redaction pass in
      // `lib/log/server-log.ts` masks any key called `email`, and a boolean is
      // not a secret.
      emailConfigured: status.email,
      nodeEnv: process.env.NODE_ENV ?? "development",
    },
  });
}
