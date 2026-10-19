"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { adminFetch } from "@/lib/admin/client";
import { ADMIN_API } from "@/lib/admin/contract";
import type { Setting } from "@/lib/data/types";
import { CheckIcon } from "@/components/admin/icons";
import {
  Field,
  Notice,
  adminButtonClass,
  adminInputClass,
  adminTextareaClass,
  formatTimestamp,
} from "@/components/admin/primitives";

/**
 * Site settings — contact details, service areas and SEO defaults (`06` §23).
 *
 * `PUT /api/admin/settings` with `{ contact, serviceAreas, seoDefaults }`,
 * validated by `settingsUpsertSchema`.
 *
 * ### Empty means "not confirmed", and that is a real value
 *
 * Every field normalises an empty string to `null` on the server, and the schema's
 * comment says why: "the public email, phone and state list are
 * `[CLIENT TO CONFIRM]`, and `decisions.md` D-012 forbids substituting a plausible
 * value, so 'not yet confirmed' has to be representable". The state list is sent as
 * `null` rather than `[]` when the textarea is emptied, so "not confirmed" is not
 * recorded as "confirmed to be none".
 *
 * ### The portal does not decide what is public
 *
 * This screen stores values; publishing them is the public site's job and, for the
 * email and phone, is blocked until the client confirms them. The form therefore
 * says that plainly instead of implying that saving here publishes anything.
 */

export interface SettingsFormProps {
  settings: Setting | null;
  loginRedirectHref: string;
}

interface FormState {
  address: string;
  email: string;
  phone: string;
  states: string;
  note: string;
  titleTemplate: string;
  description: string;
}

function formFrom(settings: Setting | null): FormState {
  return {
    address: settings?.contact.address ?? "",
    email: settings?.contact.email ?? "",
    phone: settings?.contact.phone ?? "",
    states: (settings?.serviceAreas.states ?? []).join("\n"),
    note: settings?.serviceAreas.note ?? "",
    titleTemplate: settings?.seoDefaults.titleTemplate ?? "",
    description: settings?.seoDefaults.description ?? "",
  };
}

function statesFrom(value: string): string[] | null {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 ? lines : null;
}

function describeFailure(message: string, fieldErrors?: { field: string; message: string }[]): string {
  if (!fieldErrors || fieldErrors.length === 0) return message;
  return `${message} (${fieldErrors.map((issue) => `${issue.field} ${issue.message}`).join(", ")})`;
}

export function SettingsForm({ settings, loginRedirectHref }: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(formFrom(settings));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(null);

    const body = {
      contact: { address: form.address, email: form.email, phone: form.phone },
      serviceAreas: { states: statesFrom(form.states), note: form.note },
      seoDefaults: { titleTemplate: form.titleTemplate, description: form.description },
    };

    try {
      const result = await adminFetch<Setting>(ADMIN_API.settings, { method: "PUT", body });
      if (!result.ok) {
        if (result.status === 401) {
          router.replace(loginRedirectHref);
          return;
        }
        setError(describeFailure(result.error.message, result.error.fieldErrors));
        return;
      }

      setForm(formFrom(result.data));
      setSaved(`Settings saved ${formatTimestamp(result.data.updatedAt)}.`);
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      {error ? (
        <Notice tone="error" title="The settings were not saved">
          {error}
        </Notice>
      ) : null}
      {saved ? <Notice tone="success">{saved}</Notice> : null}

      {settings === null ? (
        <Notice tone="warning" title="No settings row has been saved yet">
          <p>
            Nothing is stored. The public contact details remain withheld until they are entered and
            the client confirms them — that is the intended state, not a fault.
          </p>
        </Notice>
      ) : null}

      <Notice tone="info" title="Do not substitute unconfirmed details">
        <p>
          A field left empty is stored as “not set” and the public site omits it. A plausible-looking
          value is worse than an absent one: it publishes a contact channel the company does not
          operate. The registered address is published in the site footer and may be repeated here.
        </p>
      </Notice>

      {/* Contact ---------------------------------------------------------- */}
      <section className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">Contact details</h2>

        <Field
          id="settings-address"
          label="Registered address"
          hint="Street address only. Shown in the footer and used by the organisation's structured data."
          optional
        >
          <input
            id="settings-address"
            className={adminInputClass}
            value={form.address}
            maxLength={400}
            onChange={(event) => update("address", event.target.value)}
            disabled={busy}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="settings-email"
            label="Public email"
            hint="Unconfirmed. Saving a value here does not publish it; the public site renders no mailto link until the address is confirmed."
            optional
          >
            <input
              id="settings-email"
              type="email"
              className={adminInputClass}
              value={form.email}
              maxLength={254}
              onChange={(event) => update("email", event.target.value)}
              disabled={busy}
            />
          </Field>

          <Field
            id="settings-phone"
            label="Public phone"
            hint="Unconfirmed. Sanitised to the characters an international number uses."
            optional
          >
            <input
              id="settings-phone"
              className={adminInputClass}
              value={form.phone}
              maxLength={40}
              onChange={(event) => update("phone", event.target.value)}
              disabled={busy}
            />
          </Field>
        </div>
      </section>

      {/* Service areas ---------------------------------------------------- */}
      <section className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">Service areas</h2>

        <Field
          id="settings-states"
          label="States served"
          hint="One per line. Left empty, the list is stored as “not confirmed” rather than as “none” — the public page keeps the [CLIENT TO CONFIRM] state instead of claiming a coverage area."
          optional
        >
          <textarea
            id="settings-states"
            className={adminTextareaClass}
            rows={4}
            value={form.states}
            onChange={(event) => update("states", event.target.value)}
            disabled={busy}
          />
        </Field>

        <Field
          id="settings-areas-note"
          label="Coverage note"
          hint="One line shown with the state list, for example how work outside those states is handled."
          optional
        >
          <input
            id="settings-areas-note"
            className={adminInputClass}
            value={form.note}
            maxLength={800}
            onChange={(event) => update("note", event.target.value)}
            disabled={busy}
          />
        </Field>
      </section>

      {/* SEO -------------------------------------------------------------- */}
      <section className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">SEO defaults</h2>

        <Field
          id="settings-seo-title"
          label="Title template"
          hint="Applied to page titles that do not set their own."
          optional
        >
          <input
            id="settings-seo-title"
            className={adminInputClass}
            value={form.titleTemplate}
            maxLength={300}
            onChange={(event) => update("titleTemplate", event.target.value)}
            disabled={busy}
          />
        </Field>

        <Field
          id="settings-seo-description"
          label="Default description"
          hint="Used only where a route supplies no description of its own. Approved copy only."
          optional
        >
          <textarea
            id="settings-seo-description"
            className={adminTextareaClass}
            rows={3}
            maxLength={600}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            disabled={busy}
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={adminButtonClass("primary")} disabled={busy}>
          <CheckIcon width={16} height={16} />
          <span>{busy ? "Saving…" : "Save settings"}</span>
        </button>
        <button
          type="button"
          className={adminButtonClass("secondary")}
          onClick={() => {
            setForm(formFrom(settings));
            setSaved(null);
            setError(null);
          }}
          disabled={busy}
        >
          Discard unsaved changes
        </button>
      </div>
    </form>
  );
}
