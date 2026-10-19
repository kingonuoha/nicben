import type { ReactNode } from "react";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * The guard for every protected screen.
 *
 * `docs/06-tech-and-security-spec.md` §27: "Admin routes and admin APIs must all
 * check the session **on the server**; never rely on hidden UI."
 *
 * This layout is the structural half of that rule — a page cannot be added below
 * `app/admin/(protected)/` without passing through it. The other half is that each
 * page calls the same guard itself (`app/admin/_lib/session.ts`, which memoises
 * `requireAdminSession()` per request so the two calls cost one verification), so
 * the guarantee survives a future refactor that moves a page out of this group.
 *
 * `requireAdminSession()` redirects to `/admin/login` and never returns when the
 * cookie is absent, malformed, forged, expired, or names an account that no longer
 * exists. This layout therefore renders only for a verified session, which is why
 * it may pass the operator's email and id down to the shell.
 *
 * `/admin/login` is deliberately **outside** this group: a guard that also wrapped
 * the login page would redirect that page to itself.
 *
 * `force-dynamic` because every render depends on a request-scoped cookie. Naming
 * it explicitly keeps that intent visible rather than relying on Next to infer it
 * from `cookies()`.
 */

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const [session, repository] = await Promise.all([adminSession(), getEnquiryRepository()]);

  return (
    <AdminShell
      email={session.email}
      adminId={session.adminId}
      expiresAt={session.expiresAt}
      adapter={repository.kind}
    >
      {children}
    </AdminShell>
  );
}
