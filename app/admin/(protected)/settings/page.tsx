import type { Metadata } from "next";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/contract";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";

/**
 * `/admin/settings` — contact information, service areas and SEO defaults.
 *
 * "Site settings: contact info, service areas, SEO basics"
 * (`docs/01-sitemap-wireframes.md` §5), held in the single `Setting` document
 * (`06` §23). The port returns `null` before it has ever been saved, which the form
 * reports rather than papering over with an empty document.
 */

export const metadata: Metadata = {
  title: "Site settings | NICBEN admin",
};

export default async function AdminSettingsPage() {
  await adminSession();

  const repository = await getEnquiryRepository();
  const settings = await repository.getSettings();

  return (
    <>
      <AdminPageHeader
        eyebrow="Governance & audit"
        title="Site settings"
        description="Stored site-wide details. Where a detail is not yet confirmed, leave the field empty — the public site omits it rather than inventing a value."
      />
      <SettingsForm settings={settings} loginRedirectHref={ADMIN_LOGIN_PATH} />
    </>
  );
}
