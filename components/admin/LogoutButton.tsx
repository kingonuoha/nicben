"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { adminLogout } from "@/lib/admin/client";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/contract";
import { SignOutIcon } from "@/components/admin/icons";

/**
 * Sign out.
 *
 * `POST /api/admin/auth/logout` clears both cookies server-side, writes the audit
 * entry and answers `{ loggedOut: true }`. The route also rotates the CSRF cookie,
 * so "sign out" cannot be turned into a cross-site action by a third party holding
 * an old token.
 *
 * ### Recorded limitation, visible here
 *
 * There is no server-side session store (D-027), so clearing the cookie is the
 * browser's half of the operation and expiry is the revocation mechanism. A copy
 * of the token taken before sign-out stays valid until `exp`. The compensating
 * control is that the account is re-resolved on every request, so removing or
 * re-provisioning the admin record invalidates every outstanding token at once.
 *
 * The button is disabled while the request is in flight so a double click cannot
 * produce a second, differently-ordered sign-out.
 */

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminLogout();
      router.replace(ADMIN_LOGIN_PATH);
      router.refresh();
    } catch {
      setError("The server could not be reached.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-text-on-dark/25 px-3 py-2 font-body text-[11px] font-semibold uppercase tracking-wider text-text-on-dark transition-colors hover:border-accent-400 hover:text-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:opacity-60"
      >
        <SignOutIcon width={16} height={16} />
        <span>{busy ? "Signing out…" : "Sign out"}</span>
      </button>
      {error ? (
        <p role="alert" className="font-body text-[11px] text-status-warning">
          {error}
        </p>
      ) : null}
    </div>
  );
}
