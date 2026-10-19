"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";

import { Button } from "@/components/ui/Button";
import type { EnquiryType } from "@/lib/data/types";
import {
  ENQUIRY_ATTACHMENT_FIELD,
  ENQUIRY_ENDPOINT,
  isEnquiryApiSuccess,
  type EnquiryApiResponse,
} from "@/lib/enquiry/contract";
import {
  CONTACT_FORM_COPY,
  CONTACT_FORM_LABELS,
  ENQUIRY_ERROR_MESSAGES,
  ENQUIRY_FIELDS,
  ENQUIRY_HONEYPOT_FIELD,
  ENQUIRY_TYPE_OPTIONS,
  enquiryFieldMessage,
  type EnquiryField,
} from "@/lib/validation/enquiry-options";

/**
 * The `/contact` enquiry form.
 *
 * **Client component; the page around it stays a server component** so the two
 * integration switches and the public Turnstile site key are decided on the
 * server and handed down as plain props (`app/contact/page.tsx`).
 *
 * Three rules shape everything below:
 *
 * 1. **Copy is never authored here.** Every visible string is imported from
 *    `@/lib/validation/enquiry-options`, a transcription of
 *    `docs/03-copy-deck.md` §11 (`:182`–`:196`) that records the deck line beside
 *    each entry. The only literals in this file are structural (`max 5 MB per
 *    file`, from `:191`) or accessibility plumbing. `decisions.md` D-008.
 *
 * 2. **Client-side validation is convenience only.**
 *    `docs/06-tech-and-security-spec.md` §32 — "Server-side validation of every
 *    input (Zod) … never trust client validation". Nothing here is authoritative;
 *    it exists to save a round trip and it reports the *same six approved
 *    messages* the endpoint returns, so a user never meets a second vocabulary.
 *
 * 3. **Nothing submitted is ever re-rendered.** A failed submission leaves the
 *    user's own values in the controls, but the response body is read only for
 *    `fieldErrors` / `formError`, which carry approved messages and field names,
 *    never a submitted value (`06` §40).
 */

/**
 * Control shell — `docs/04-design-system.md` §5: "Large inputs (52px),
 * `--radius-md`, visible labels (not placeholder-only), inline validation
 * messages". Placeholders are deliberately absent: the design screen's example
 * values ("e.g. Austin, TX or Chicago, IL") have no deck line, and one of them
 * would imply an unconfirmed service area.
 */
const CONTROL_BASE =
  "w-full px-4 rounded-md bg-surface border text-base text-text-900 " +
  "transition-colors duration-[var(--motion-dur-fast)] motion-reduce:transition-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-brand-700 disabled:opacity-50 disabled:cursor-not-allowed";

/** The documented 52px control height (`04` §5), on the 4px spacing scale. */
const CONTROL_HEIGHT = "h-[52px]";

/** Visible label treatment, shared by every control so the rhythm is identical. */
const LABEL_CLASS = "block text-sm font-semibold text-ink-950";

/**
 * Inline validation message.
 *
 * The text is `--ink-950` with a `--status-error` rule rather than
 * `--status-error` text: `#D64545` on white measures 4.38:1 — just under the
 * 4.5:1 AA threshold for normal-size text — so the error is carried by the rule
 * and the message keeps full contrast. No raw colour value appears here; both
 * are tokens (D-003).
 */
const ERROR_TEXT_CLASS =
  "mt-2 border-l-2 border-status-error pl-2 text-xs font-semibold text-ink-950";

/** The `(optional)` marker the deck supplies on the three optional fields. */
const OPTIONAL_MARKER = "(optional)";

/**
 * Convenience-only attachment bounds. The authoritative pair lives in
 * `lib/enquiry/attachments.ts` (`ATTACHMENT_MAX_BYTES`, `ATTACHMENT_ALLOWED_*`),
 * which is server-only (it imports `node:crypto`) and so cannot be imported by a
 * browser component. The user-visible limits are `docs/03-copy-deck.md:191` —
 * "max 5 MB per file, JPG, PNG, PDF" — and these mirror exactly that.
 */
const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const ATTACHMENT_ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];

