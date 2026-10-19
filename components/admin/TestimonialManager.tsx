"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { adminFetch } from "@/lib/admin/client";
import { ADMIN_API } from "@/lib/admin/contract";
import type { Testimonial } from "@/lib/data/types";
import { CheckIcon, CloseIcon, NoteIcon } from "@/components/admin/icons";
import {
  Field,
  Notice,
  Pill,
  adminButtonClass,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/primitives";

/**
 * Testimonials CRUD.
 *
 * "Testimonials: CRUD" (`docs/01-sitemap-wireframes.md` §5) with the model's four
 * writable fields — `name`, `quote`, `projectRef`, `published` (`06` §22). There is
 * no field for a rating, a company, a date or a verification flag, because the model
 * does not have one and inventing a field to hold a claim is exactly what
 * `decisions.md` D-008 and D-012 forbid.
 *
 * ### Why publishing is guarded by a sentence rather than by a control
 *
 * `docs/03-copy-deck.md` marks the testimonial block "HIDE until real testimonials
 * exist", and `docs/04-design-system.md` §8 forbids fabricated reviews. The portal
 * cannot verify that a quote is genuine — only the operator can — so the form states
 * the rule and the toggle stays a decision the operator makes deliberately. A
 * "verified" checkbox that recorded nothing would be worse than none, because it
 * would look like evidence.
 */

export interface TestimonialManagerProps {
  testimonials: Testimonial[];
  total: number;
  publishedFilter: "all" | "published" | "draft";
  loginRedirectHref: string;
}

interface FormState {
  id: string | null;
  name: string;
  quote: string;
  projectRef: string;
  published: boolean;
}

const EMPTY_FORM: FormState = { id: null, name: "", quote: "", projectRef: "", published: false };

function formFrom(testimonial: Testimonial): FormState {
  return {
    id: testimonial.id,
    name: testimonial.name,
    quote: testimonial.quote,
    projectRef: testimonial.projectRef ?? "",
    published: testimonial.published,
  };
}

function describeFailure(message: string, fieldErrors?: { field: string; message: string }[]): string {
  if (!fieldErrors || fieldErrors.length === 0) return message;
  return `${message} (${fieldErrors.map((issue) => `${issue.field} ${issue.message}`).join(", ")})`;
}

export function TestimonialManager({
  testimonials,
  total,
  publishedFilter,
  loginRedirectHref,
}: TestimonialManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const editing = form.id !== null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyId) return;
    setBusyId("form");
    setError(null);
    setSaved(null);

    const body = {
      id: form.id,
      name: form.name,
      quote: form.quote,
      projectRef: form.projectRef,
      published: form.published,
    };

    try {
      const result = editing
        ? await adminFetch<Testimonial>(ADMIN_API.testimonial(form.id as string), {
            method: "PUT",
            body,
          })
        : await adminFetch<Testimonial>(ADMIN_API.testimonials, { method: "POST", body });

      if (!result.ok) {
        if (result.status === 401) {
          router.replace(loginRedirectHref);
          return;
        }
        setError(describeFailure(result.error.message, result.error.fieldErrors));
        return;
      }

      setForm(formFrom(result.data));
      setSaved(editing ? "The testimonial was updated." : "The testimonial was created.");
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublished(testimonial: Testimonial) {
    if (busyId) return;
    setBusyId(testimonial.id);
    setError(null);
    setSaved(null);

    const body = {
      id: testimonial.id,
      name: testimonial.name,
      quote: testimonial.quote,
      projectRef: testimonial.projectRef ?? "",
      published: !testimonial.published,
    };

    try {
      const result = await adminFetch<Testimonial>(ADMIN_API.testimonial(testimonial.id), {
        method: "PUT",
        body,
      });
      if (!result.ok) {
        if (result.status === 401) {
          router.replace(loginRedirectHref);
          return;
        }
        setError(describeFailure(result.error.message, result.error.fieldErrors));
        return;
      }
      setSaved(
        result.data.published
          ? `“${result.data.name}” is published. Confirm it is a genuine, attributable review.`
          : `“${result.data.name}” is unpublished and no longer public.`,
      );
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Notice tone="error" title="The change was not saved">
          {error}
        </Notice>
      ) : null}
      {saved ? <Notice tone="success">{saved}</Notice> : null}

      <Notice tone="warning" title="Only publish reviews you can attribute">
        <p>
          A published testimonial is a claim the company makes. Publish only a review you hold from a
          real client, quoted as they gave it. Do not publish a review drafted for a screen, and do not
          edit the quote to strengthen it.
        </p>
      </Notice>

      <form
        onSubmit={save}
        className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">
            {editing ? "Edit testimonial" : "New testimonial"}
          </h2>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setSaved(null);
              }}
              className={adminButtonClass("ghost", "sm")}
            >
              <CloseIcon width={14} height={14} />
              <span>Stop editing</span>
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="testimonial-name" label="Client name" hint="As it should read publicly.">
            <input
              id="testimonial-name"
              className={adminInputClass}
              value={form.name}
              maxLength={120}
              required
              onChange={(event) => update("name", event.target.value)}
              disabled={busyId !== null}
            />
          </Field>
          <Field
            id="testimonial-project-ref"
            label="Project reference"
            hint="Optional. The project id or slug this review relates to."
            optional
          >
            <input
              id="testimonial-project-ref"
              className={adminInputClass}
              value={form.projectRef}
              maxLength={160}
              onChange={(event) => update("projectRef", event.target.value)}
              disabled={busyId !== null}
            />
          </Field>
        </div>

        <Field
          id="testimonial-quote"
          label="Quote"
          hint="The client's own words. Internal and public text both get sanitised on save; nothing is stripped beyond control characters, so write it as it should appear."
        >
          <textarea
            id="testimonial-quote"
            className={adminTextareaClass}
            rows={4}
            maxLength={1500}
            required
            value={form.quote}
            onChange={(event) => update("quote", event.target.value)}
            disabled={busyId !== null}
          />
        </Field>

        <label className="flex items-center gap-2.5 font-body text-sm text-text-900">
          <input
            type="checkbox"
            className="h-4 w-4 rounded-sm border border-line accent-ink-950"
            checked={form.published}
            onChange={(event) => update("published", event.target.checked)}
            disabled={busyId !== null}
          />
          <span>Published — visible on the public site</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={adminButtonClass("primary")} disabled={busyId !== null}>
            <CheckIcon width={16} height={16} />
            <span>{busyId === "form" ? "Saving…" : editing ? "Save changes" : "Create testimonial"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setSaved(null);
            }}
            className={adminButtonClass("secondary")}
            disabled={busyId !== null}
          >
            Clear the form
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">
              {total} testimonial{total === 1 ? "" : "s"}
            </h2>
            <p className="font-body text-xs text-text-600">
              The public site shows published records only; unpublishing is the removal path.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: "all", label: "All", href: "/admin/testimonials" },
                { key: "published", label: "Published", href: "/admin/testimonials?published=true" },
                { key: "draft", label: "Drafts", href: "/admin/testimonials?published=false" },
              ] as const
            ).map((option) => (
              <Link
                key={option.key}
                href={option.href}
                aria-current={publishedFilter === option.key ? "true" : undefined}
                className={`rounded-full px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                  publishedFilter === option.key
                    ? "bg-ink-950 text-surface"
                    : "bg-tint-100 text-text-600 hover:text-ink-950"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {testimonials.length === 0 ? (
          <p className="px-4 py-6 font-body text-sm text-text-600 sm:px-6">
            No testimonial matches this filter. `docs/03-copy-deck.md` marks testimonials “HIDE until
            real testimonials exist”, so an empty list is the expected state until real client reviews
            are held.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id} className="flex flex-col gap-3 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-ink-950">{testimonial.name}</p>
                    <p className="font-body text-xs text-text-600">
                      {testimonial.projectRef ? (
                        <>
                          refers to <span className="tabular-nums">{testimonial.projectRef}</span>
                        </>
                      ) : (
                        "no project reference"
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={testimonial.published ? "success" : "warning"}>
                      {testimonial.published ? "Published" : "Draft"}
                    </Pill>
                    <button
                      type="button"
                      onClick={() => togglePublished(testimonial)}
                      className={adminButtonClass("secondary", "sm")}
                      disabled={busyId !== null}
                    >
                      {busyId === testimonial.id
                        ? "Saving…"
                        : testimonial.published
                          ? "Unpublish"
                          : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(formFrom(testimonial));
                        setSaved(null);
                        setError(null);
                      }}
                      className={adminButtonClass("ghost", "sm")}
                      disabled={busyId !== null}
                    >
                      <NoteIcon width={14} height={14} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-line font-body text-xs leading-relaxed text-text-600">
                  {testimonial.quote.length > 240
                    ? `${testimonial.quote.slice(0, 240)}…`
                    : testimonial.quote}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
