"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { adminFetch } from "@/lib/admin/client";
import { ADMIN_API } from "@/lib/admin/contract";
import type { PageContent, PageContentSection } from "@/lib/data/types";
import { EDITABLE_PAGE_KEYS } from "@/components/admin/page-keys";
import { CheckIcon, CloseIcon } from "@/components/admin/icons";
import {
  Field,
  Notice,
  adminButtonClass,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
  formatTimestamp,
} from "@/components/admin/primitives";

/**
 * The page-content editor.
 *
 * `PUT /api/admin/content/[pageKey]` with `{ sections }` — the whole section list
 * replaces the stored one, validated by `pageContentUpsertSchema` (section keys are
 * lowercase and hyphen/underscore/dot separated, headings and bodies length-capped,
 * at most `ADMIN_LIMITS.sectionsPerPage` sections).
 *
 * ### Why this screen is deliberately plain
 *
 * `docs/03-copy-deck.md` is the only approved source of public copy and
 * `decisions.md` D-008 forbids authoring text for a public surface. An editor that
 * made writing new public copy *easy* would be a machine for producing D-008
 * breaches, so this one quotes the rule where the operator is typing, names the page
 * it is editing, and reports whether a stored row exists at all.
 *
 * ### "Not yet entered" is a state, not an empty string
 *
 * `GET /api/admin/content/[pageKey]` answers `content: null` for a page whose copy
 * has never been stored, and the port returns `null` rather than a synthesised empty
 * document on purpose: "not yet entered" has to stay distinguishable from "entered
 * and empty", because D-012 forbids substituting a value for a `[CLIENT TO CONFIRM]`
 * detail. This component renders that distinction rather than flattening it.
 *
 * ### Adding or removing a section
 *
 * Sections are rows held in local state and saved as a set. A removed row is simply
 * absent from the list the next `PUT` sends, which is what replaces the stored list.
 */

export interface PageContentEditorProps {
  pageKey: string;
  content: PageContent | null;
  loginRedirectHref: string;
}

interface SectionRow {
  /** Stable React key for an unsaved row; never sent to the server. */
  rowId: string;
  key: string;
  heading: string;
  body: string;
}

let rowCounter = 0;
function nextRowId(): string {
  rowCounter += 1;
  return `section-${rowCounter}`;
}

function rowsFrom(content: PageContent | null): SectionRow[] {
  if (!content) return [];
  return content.sections.map((section) => ({
    rowId: nextRowId(),
    key: section.key,
    heading: section.heading ?? "",
    body: section.body ?? "",
  }));
}

function describeFailure(message: string, fieldErrors?: { field: string; message: string }[]): string {
  if (!fieldErrors || fieldErrors.length === 0) return message;
  return `${message} (${fieldErrors.map((issue) => `${issue.field} ${issue.message}`).join(", ")})`;
}

