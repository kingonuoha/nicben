import type { Metadata } from "next";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/contract";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageContentEditor } from "@/components/admin/PageContentEditor";
import {
  DEFAULT_PAGE_KEY,
  EDITABLE_PAGE_KEYS,
  editablePageNote,
  isEditablePageKey,
} from "@/components/admin/page-keys";

/**
 * `/admin/content` — editable pillar, service and FAQ text.
 *
 * "Page content: edit pillar and service text, FAQ" (`docs/01-sitemap-wireframes.md`
 * §5), stored as `PageContent.sections` (`06` §21).
 *
 * The page key comes from the query string and is checked against the closed list of
 * real routes (`components/admin/page-keys.ts`) rather than taken as given, so this
 * screen cannot be pointed at an arbitrary key and cannot create a content row for a
 * page that does not exist. Anything unrecognised falls back to the first entry, and
 * the read is a plain `getPageContent(key)` through the port.
 */

export const metadata: Metadata = {
  title: "Page content | NICBEN admin",
};

interface ContentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminContentPage({ searchParams }: ContentPageProps) {
  await adminSession();

  const params = await searchParams;
  const requested = firstValue(params.pageKey);
  const pageKey = isEditablePageKey(requested) && requested ? requested : DEFAULT_PAGE_KEY;

  const repository = await getEnquiryRepository();
  const content = await repository.getPageContent(pageKey);

  const note = editablePageNote(pageKey);
  const fallbackEntry = EDITABLE_PAGE_KEYS[0];
  const description = note
    ? `${note} Section keys are read by the public renderer, so a changed key hides that section.`
    : `Section keys are read by the public renderer, so a changed key hides that section.`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Content management"
        title="Page content"
        description={description}
      />
      {!isEditablePageKey(requested) && requested ? (
        <p className="mb-4 font-body text-xs text-text-600">
          “{requested}” is not a page this portal edits, so{" "}
          <span className="tabular-nums">{fallbackEntry?.label ?? DEFAULT_PAGE_KEY}</span> is shown
          instead. The list is fixed by `docs/01-sitemap-wireframes.md` §3; a new page is a code change.
        </p>
      ) : null}
      <PageContentEditor
        pageKey={pageKey}
        content={content}
        loginRedirectHref={ADMIN_LOGIN_PATH}
      />
    </>
  );
}
