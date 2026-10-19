import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/guard";
import { isAdminCredentialConfigured, logAdminAuthConfigStatus } from "@/lib/auth/config";
import { isDurableStoreConfigured } from "@/lib/data/index";
import { ADMIN_HOME_PATH } from "@/lib/admin/contract";
import { LoginForm } from "@/components/admin/LoginForm";
import {
  ArrowLeftIcon,
  DatabaseIcon,
  LockIcon,
  ShieldIcon,
} from "@/components/admin/icons";
import { Notice, PanelLabel } from "@/components/admin/primitives";

/**
 * `/admin/login` — the portal's only unauthenticated screen.
 *
 * `docs/06-tech-and-security-spec.md` §27: the portal is never linked, is
 * `noindex, nofollow` and is disallowed in `robots.txt`, and **none of that is the
 * control**. The `noindex` metadata is set in `../layout.tsx` and the
 * `X-Robots-Tag` header in `next.config.mjs`; the control is that this page can
 * only ever exchange a credential for a session, and that every other admin route
 * refuses to render without one.
 *
 * ### Fail closed, and say so (D-028)
 *
 * When the deployment has no admin account, this screen must not look like a
 * login that might work. A form that always answers "invalid email or password"
 * is indistinguishable from a mistyped password, which is exactly the confusion
 * D-028 exists to avoid, so the screen states what is true instead:
 *
 * - an account can exist when either `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` are
 *   present (the dev adapter's seed path) **or** a durable store is configured
 *   (`MONGODB_URI`, whose `adminUsers` collection is the authority);
 * - with neither, no credential can ever be accepted and the form is not rendered.
 *
 * The unavailable text deliberately names no environment variable and no host:
 * this page is reachable by anyone who knows the URL, and `06` §43 forbids handing
 * a caller the deployment's internals. The detail goes to the server log
 * (`logAdminAuthConfigStatus`), where the operator can read it.
 *
 * ### Already signed in
 *
 * A valid session is redirected to the dashboard rather than shown a login form.
 */

export const metadata: Metadata = {
  title: "Admin sign-in | NICBEN",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect(ADMIN_HOME_PATH);

  // One line to the server log on every visit: whether an operator account can
  // exist here, and where sessions are signed from. Booleans and a mode name only.
  logAdminAuthConfigStatus();

  /** A credential can be verified only if a stored account exists to verify against. */
  const signInPossible = isAdminCredentialConfigured() || isDurableStoreConfigured();

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-40 texture-dots" aria-hidden="true" />

      <div className="relative flex w-full max-w-[520px] flex-col items-center">
        <div className="w-full overflow-hidden rounded-md border border-line bg-surface shadow-float">
          {/*
            The design's header rule is a multi-stop gradient. `docs/04-design-system.md`
            §2 allows no gradient except the hero/dark-band one, so the rule is a
            solid ink bar. Structure kept, treatment per the design system (D-013).
          */}
          <div className="h-1.5 w-full bg-ink-950" aria-hidden="true" />

          <div className="flex flex-col gap-6 p-6 sm:p-8">
            {/* Eyebrow chip + wordmark + identity line ---------------------- */}
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-tint-100 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-brand-700" aria-hidden="true" />
                <span className="font-body text-[11px] font-semibold uppercase tracking-widest text-brand-700">
                  Admin portal access
                </span>
              </span>

              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink-950 text-surface">
                  <LockIcon width={20} height={20} />
                </span>
                <span className="font-heading text-h3 font-extrabold tracking-tight text-ink-950">
                  NICBEN
                </span>
              </div>

              <p className="max-w-sm font-body text-sm leading-relaxed text-text-600">
                NICBEN Asset Holdings &amp; Investments LLC
                <br />
                <span className="text-xs uppercase tracking-widest text-text-600">
                  Internal management system
                </span>
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-sm bg-tint-100 px-3 py-1.5">
                <ShieldIcon width={14} height={14} className="text-brand-700" />
                <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-600">
                  Restricted access // internal use only
                </span>
              </span>
            </div>

            {/* Form, or the fail-closed unavailable state ------------------- */}
            {signInPossible ? (
              <LoginForm />
            ) : (
              <div className="flex flex-col gap-3">
                <Notice tone="error" title="This portal is not available">
                  <p>
                    No administrator account is configured on this deployment, so no sign-in can
                    succeed. This is deliberate: the portal fails closed rather than opening with a
                    default credential.
                  </p>
                  <p className="pt-2">
                    Provisioning is a server-side operation. Until it is done, this screen does not
                    accept credentials and nothing here can be entered.
                  </p>
                </Notice>
                <Notice tone="info" title="What the operator needs">
                  <p>
                    An administrator account and a session signing secret must both be set in the
                    deployment environment, and the service must be restarted afterwards.
                  </p>
                </Notice>
              </div>
            )}
          </div>

          {/* Card footer strip -------------------------------------------- */}
          <div className="flex flex-col gap-3 bg-tint-100 px-6 py-4 sm:px-8">
            <div className="flex items-start gap-2">
              <DatabaseIcon width={16} height={16} className="mt-0.5 shrink-0 text-brand-700" />
              <p className="font-body text-xs leading-relaxed text-text-600">
                Authorised personnel only. Sign-in attempts, sign-outs and administrative changes are
                recorded in the audit log with the acting account and the time.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wider text-brand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-700" aria-hidden="true" />
                {signInPossible ? "Sign-in available" : "Sign-in unavailable"}
              </span>
              <span className="font-body text-[11px] uppercase tracking-wider text-text-600">
                Session: signed cookie, eight hours
              </span>
            </div>
          </div>
        </div>

        {/*
          The design's "Return to Public Site" link is kept: it points at the public
          site, not at the portal, so it is not an inbound path to `/admin`. No public
          page links the other way (D-004).
        */}
        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-sm text-text-600 transition-colors hover:bg-tint-100 hover:text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            <ArrowLeftIcon width={16} height={16} />
            <span>Return to the public site</span>
          </Link>
        </div>

        <p className="mt-4 text-center font-body text-xs text-text-600">
          <PanelLabel>Internal tool</PanelLabel>
          <span className="block pt-1">
            Not linked from the public site, excluded from the sitemap, and marked noindex.
          </span>
        </p>
      </div>
    </main>
  );
}
