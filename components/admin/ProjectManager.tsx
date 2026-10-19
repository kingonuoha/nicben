"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { adminFetch } from "@/lib/admin/client";
import { ADMIN_API } from "@/lib/admin/contract";
import type { Project } from "@/lib/data/types";
import { CheckIcon, CloseIcon, NoteIcon } from "@/components/admin/icons";
import {
  Field,
  Notice,
  Pill,
  adminButtonClass,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/primitives";

/**
 * Projects CRUD.
 *
 * "Projects CRUD — title, slug, serviceTag, location, images, summary, published
 * toggle" (`docs/tasks/phase-06-hidden-admin-portal/brief.md` §5.3), against
 * `POST /api/admin/projects` (create) and `PUT /api/admin/projects/[id]` (update).
 * Both bodies are validated server-side by `projectUpsertSchema`; the schema's
 * output — sanitised, length-capped — is what gets stored, never this form's state.
 *
 * ### Publishing is the only removal path
 *
 * The port has no delete (`docs/tasks/phase-06-hidden-admin-portal/backend-notes.md`
 * §6), so the toggle is a real control rather than a convenience: a project that
 * should not be public is unpublished here, and `published: false` is what keeps it
 * off `/projects`. There is deliberately no delete button, because it would be a
 * button that removes nothing.
 *
 * ### Two things the portal does not do
 *
 * 1. **No image upload.** `images` is a list of references — paths under
 *    `public/images/...` or absolute URLs — and the field says so. No upload route
 *    exists, and adding one would be a new authorisation surface.
 * 2. **No page for an individual project.** `/projects/[slug]` is not a route in
 *    this build (`app/projects/page.tsx` is the only file), so a "view on site"
 *    link would 404. The slug is shown as text instead.
 */

export interface ProjectManagerProps {
  projects: Project[];
  total: number;
  /** The active list filter, echoed back so a save can return to it. */
  publishedFilter: "all" | "published" | "draft";
  loginRedirectHref: string;
}

/**
 * Studio service names from `docs/03-copy-deck.md` §4 and §5, as suggestions only.
 * The field accepts any short tag: the schema requires a non-empty line, not a
 * member of a fixed set, and inventing a closed taxonomy the deck does not define
 * would be authoring product structure (`decisions.md` D-008).
 */
const SERVICE_TAG_SUGGESTIONS = [
  "Project management and contracting",
  "Property improvement and maintenance",
  "Renovation",
  "Plumbing",
  "Maintenance",
  "Related contracting",
] as const;

interface FormState {
  id: string | null;
  title: string;
  slug: string;
  serviceTag: string;
  location: string;
  images: string;
  summary: string;
  published: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  slug: "",
  serviceTag: "",
  location: "",
  images: "",
  summary: "",
  published: false,
};

function formFrom(project: Project): FormState {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    serviceTag: project.serviceTag,
    location: project.location,
    images: project.images.join("\n"),
    summary: project.summary,
    published: project.published,
  };
}

