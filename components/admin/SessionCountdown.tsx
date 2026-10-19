"use client";

import { useEffect, useState } from "react";

/**
 * The remaining session lifetime, counted down in the browser.
 *
 * The value is `AdminSession.expiresAt` — the `exp` claim the server signed into
 * the cookie and re-checks on every request (`lib/auth/session.ts`, D-027). This
 * component therefore displays a server-enforced value; it is not a client-side
 * timer that could keep someone "signed in" after the server has stopped
 * honouring the cookie. When it reaches zero the only honest thing it can say is
 * that the session has ended, and the next request will redirect to sign-in.
 *
 * Rendered only after mount: the first server render and the first client render
 * would otherwise disagree about how many minutes are left, which React reports
 * as a hydration mismatch. The placeholder is textual, so no layout shift occurs.
 */

export function SessionCountdown({ expiresAt }: { expiresAt: number }) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setRemainingSeconds(Math.max(0, Math.round(expiresAt - Date.now() / 1000)));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  if (remainingSeconds === null) {
    return <span className="font-body text-[11px] tabular-nums text-text-on-dark/80">—:—</span>;
  }

  if (remainingSeconds === 0) {
    return (
      <span className="font-body text-[11px] uppercase tracking-wider text-status-warning">
        Session expired
      </span>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <span
      className="font-body text-[11px] tabular-nums text-text-on-dark/90"
      title="The server refuses every request after this point"
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}