export function PageContentEditor({ pageKey, content, loginRedirectHref }: PageContentEditorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<SectionRow[]>(rowsFrom(content));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function setRow(rowId: string, patch: Partial<Omit<SectionRow, "rowId">>) {
    setRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
    );
    setSaved(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(null);

    const sections: PageContentSection[] = rows.map((row) => ({
      key: row.key,
      heading: row.heading,
      body: row.body,
    }));

    try {
      const result = await adminFetch<PageContent>(ADMIN_API.pageContent(pageKey), {
        method: "PUT",
        body: { pageKey, sections },
      });

      if (!result.ok) {
        if (result.status === 401) {
          router.replace(loginRedirectHref);
          return;
        }
        setError(describeFailure(result.error.message, result.error.fieldErrors));
        return;
      }

      setRows(rowsFrom(result.data));
      setSaved(
        `Saved ${result.data.sections.length} section${result.data.sections.length === 1 ? "" : "s"} for “${result.data.pageKey}”.`,
      );
      router.refresh();
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Notice tone="error" title="The content was not saved">
          {error}
        </Notice>
      ) : null}
      {saved ? <Notice tone="success">{saved}</Notice> : null}

      {content === null ? (
        <Notice tone="warning" title="No stored copy for this page yet">
          <p>
            This page has no saved content row. That is different from having one with empty sections,
            and the difference is kept on purpose: an unentered section is a confirmation debt, not
            blank copy waiting to be filled in with something plausible.
          </p>
        </Notice>
      ) : (
        <Notice tone="info" title={`Stored copy last saved ${formatTimestamp(content.updatedAt)}`}>
          <p>
            <span className="tabular-nums">{content.sections.length}</span> section
            {content.sections.length === 1 ? "" : "s"} stored for{" "}
            <span className="tabular-nums">{content.pageKey}</span>.
          </p>
        </Notice>
      )}

      <Notice tone="info" title="Approved copy only">
        <p>
          Every public string must come from the approved copy deck. Do not write new marketing text
          here, and do not reword a line to make it stronger — if a section needs copy that does not
          exist yet, leave it out and raise it as a copy request.
        </p>
      </Notice>

      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-4 shadow-card sm:px-6">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="content-page"
              className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600"
            >
              Page
            </label>
            <select
              id="content-page"
              className={`${adminSelectClass} sm:w-[420px]`}
              value={pageKey}
              onChange={(event) => {
                router.push(`/admin/content?pageKey=${encodeURIComponent(event.target.value)}`);
              }}
              disabled={busy}
            >
              {EDITABLE_PAGE_KEYS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={adminButtonClass("secondary", "sm")}
            onClick={() =>
              setRows((current) => [
                ...current,
                { rowId: nextRowId(), key: "", heading: "", body: "" },
              ])
            }
            disabled={busy}
          >
            Add a section
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-sm border border-dashed border-line bg-tint-50 px-4 py-6 text-center font-body text-sm text-text-600">
            No section is loaded for this page. “Add a section” starts one, or choose a page that
            already has stored copy.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {rows.map((row, index) => (
              <li
                key={row.rowId}
                className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
                    Section {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRows((current) => current.filter((entry) => entry.rowId !== row.rowId));
                      setSaved(null);
                    }}
                    className={adminButtonClass("ghost", "sm")}
                    disabled={busy}
                  >
                    <CloseIcon width={14} height={14} />
                    <span>Remove this section</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    id={`section-key-${row.rowId}`}
                    label="Section key"
                    hint="Lowercase, hyphen-separated. The renderer looks sections up by this key, so changing it hides the section on the public page."
                  >
                    <input
                      id={`section-key-${row.rowId}`}
                      className={adminInputClass}
                      value={row.key}
                      maxLength={120}
                      required
                      onChange={(event) =>
                        setRow(row.rowId, { key: event.target.value.toLowerCase() })
                      }
                      disabled={busy}
                    />
                  </Field>
                  <Field id={`section-heading-${row.rowId}`} label="Heading" optional>
                    <input
                      id={`section-heading-${row.rowId}`}
                      className={adminInputClass}
                      value={row.heading}
                      maxLength={400}
                      onChange={(event) => setRow(row.rowId, { heading: event.target.value })}
                      disabled={busy}
                    />
                  </Field>
                </div>

                <Field id={`section-body-${row.rowId}`} label="Body" optional>
                  <textarea
                    id={`section-body-${row.rowId}`}
                    className={adminTextareaClass}
                    rows={4}
                    maxLength={8000}
                    value={row.body}
                    onChange={(event) => setRow(row.rowId, { body: event.target.value })}
                    disabled={busy}
                  />
                </Field>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={adminButtonClass("primary")} disabled={busy}>
            <CheckIcon width={16} height={16} />
            <span>{busy ? "Saving…" : "Save the section list"}</span>
          </button>
          <button
            type="button"
            className={adminButtonClass("secondary")}
            onClick={() => {
              setRows(rowsFrom(content));
              setSaved(null);
              setError(null);
            }}
            disabled={busy}
          >
            Discard unsaved changes
          </button>
        </div>
        <p className="font-body text-xs leading-relaxed text-text-600">
          Saving replaces the page&apos;s whole section list and writes an audit entry naming you, the
          page and how many sections were stored. A section omitted from the list is removed from the
          page.
        </p>
      </form>
    </div>
  );
}