/** A URL-safe slug from the title, offered while the slug field is untouched. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function imagesFrom(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function describeFailure(message: string, fieldErrors?: { field: string; message: string }[]): string {
  if (!fieldErrors || fieldErrors.length === 0) return message;
  return `${message} (${fieldErrors.map((issue) => `${issue.field} ${issue.message}`).join(", ")})`;
}

export function ProjectManager({
  projects,
  total,
  publishedFilter,
  loginRedirectHref,
}: ProjectManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const editing = form.id !== null;
  const listHref = `/admin/projects${
    publishedFilter === "published" ? "?published=true" : publishedFilter === "draft" ? "?published=false" : ""
  }`;

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
      title: form.title,
      slug: form.slug,
      serviceTag: form.serviceTag,
      location: form.location,
      images: imagesFrom(form.images),
      summary: form.summary,
      published: form.published,
    };

    try {
      const result = editing
        ? await adminFetch<Project>(ADMIN_API.project(form.id as string), { method: "PUT", body })
        : await adminFetch<Project>(ADMIN_API.projects, { method: "POST", body });

      if (!result.ok) {
        if (result.status === 401) {
          router.replace(loginRedirectHref);
          return;
        }
        setError(describeFailure(result.error.message, result.error.fieldErrors));
        return;
      }

      setForm(formFrom(result.data));
      setSlugTouched(true);
      setSaved(editing ? `“${result.data.title}” was updated.` : `“${result.data.title}” was created.`);
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusyId(null);
    }
  }

  /** Flip `published` on an existing record. The body is the full record: the port upserts. */
  async function togglePublished(project: Project) {
    if (busyId) return;
    setBusyId(project.id);
    setError(null);
    setSaved(null);

    const body = {
      id: project.id,
      title: project.title,
      slug: project.slug,
      serviceTag: project.serviceTag,
      location: project.location,
      images: project.images,
      summary: project.summary,
      published: !project.published,
    };

    try {
      const result = await adminFetch<Project>(ADMIN_API.project(project.id), { method: "PUT", body });
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
          ? `“${result.data.title}” is published and can appear on the public gallery.`
          : `“${result.data.title}” is unpublished and is no longer public.`,
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

      {/* Form ------------------------------------------------------------ */}
      <form
        onSubmit={save}
        className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-card sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">
            {editing ? "Edit project" : "New project"}
          </h2>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setSlugTouched(false);
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
          <Field id="project-title" label="Title" hint="Shown on the project card.">
            <input
              id="project-title"
              className={adminInputClass}
              value={form.title}
              maxLength={200}
              required
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => ({
                  ...current,
                  title: value,
                  slug: slugTouched ? current.slug : slugify(value),
                }));
                setSaved(null);
              }}
              disabled={busyId !== null}
            />
          </Field>

          <Field
            id="project-slug"
            label="Slug"
            hint="Lowercase words separated by hyphens. The public gallery has no per-project page in this build, so the slug is the record's stable key."
          >
            <input
              id="project-slug"
              className={adminInputClass}
              value={form.slug}
              maxLength={120}
              required
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", event.target.value.toLowerCase());
              }}
              disabled={busyId !== null}
            />
          </Field>

          <Field
            id="project-service-tag"
            label="Service tag"
            hint="The pillar or service this project belongs to. Suggestions come from the approved service names; Pillar 3 work is not tagged here."
          >
            <input
              id="project-service-tag"
              className={adminInputClass}
              list="project-service-tags"
              value={form.serviceTag}
              maxLength={120}
              required
              onChange={(event) => update("serviceTag", event.target.value)}
              disabled={busyId !== null}
            />
            <datalist id="project-service-tags">
              {SERVICE_TAG_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </Field>

          <Field id="project-location" label="Location" hint="City and state, as it should read publicly.">
            <input
              id="project-location"
              className={adminInputClass}
              value={form.location}
              maxLength={160}
              required
              onChange={(event) => update("location", event.target.value)}
              disabled={busyId !== null}
            />
          </Field>
        </div>

        <Field
          id="project-images"
          label="Image references"
          hint="One per line. A path under /images/... or an absolute URL. The portal uploads nothing — add the file to the repository first, then reference it here."
        >
          <textarea
            id="project-images"
            className={adminTextareaClass}
            rows={3}
            value={form.images}
            onChange={(event) => update("images", event.target.value)}
            disabled={busyId !== null}
          />
        </Field>

        <Field
          id="project-summary"
          label="Summary"
          hint="Approved copy only. Do not author client-facing text here (D-008); if the description is not in the copy deck, leave the project unpublished."
        >
          <textarea
            id="project-summary"
            className={adminTextareaClass}
            rows={5}
            maxLength={4000}
            required
            value={form.summary}
            onChange={(event) => update("summary", event.target.value)}
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
          <span>Published — visible in the public project gallery</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={adminButtonClass("primary")} disabled={busyId !== null}>
            <CheckIcon width={16} height={16} />
            <span>{busyId === "form" ? "Saving…" : editing ? "Save changes" : "Create project"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setSlugTouched(false);
              setSaved(null);
            }}
            className={adminButtonClass("secondary")}
            disabled={busyId !== null}
          >
            Clear the form
          </button>
        </div>
      </form>

      {/* List ------------------------------------------------------------ */}
      <section className="overflow-hidden rounded-md border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">
              {total} project record{total === 1 ? "" : "s"}
            </h2>
            <p className="font-body text-xs text-text-600">
              Newest first. Unpublishing is the removal path; nothing here deletes a record.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: "all", label: "All", href: "/admin/projects" },
                { key: "published", label: "Published", href: "/admin/projects?published=true" },
                { key: "draft", label: "Drafts", href: "/admin/projects?published=false" },
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

        {projects.length === 0 ? (
          <p className="px-4 py-6 font-body text-sm text-text-600 sm:px-6">
            No project record matches this filter. `docs/03-copy-deck.md` marks the projects gallery
            “HIDE until real projects exist”, so an empty list is the expected state until real,
            client-approved project data is entered.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-col gap-3 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-ink-950">{project.title}</p>
                    <p className="font-body text-xs text-text-600">
                      <span className="tabular-nums">{project.slug}</span>
                      {" · "}
                      {project.serviceTag}
                      {" · "}
                      {project.location}
                      {" · "}
                      {project.images.length} image reference
                      {project.images.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={project.published ? "success" : "warning"}>
                      {project.published ? "Published" : "Draft"}
                    </Pill>
                    <button
                      type="button"
                      onClick={() => togglePublished(project)}
                      className={adminButtonClass("secondary", "sm")}
                      disabled={busyId !== null}
                    >
                      {busyId === project.id
                        ? "Saving…"
                        : project.published
                          ? "Unpublish"
                          : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(formFrom(project));
                        setSlugTouched(true);
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
                  {project.summary.length > 240
                    ? `${project.summary.slice(0, 240)}…`
                    : project.summary}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-line px-4 py-3 sm:px-6">
          <p className="font-body text-xs text-text-600">
            Editing a record loads it into the form above. Status changes are audited with your account
            and the time.
          </p>
        </div>
      </section>
    </div>
  );
}
