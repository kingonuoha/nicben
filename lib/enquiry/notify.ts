/**
 * Admin notification email — `decisions.md` **D-021** (Resend) and
 * `docs/06-tech-and-security-spec.md` §40 ("email templates escape content").
 *
 * Order is fixed by D-021: **persist first, then send.** This module never
 * decides whether an enquiry is stored; it reports the outcome of the send so the
 * caller can flag the stored record and still show the user the success card.
 *
 * Escaping rule, applied without exception: every value the sender supplied goes
 * through `escapeHtml` before it reaches the HTML body. The plain-text body
 * carries the same values unescaped, because a text part has no markup to escape
 * *for* — and it exists so the notification is readable in a client that refuses
 * HTML.
 *
 * The subject line contains **no sender-supplied value at all**. A subject is not
 * an HTML context, so escaping would not protect it, and newline injection into a
 * header is the classic failure mode. The subject is built from approved labels
 * only (`03-copy-deck.md:188`).
 *
 * Labels in the body are `03-copy-deck.md` §11 verbatim, so the admin sees the
 * same words the sender saw. Nothing in this file is authored copy.
 *
 * Server-only.
 */

import type { Enquiry, EnquiryNotification } from "../data/types";
import { logServerEvent } from "../log/server-log";
import { ENQUIRY_TYPE_LABEL_BY_VALUE, CONTACT_FORM_LABELS } from "../validation/enquiry-options";
import {
  getEnquiryNotificationRecipient,
  getResendApiKey,
  NOTIFICATION_FROM_ADDRESS,
} from "./config";
import { escapeHtml } from "./sanitise";

const SEND_TIMEOUT_MS = 10_000;

export interface EnquiryNotificationPayload {
  subject: string;
  html: string;
  text: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function row(label: string, value: string): string {
  return `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">${escapeHtml(
    label,
  )}</th><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`;
}

/**
 * Build the notification. Pure: it reads the record and returns the message, so
 * the escaping can be verified without sending anything.
 */
export function buildEnquiryNotification(enquiry: Enquiry): EnquiryNotificationPayload {
  const typeLabel = ENQUIRY_TYPE_LABEL_BY_VALUE[enquiry.enquiryType];

  const rows: Array<[string, string]> = [
    [CONTACT_FORM_LABELS.name, enquiry.name],
    [CONTACT_FORM_LABELS.email, enquiry.email],
  ];
  if (enquiry.phone) rows.push([CONTACT_FORM_LABELS.phone, enquiry.phone]);
  rows.push([CONTACT_FORM_LABELS.enquiryType, typeLabel]);
  if (enquiry.location) rows.push([CONTACT_FORM_LABELS.location, enquiry.location]);
  rows.push([CONTACT_FORM_LABELS.message, enquiry.message]);
  // 03-copy-deck.md:192 label, reused for the consent timestamp the record stores.
  rows.push([CONTACT_FORM_LABELS.consent, `Yes — recorded at ${enquiry.consentAt}`]);

  const attachments =
    enquiry.attachments.length > 0
      ? enquiry.attachments
          .map((attachment) => `${attachment.name} (${formatBytes(attachment.sizeBytes)})`)
          .join("\n")
      : "None";

  const html = [
    `<table role="presentation" cellspacing="0" cellpadding="0">`,
    ...rows.map(([label, value]) => row(label, value)),
    row(
      CONTACT_FORM_LABELS.attachments,
      enquiry.attachments.length > 0
        ? enquiry.attachments
            .map(
              (attachment) =>
                `${attachment.name} (${formatBytes(attachment.sizeBytes)}) — stored privately as ${attachment.storageKey}`,
            )
            .join("\n")
        : "None",
    ),
    `</table>`,
  ].join("");

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    `${CONTACT_FORM_LABELS.attachments}: ${attachments}`,
    "",
    `Enquiry reference: ${enquiry.id}`,
  ].join("\n");

  return {
    // No sender-supplied value in the subject, by construction.
    subject: `New website enquiry: ${typeLabel}`,
    html,
    text,
  };
}

function failureReference(error: unknown): string {
  // A short, non-personal reference only. Provider response bodies and messages
  // can echo the recipient address back, so they are never stored or logged
  // (`06` §43).
  if (error && typeof error === "object") {
    const candidate = error as { statusCode?: unknown; name?: unknown };
    if (typeof candidate.statusCode === "number") return `resend:${candidate.statusCode}`;
    if (typeof candidate.name === "string" && candidate.name.length > 0) {
      return `resend:${candidate.name.slice(0, 40)}`;
    }
  }
  if (error instanceof Error) return `resend:${error.name}`;
  return "resend:unknown-error";
}

/**
 * Attempt the notification and report the outcome as an `EnquiryNotification`
 * record. Never throws: a mail outage must not fail the submission (D-021).
 */
export async function sendEnquiryNotification(enquiry: Enquiry): Promise<EnquiryNotification> {
  const apiKey = getResendApiKey();
  const recipient = getEnquiryNotificationRecipient();

  if (!apiKey || !recipient) {
    logServerEvent({
      scope: "enquiry",
      event: "notification_skipped",
      level: "warn",
      data: {
        reason: !apiKey ? "RESEND_API_KEY is not set" : "ENQUIRY_NOTIFY_TO is not set",
        enquiryId: enquiry.id,
      },
    });
    return {
      configured: false,
      attemptedAt: null,
      delivered: false,
      error: "not-configured",
    };
  }

  const payload = buildEnquiryNotification(enquiry);
  const attemptedAt = new Date().toISOString();

  try {
    // Dynamic import keeps the SDK out of the module graph when email is not
    // configured — the credentials-absent build path (D-019/D-020/D-022).
    const { Resend } = await import("resend");
    const client = new Resend(apiKey);
    const result = await client.emails.send(
      {
        from: NOTIFICATION_FROM_ADDRESS,
        to: recipient,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      },
      // Bounded so a stalled vendor cannot hold the request open; Resend takes a
      // standard `AbortSignal` in its request options.
      { signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
    );

    const providerError = result.error;
    if (providerError) {
      const reference = failureReference(providerError);
      logServerEvent({
        scope: "enquiry",
        event: "notification_failed",
        level: "error",
        data: { enquiryId: enquiry.id, reference },
      });
      return { configured: true, attemptedAt, delivered: false, error: reference };
    }

    logServerEvent({
      scope: "enquiry",
      event: "notification_sent",
      level: "info",
      data: { enquiryId: enquiry.id },
    });
    return { configured: true, attemptedAt, delivered: true, error: null };
  } catch (error) {
    const reference = failureReference(error);
    logServerEvent({
      scope: "enquiry",
      event: "notification_failed",
      level: "error",
      data: { enquiryId: enquiry.id, reference, kind: "thrown" },
    });
    return { configured: true, attemptedAt, delivered: false, error: reference };
  }
}
