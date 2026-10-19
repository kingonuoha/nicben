import type { Metadata } from "next";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/contract";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProjectManager } from "@/components/admin/ProjectManager";

/**
 * `/admin/projects` — the project records the public gallery reads.
 *
 * "Projects: CRUD with images, pillar tag, published toggle"
 * (`docs/01-sitemap-wireframes.md` §5).
 *
 * ### Pillar boundary
 *
 * `docs/01-sitemap-wireframes.md` §4 gives `/projects` a "Filter by pillar (1 or 2)"
 * control only, and `decisions.md` D-002 keeps the treasury pillar informational. A
 * project record therefore belongs to Pillar 1 or Pillar 2 work; the form's service
 * tag suggestions come from the approved service names and carry no treasury entry.
 *
 * ### Published is a filter, not a default
 *
 * The port applies `published` only when it is asked to
 * (`lib/data/repository.ts`: "`published` is applied as a filter, never as a
 * default"), so with no filter both published records and drafts are listed. That is
 * the correct behaviour for the operator's screen — a drafts view that hid drafts
 * would be useless — and the public gallery asks for `published: true` separately.
 */

export const metadata: Metadata = {
  title: "Projects | NICBEN admin",
};

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProjectsPage({ searchParams }: ProjectsPageProps) {
  await adminSession();

  const params = await searchParams;
  const rawPublished = firstValue(params.published);
  // An unknown value is treated as "no filter" rather than coerced: `published=false`
  // read as truthy would silently hide every draft.
  const publishedFilter: "all" | "published" | "draft" =
    rawPublished === "true" ? "published" : rawPublished === "false" ? "draft" : "all";

  const repository = await getEnquiryRepository();
  const page = await repository.listProjects({
    limit: 200,
    cursor: null,
    ...(publishedFilter === "published" ? { published: true } : {}),
    ...(publishedFilter === "draft" ? { published: false } : {}),
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Content management"
        title="Project records"
        description="Pillar 1 and Pillar 2 project work. Only published records can appear in the public gallery; the corporate treasury pillar has no project records here."
      />
      <ProjectManager
        projects={page.items}
        total={page.total}
        publishedFilter={publishedFilter}
        loginRedirectHref={ADMIN_LOGIN_PATH}
      />
    </>
  );
}