/**
 * Convenience-only field bounds, mirroring `ENQUIRY_LIMITS` in
 * `lib/validation/enquiry.ts`. They are restated here rather than imported
 * because that module is the Zod schema module and importing it into a client
 * component would pull the schema engine into the browser bundle
 * (`lib/validation/enquiry-options.ts` exists for exactly this reason — but it
 * does not carry the limits). None of these is published copy: only
 * `messageMin` is user-visible (`docs/03-copy-deck.md:190` — "min 20 chars"),
 * and every one of them is re-checked authoritatively on the server (`06` §32).
 */
const ENQUIRY_LIMITS = {
  name: 100,
  email: 254,
  phone: 32,
  location: 120,
  messageMin: 20,
  messageMax: 5000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turnstile's browser API, as far as this form needs it. */
declare global {
  interface Window {
    turnstile?: {
      reset: (widget?: string | HTMLElement) => void;
    };
  }
}

export interface ContactFormProps {
  /** D-020 — when false the attachment field is absent, never silently ignored. */
  attachmentUploadEnabled: boolean;
  /** Public Turnstile site key, or `null` when the widget must not render. */
  turnstileSiteKey: string | null;
  /** Resolved `?enquiry=` value, already mapped to a stored type. */
  defaultEnquiryType: EnquiryType | null;
}

type SubmitState = "idle" | "submitting" | "error" | "success";
type FieldErrors = Partial<Record<EnquiryField, string>>;
type FocusTarget = "summary" | EnquiryField;

function extensionOf(filename: string): string {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(filename);
  return match ? match[1].toLowerCase() : "";
}

function readValue(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function errorId(field: EnquiryField): string {
  return `contact-${field}-error`;
}

function hintId(field: EnquiryField): string {
  return `contact-${field}-hint`;
}

/** Join the hint and the error into one `aria-describedby` value, or nothing. */
function describedBy(field: EnquiryField, hasError: boolean, hasHint = false): string | undefined {
  const ids = [hasHint ? hintId(field) : null, hasError ? errorId(field) : null].filter(
    (id): id is string => id !== null,
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  attachmentUploadEnabled,
  turnstileSiteKey,
  defaultEnquiryType,
}) => {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  /** Text for the polite live region — always an approved message, never input. */
  const [announcement, setAnnouncement] = useState("");
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = submitState === "submitting";
  const isSuccess = submitState === "success";

  /**
   * Move focus once the state that renders the target has committed.
   *
   * Focusing the first invalid control — or the error summary when the failure
   * is form-level — is what makes the `aria-describedby` message reach a
   * screen-reader user: the message exists in the DOM before this effect runs, so
   * the reference resolves.
   */
  useEffect(() => {
    if (focusTarget === null) return;

    if (focusTarget === "summary") {
      summaryRef.current?.focus();
    } else {
      const element = formRef.current?.elements.namedItem(focusTarget);
      if (element instanceof HTMLElement) {
        element.focus();
      } else if (element instanceof NodeList && element.length > 0) {
        // A radio group resolves to a RadioNodeList; focus its first member.
        const first = element[0];
        if (first instanceof HTMLElement) first.focus();
      }
    }

    setFocusTarget(null);
  }, [focusTarget]);

  /** The success card replaces the form (`04` §5), so it takes focus when it lands. */
  useEffect(() => {
    if (isSuccess) successRef.current?.focus();
  }, [isSuccess]);

  /**
   * A Turnstile token is single-use, so after a rejected submission the widget is
   * reset; otherwise the next attempt replays a spent token and fails again.
   */
  const resetTurnstile = () => {
    const widget = document.querySelector<HTMLElement>(".cf-turnstile");
    if (widget && window.turnstile) {
      try {
        window.turnstile.reset(widget);
      } catch {
        /* The widget was never rendered; nothing to reset. */
      }
    }
  };

  const filesFromInput = (): File[] =>
    attachmentUploadEnabled ? Array.from(fileInputRef.current?.files ?? []) : [];

  function validateLocally(form: HTMLFormElement, files: File[]): FieldErrors {
    const data = new FormData(form);
    const errors: FieldErrors = {};

    if (readValue(data, "name").trim().length === 0) {
      errors.name = enquiryFieldMessage("name");
    }
    if (!EMAIL_PATTERN.test(readValue(data, "email").trim())) {
      errors.email = enquiryFieldMessage("email");
    }
    if (readValue(data, "enquiryType").trim().length === 0) {
      errors.enquiryType = enquiryFieldMessage("enquiryType");
    }
    if (readValue(data, "message").trim().length < ENQUIRY_LIMITS.messageMin) {
      errors.message = enquiryFieldMessage("message");
    }

    const rejected = files.some((file) => {
      const typeAllowed =
        ATTACHMENT_ACCEPTED_MIME.includes(file.type.trim().toLowerCase()) ||
        ATTACHMENT_ACCEPTED_EXTENSIONS.includes(extensionOf(file.name));
      return !typeAllowed || file.size <= 0 || file.size > ATTACHMENT_MAX_BYTES;
    });
    if (rejected) {
      errors.attachments = enquiryFieldMessage("attachments");
    }

    return errors;
  }

  function reportErrors(errors: FieldErrors, formMessage: string | null) {
    setFieldErrors(errors);
    setFormError(formMessage);
    setSubmitState("error");

    const firstField = ENQUIRY_FIELDS.find((field) => errors[field] !== undefined);
    // The announced text is always one of the six approved strings.
    setAnnouncement(formMessage ?? (firstField ? errors[firstField] ?? "" : ""));
    setFocusTarget(firstField ?? "summary");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;

    const errors = validateLocally(form, filesFromInput());
    if (Object.keys(errors).length > 0) {
      reportErrors(errors, null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setAnnouncement("");
    setSubmitState("submitting");

    try {
      const response = await fetch(ENQUIRY_ENDPOINT, {
        method: "POST",
        // `FormData` from the live form: multipart, so `attachments` (a repeated
        // field) and the Turnstile token written into `cf-turnstile-response`
        // travel exactly as the endpoint documents (`lib/enquiry/contract.ts`).
        body: new FormData(form),
        headers: { accept: "application/json" },
      });

      let payload: EnquiryApiResponse | null = null;
      try {
        payload = (await response.json()) as EnquiryApiResponse;
      } catch {
        payload = null;
      }

      if (payload && isEnquiryApiSuccess(payload)) {
        setFieldErrors({});
        setFormError(null);
        setAnnouncement(CONTACT_FORM_COPY.successMessage);
        setSubmitState("success");
        return;
      }

      /*
        Failure mapping. Every string below is one of the six approved messages.
        The endpoint reuses the *generic* message for the conditions the deck
        supplies no string for — unticked consent, a rate-limit refusal (`429`),
        a Turnstile rejection (`403`), a storage outage (`500`) and an over-large
        body (`413`) — so this form mirrors that mapping instead of inventing a
        more specific sentence for any of them.
      */
      const nextErrors: FieldErrors = {};
      for (const entry of payload?.fieldErrors ?? []) {
        nextErrors[entry.field] = entry.message;
      }
      const hasFieldErrors = Object.keys(nextErrors).length > 0;
      const formMessage =
        payload?.formError ?? (hasFieldErrors ? null : ENQUIRY_ERROR_MESSAGES.generic);

      if (turnstileSiteKey) resetTurnstile();

      reportErrors(nextErrors, formMessage);
    } catch {
      // The request never completed. The sender cannot distinguish this from any
      // other server-side fault, so the generic approved message is used.
      reportErrors({}, ENQUIRY_ERROR_MESSAGES.generic);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Attachment intake — browse and drag/drop                               */
  /* ---------------------------------------------------------------------- */

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(event.currentTarget.files ?? []));
    setFieldErrors((previous) => {
      if (previous.attachments === undefined) return previous;
      const next = { ...previous };
      delete next.attachments;
      return next;
    });
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const input = fileInputRef.current;
    const dropped = event.dataTransfer?.files;
    if (!input || !dropped || dropped.length === 0) return;
    try {
      input.files = dropped;
    } catch {
      // FileList assignment is not supported everywhere. Drag/drop is a
      // convenience only; the browse control below is the accessible path and
      // stays fully functional either way.
      return;
    }
    setSelectedFiles(Array.from(input.files ?? []));
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (isSuccess) {
    return (
      <div className="rounded-lg bg-surface border border-line shadow-card p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        {/*
          `docs/03-copy-deck.md:194`, verbatim — and the whole card.
          `docs/04-design-system.md` §5: "success state as a full card replacing
          the form". The design screen's `Reference Token`, `Routing Team`,
          `Expected Response`, `Priority Intake Queued` rows and its
          `Submit another scope inquiry` button all have no deck line and are
          deleted (D-008); the omissions are recorded in the completion notes.
        */}
        <div
          ref={successRef}
          tabIndex={-1}
          className="form-state-in flex flex-col items-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          <span
            className="w-16 h-16 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          </span>
          <p className="mt-6 text-lg sm:text-xl font-semibold text-ink-950 leading-relaxed max-w-md">
            {CONTACT_FORM_COPY.successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface border border-line shadow-card p-5 sm:p-6 lg:p-8">
      {/*
        Polite live region, mounted before the form so that a change to its text
        is reliably announced. Its content is always one of the six approved
        messages (`03-copy-deck.md:195`).
      */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <form
        id="contact-form"
        ref={formRef}
        /*
          A real `action` and `method`, so this is a working HTML form rather than
          a JavaScript-only widget: with scripting unavailable the browser posts
          the same multipart body the endpoint documents. (The endpoint answers
          JSON, so the no-JavaScript path shows that response instead of the
          success card — stated as a limitation, not hidden.)
        */
        action={ENQUIRY_ENDPOINT}
        method="post"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        /* Native validation messages are browser copy, in the browser's language.
           Every message the user sees must be an approved string, so native
           bubbles are off and the check runs in this component and on the server. */
        noValidate
        className="flex flex-col gap-6"
      >
        {/*
          Honeypot — always active, independent of Turnstile
          (`docs/06-tech-and-security-spec.md` §13, D-022). Hidden from users and
          from assistive technology while staying present for the parser. A filled
          value is discarded silently by the endpoint with a success-shaped
          response, so an automated client gets no signal. It carries no label
          because any label text would be authored copy (D-008) and it is
          `aria-hidden` regardless.
        */}
        <div className="sr-only" aria-hidden="true">
          <input
            type="text"
            id="contact-company-website"
            name={ENQUIRY_HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/*
          Error summary, for the approved messages that cannot be attributed to a
          single control. Field-level messages render beneath their own control
          and are wired in with `aria-describedby`.
        */}
        {formError && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            className="form-error-in rounded-md border border-line border-l-4 border-l-status-error bg-tint-50 p-4 text-sm font-semibold text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            {formError}
          </div>
        )}

        {/* 1. Enquiry type — the design's segmented three-option group.
            `03-copy-deck.md:188` supplies exactly three options, and
            `docs/06-tech-and-security-spec.md` §62 with D-002 is why there is no
            investment option: Pillar 3 must never be rendered by anything that
            could read as collecting investments. */}
        <fieldset className="min-w-0">
          <legend className={`${LABEL_CLASS} mb-2`}>
            {CONTACT_FORM_LABELS.enquiryType}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ENQUIRY_TYPE_OPTIONS.map((option) => {
              const hasError = fieldErrors.enquiryType !== undefined;
              return (
                <label key={option.value} className="cursor-pointer h-full">
                  <input
                    type="radio"
                    name="enquiryType"
                    value={option.value}
                    required
                    defaultChecked={option.value === defaultEnquiryType}
                    aria-invalid={hasError || undefined}
                    aria-describedby={describedBy("enquiryType", hasError)}
                    /* `sr-only`, never `hidden`: the input stays focusable and
                       arrow-key navigable, so the group behaves like the radio
                       group it is. */
                    className="peer sr-only"
                  />
                  <span className="flex h-full items-start gap-3 rounded-md border border-line bg-tint-50 p-4 text-sm font-semibold text-text-600 transition-colors duration-[var(--motion-dur-fast)] motion-reduce:transition-none hover:bg-tint-100 peer-checked:border-ink-950 peer-checked:bg-ink-950 peer-checked:text-surface peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                    <span
                      className="w-4 h-4 mt-0.5 rounded-full border border-current flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                    <span>{option.label}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {fieldErrors.enquiryType && (
            <p id={errorId("enquiryType")} className={ERROR_TEXT_CLASS}>
              {fieldErrors.enquiryType}
            </p>
          )}
        </fieldset>

        {/* 2. Name + email — the design's two-column row (`:185`, `:186`). */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className={LABEL_CLASS}>
              {CONTACT_FORM_LABELS.name}
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              maxLength={ENQUIRY_LIMITS.name}
              autoComplete="name"
              aria-invalid={fieldErrors.name !== undefined || undefined}
              aria-describedby={describedBy("name", fieldErrors.name !== undefined)}
              className={`mt-2 ${CONTROL_HEIGHT} ${CONTROL_BASE} ${
                fieldErrors.name ? "border-status-error" : "border-line"
              }`}
            />
            {fieldErrors.name && (
              <p id={errorId("name")} className={ERROR_TEXT_CLASS}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className={LABEL_CLASS}>
              {CONTACT_FORM_LABELS.email}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              maxLength={ENQUIRY_LIMITS.email}
              autoComplete="email"
              aria-invalid={fieldErrors.email !== undefined || undefined}
              aria-describedby={describedBy("email", fieldErrors.email !== undefined)}
              className={`mt-2 ${CONTROL_HEIGHT} ${CONTROL_BASE} ${
                fieldErrors.email ? "border-status-error" : "border-line"
              }`}
            />
            {fieldErrors.email && (
              <p id={errorId("email")} className={ERROR_TEXT_CLASS}>
                {fieldErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* 3. Phone + location — both optional, each marked with the deck's own
            `(optional)` marker (`:187`, `:189`). Neither has an approved failure
            message, because the server normalises them rather than rejecting
            them (`lib/validation/enquiry.ts`). */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-phone" className={LABEL_CLASS}>
              {CONTACT_FORM_LABELS.phone}{" "}
              <span id={hintId("phone")} className="font-normal text-text-600">
                {OPTIONAL_MARKER}
              </span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              maxLength={ENQUIRY_LIMITS.phone}
              autoComplete="tel"
              aria-describedby={describedBy("phone", false, true)}
              className={`mt-2 ${CONTROL_HEIGHT} ${CONTROL_BASE} border-line`}
            />
          </div>

          <div>
            <label htmlFor="contact-location" className={LABEL_CLASS}>
              {CONTACT_FORM_LABELS.location}{" "}
              <span id={hintId("location")} className="font-normal text-text-600">
                {OPTIONAL_MARKER}
              </span>
            </label>
            <input
              id="contact-location"
              name="location"
              type="text"
              maxLength={ENQUIRY_LIMITS.location}
              autoComplete="address-level2"
              aria-describedby={describedBy("location", false, true)}
              className={`mt-2 ${CONTROL_HEIGHT} ${CONTROL_BASE} border-line`}
            />
          </div>
        </div>

        {/* 4. Message — `:190` states the minimum as "min 20 chars"; that deck
            fragment is published as the hint and enforced by `minLength`. The
            design's `Min. 20 characters` had no deck line and was not used. */}
        <div>
          <label htmlFor="contact-message" className={LABEL_CLASS}>
            {CONTACT_FORM_LABELS.message}{" "}
            <span id={hintId("message")} className="font-normal text-text-600">
              min 20 chars
            </span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            minLength={ENQUIRY_LIMITS.messageMin}
            maxLength={ENQUIRY_LIMITS.messageMax}
            aria-invalid={fieldErrors.message !== undefined || undefined}
            aria-describedby={describedBy("message", fieldErrors.message !== undefined, true)}
            className={`mt-2 min-h-32 py-3 resize-y ${CONTROL_BASE} ${
              fieldErrors.message ? "border-status-error" : "border-line"
            }`}
          />
          {fieldErrors.message && (
            <p id={errorId("message")} className={ERROR_TEXT_CLASS}>
              {fieldErrors.message}
            </p>
          )}
        </div>

        {/* 5. Attachments — rendered only when private storage is configured
            (D-020). When it is not, the field is absent rather than accepting a
            file the endpoint would refuse; `lib/enquiry/submit.ts` refuses it
            too, so the two halves agree. */}
        {attachmentUploadEnabled && (
          <div>
            <span id={hintId("attachments")} className={LABEL_CLASS}>
              {CONTACT_FORM_LABELS.attachments}{" "}
              <span className="font-normal text-text-600">{OPTIONAL_MARKER}</span>
            </span>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-2 rounded-md border border-dashed p-5 text-center transition-colors duration-[var(--motion-dur-fast)] motion-reduce:transition-none ${
                isDragging ? "border-brand-500 bg-tint-100" : "border-line bg-tint-50"
              } ${fieldErrors.attachments ? "border-status-error" : ""}`}
            >
              <input
                ref={fileInputRef}
                id="contact-attachments"
                name={ENQUIRY_ATTACHMENT_FIELD}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                aria-labelledby={hintId("attachments")}
                aria-describedby={describedBy(
                  "attachments",
                  fieldErrors.attachments !== undefined,
                )}
                aria-invalid={fieldErrors.attachments !== undefined || undefined}
                onChange={handleFileChange}
                className="peer sr-only"
              />
              <label
                htmlFor="contact-attachments"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-sm p-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700"
              >
                <span
                  className="w-12 h-12 rounded-full bg-surface border border-line text-brand-700 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19V5m0 0L8 9m4-4l4 4"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15" />
                  </svg>
                </span>
                {/* `03-copy-deck.md:191` — "max 5 MB per file, JPG, PNG, PDF".
                    The type hint is the backend's own exported constant, so the
                    text and the `accept` list cannot drift apart. */}
                <span className="text-xs text-text-600">
                  {CONTACT_FORM_COPY.attachmentHint} · max 5 MB per file
                </span>
              </label>

              {selectedFiles.length > 0 && (
                <ul className="mt-2 flex flex-wrap justify-center gap-2">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="max-w-full truncate rounded-pill bg-tint-100 border border-line px-3 py-1 text-xs font-semibold text-text-600"
                    >
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {fieldErrors.attachments && (
              <p id={errorId("attachments")} className={ERROR_TEXT_CLASS}>
                {fieldErrors.attachments}
              </p>
            )}
          </div>
        )}

        {/* 6. Consent — `:192` verbatim, with the deck's "(link to Privacy)"
            instruction satisfied by a link whose text is the deck's own `Privacy`
            label (`:14`, §13). An unticked box has no approved failure message,
            so the endpoint reports the generic message against the consent field
            and this form mirrors that rather than authoring a sentence. */}
        <div className="flex items-start gap-3">
          <input
            id="contact-consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={fieldErrors.consent !== undefined || undefined}
            aria-describedby={describedBy("consent", fieldErrors.consent !== undefined)}
            className="mt-0.5 w-5 h-5 shrink-0 rounded-sm border border-line accent-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          />
          <div>
            <label
              htmlFor="contact-consent"
              className="text-sm text-text-600 leading-relaxed"
            >
              {CONTACT_FORM_LABELS.consent}{" "}
              <Link
                href="/privacy"
                className="font-semibold text-brand-700 hover:text-ink-950 underline-offset-2 hover:underline rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Privacy
              </Link>
            </label>
            {fieldErrors.consent && (
              <p id={errorId("consent")} className={ERROR_TEXT_CLASS}>
                {fieldErrors.consent}
              </p>
            )}
          </div>
        </div>

        {/* 7. Turnstile — rendered only when a secret and a site key are both
            present (D-022). Cloudflare's implicit rendering writes the token into
            a hidden `cf-turnstile-response` input inside this form, so the
            multipart body carries it with no extra wiring. The design's
            `Protected by Cloudflare Turnstile` / `SSL 256-Bit Encrypted` strip
            has no deck line and is not reproduced. */}
        {turnstileSiteKey && (
          <>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
            />
            <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
          </>
        )}

        {/* 8. Submit — `:193`, the deck's button label, through the shared
            `Button` primitive rather than a fork. The design's `Direct assignment
            within 24 business hours` supporting line is a response-time claim and
            is omitted along with the rest of the response-time copy. */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            withArrow
            disabled={isSubmitting}
          >
            {CONTACT_FORM_COPY.submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};
