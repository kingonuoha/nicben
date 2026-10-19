"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_GROUPS, isNavItemActive } from "@/components/admin/nav";
import { CloseIcon, DatabaseIcon, LockIcon, MenuIcon, ShieldIcon } from "@/components/admin/icons";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { SessionCountdown } from "@/components/admin/SessionCountdown";

/**
 * The portal console: sidebar, status bar and footer bar around the page content.
 *
 * This is chrome only. It renders no data of its own and grants nothing: every
 * page inside it is guarded on the server by
 * `app/admin/(protected)/layout.tsx` + `requireAdminSession()`, and the child
 * elements it wraps were already rendered by a server component that had a valid
 * session. Hiding the navigation would not protect anything
 * (`docs/06-tech-and-security-spec.md` §27).
 *
 * Structure follows `docs/design/nicben_admin_enquiries_management_admin/code.html`:
 * a dark left rail with two grouped nav sections and a session card at the bottom,
 * a status bar across the top of the content column, and a footer bar carrying the
 * restricted-access line on the left and environment/session state on the right.
 *
 * ### What was replaced, and why (D-008)
 *
 * The design screen's rail lists "Asset Ledger", "Equity Partners" and
 * "Deployments", its session card claims an "Austin TX Private Network Encrypted
 * Gateway", and its footer reports `ENV: PROD-TX-CORE-01` with a session timer. None
 * of those are real: the screens do not exist, no gateway exists, and there is no
 * such environment identifier. `decisions.md` D-002 additionally forbids anything
 * in the portal reading as offering or collecting investments, which "Equity
 * Partners" and "Asset Ledger" both do. The rail therefore lists the portal's real
 * screens, the session card reports the real session, and the footer reports the
 * real storage adapter. The session timer *is* kept — it is now driven by the
 * signed `exp` claim rather than by a number in a mock.
 *
 * Server-verified identity arrives as props; nothing here reads a cookie or calls
 * an API on load.
 */

export interface AdminShellProps {
  children: ReactNode;
  /** From the verified session. Never from a request body or a client store. */
  email: string;
  /** `AdminUser.id`, shown shortened so an operator can correlate it with the audit trail. */
  adminId: string;
  /** `AdminSession.expiresAt`, unix seconds. */
  expiresAt: number;
  /** Which repository adapter is active — real deployment state, not a mock label. */
  adapter: "dev" | "mongo";
}

export function AdminShell({ children, email, adminId, expiresAt, adapter }: AdminShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Escape closes the mobile navigation, matching the design's key handling.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  // A route change closes the sheet so the destination is not hidden behind it.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const adapterLabel = adapter === "mongo" ? "MongoDB (durable)" : "In-process dev store (not durable)";

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Mobile bar --------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-950/10 bg-ink-950 px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 text-text-on-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-surface/10">
            <LockIcon width={16} height={16} />
          </span>
          <span className="font-heading text-sm font-extrabold tracking-tight">NICBEN</span>
          <span className="font-body text-[10px] uppercase tracking-widest text-text-on-dark/70">
            Internal portal
          </span>
        </span>
        <button
          type="button"
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-controls="admin-sidebar"
          aria-label={navOpen ? "Close portal navigation" : "Open portal navigation"}
          className="rounded-sm p-2 text-text-on-dark transition-colors hover:bg-surface/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          {navOpen ? <CloseIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
        </button>
      </div>

      {/* Sidebar ------------------------------------------------------------ */}
      <aside
        id="admin-sidebar"
        aria-label="Portal navigation"
        className={`${
          navOpen ? "flex" : "hidden"
        } w-full shrink-0 flex-col gap-6 bg-ink-950 px-4 py-6 text-text-on-dark lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:w-[264px] lg:overflow-y-auto`}
      >
        <div className="hidden flex-col gap-1 lg:flex">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface/10">
              <LockIcon width={18} height={18} />
            </span>
            <span className="font-heading text-lg font-extrabold tracking-tight">NICBEN</span>
          </span>
          <span className="font-body text-[10px] uppercase tracking-widest text-text-on-dark/70">
            Internal portal
          </span>
        </div>

        {ADMIN_NAV_GROUPS.map((group) => (
          <nav key={group.label} aria-label={group.label} className="flex flex-col gap-2">
            <h2 className="font-body text-[10px] font-semibold uppercase tracking-widest text-text-on-dark/60">
              {group.label}
            </h2>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isNavItemActive(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.description}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-sm px-3 py-2 font-body text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
                        active
                          ? "bg-surface/15 font-semibold text-surface"
                          : "text-text-on-dark/80 hover:bg-surface/10 hover:text-surface"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}

        <div className="mt-auto flex flex-col gap-3 rounded-md border border-text-on-dark/15 bg-surface/5 p-3">
          <div className="flex items-start gap-2">
            <ShieldIcon width={16} height={16} className="mt-0.5 shrink-0 text-accent-400" />
            <div className="min-w-0">
              <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-text-on-dark/70">
                Signed in as
              </p>
              <p className="truncate font-body text-xs text-text-on-dark" title={email}>
                {email}
              </p>
              <p className="truncate font-body text-[10px] tabular-nums text-text-on-dark/60" title={adminId}>
                id {adminId}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-body text-[10px] uppercase tracking-widest text-text-on-dark/70">
              Expires in
            </span>
            <SessionCountdown expiresAt={expiresAt} />
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Content column ----------------------------------------------------- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 font-body text-[11px] uppercase tracking-wider text-text-600">
            <ShieldIcon width={16} height={16} className="text-brand-700" />
            <span>NICBEN Asset Holdings &amp; Investments LLC</span>
            <span aria-hidden="true" className="text-line">
              /
            </span>
            <span className="font-semibold text-brand-700">System control</span>
          </p>
          <p className="flex items-center gap-2 font-body text-[11px] uppercase tracking-wider text-text-600">
            <DatabaseIcon width={16} height={16} className="text-brand-700" />
            <span>Store</span>
            <span className="font-semibold text-text-900">{adapterLabel}</span>
          </p>
        </div>

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="flex flex-col gap-2 border-t border-line bg-surface px-4 py-3 font-body text-[11px] uppercase tracking-wider text-text-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="flex items-center gap-2">
            <ShieldIcon width={14} height={14} className="text-brand-700" />
            <span>Restricted access // internal use only</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Session verified server-side
              <span className="text-text-900"> · </span>
              <SessionCountdown expiresAt={expiresAt} />
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}
