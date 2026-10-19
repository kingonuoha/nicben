"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { adminLogin } from "@/lib/admin/client";
import { ADMIN_HOME_PATH } from "@/lib/admin/contract";
import { AtIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, KeyIcon } from "@/components/admin/icons";
import { adminButtonClass, adminInputClass, Notice } from "@/components/admin/primitives";

/**
 * The sign-in form.
 *
 * ### What it does and does not decide
 *
 * It performs **no** authentication logic. It posts credentials to
 * `/api/admin/auth/login` through `adminLogin()` (`lib/admin/client.ts`), which
 * sets the CSRF header and normalises the envelope, and it renders whatever the
 * server answered. `lib/auth/login.ts` is the only authority on whether a
 * credential is accepted, and it is deliberately incapable of distinguishing an
 * unknown address from a wrong password, or either from a deployment with no admin
 * configured — all three produce the same `401` body. This component therefore
 * never tries to explain *why* a sign-in failed, because the server does not know
 * and would be lying if it said (`docs/06-tech-and-security-spec.md` §43, D-028).
 *
 * ### Rate limiting is visible, not silent
 *
 * A `429` carries `retryAfterSeconds`. Showing the wait is the difference between
 * "the portal is broken" and "I am temporarily locked out", and `06` §31 requires
 * the lockout to exist rather than to be hidden.
 *
 * ### The strength meter is advisory only
 *
 * The bars are computed in the browser from the value being typed and are never
 * submitted. The authoritative policy is `ADMIN_PASSWORD_POLICY` in
 * `lib/auth/password.ts` (applied when a credential is provisioned, not here), so
 * the meter's own wording says "advisory" rather than implying it accepts or
 * rejects anything.
 */

type MeterLevel = "idle" | "weak" | "moderate" | "strong" | "strong-varied";

const METER_LABELS: Record<MeterLevel, string> = {
  idle: "Awaiting input",
  weak: "Weak",
  moderate: "Moderate",
  strong: "Strong",
  "strong-varied": "Strong and varied",
};

const METER_FILL: Record<MeterLevel, string> = {
  idle: "bg-line",
  weak: "bg-status-error",
  moderate: "bg-status-warning",
  strong: "bg-brand-500",
  "strong-varied": "bg-status-success",
};

function assess(value: string): { level: MeterLevel; filled: number } {
  if (value.length === 0) return { level: "idle", filled: 0 };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (score <= 1) return { level: "weak", filled: 1 };
  if (score === 2) return { level: "moderate", filled: 2 };
  if (score === 3) return { level: "strong", filled: 3 };
  return { level: "strong-varied", filled: 4 };
}

const METER_SEGMENTS = [0, 1, 2, 3] as const;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const meter = assess(password);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      setError(null);
      setRetryAfterSeconds(null);

      try {
        const result = await adminLogin(email, password);
        if (result.ok) {
          // The session and CSRF cookies are already set by the response; the
          // portal only has to navigate. `refresh()` because the dashboard's data
          // is read on the server and the router cache may hold a pre-sign-in
          // render of it.
          router.replace(ADMIN_HOME_PATH);
          router.refresh();
          return;
        }

        setError(result.error.message);
        if (typeof result.error.retryAfterSeconds === "number") {
          setRetryAfterSeconds(result.error.retryAfterSeconds);
        }
        setPassword("");
        passwordRef.current?.focus();
      } catch {
        // `adminFetch` throws only when the request never reached the server.
        setError("The server could not be reached. Check the connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, router, submitting],
  );

  return (
    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
      {error ? (
        <Notice tone="error" title="Sign-in rejected">
          <p>{error}</p>
          {retryAfterSeconds !== null ? (
            <p className="pt-1">
              Locked out for approximately {Math.max(1, Math.ceil(retryAfterSeconds / 60))} more
              minute{retryAfterSeconds > 60 ? "s" : ""}.
            </p>
          ) : null}
          <p className="pt-1 text-xs">
            Five failed attempts lock the account for fifteen minutes. Both the account and the
            requesting address are rate-limited.
          </p>
        </Notice>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label
            htmlFor="admin-email"
            className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-900"
          >
            Administrator email
          </label>
          <span className="font-body text-[11px] uppercase tracking-wider text-text-600">Required</span>
        </div>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-text-600">
            <AtIcon />
          </span>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            aria-describedby="admin-email-hint"
            className={`${adminInputClass} pl-10`}
            placeholder="Administrator email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
          />
        </div>
        <p id="admin-email-hint" className="font-body text-xs text-text-600">
          The account configured for this deployment. There is no public sign-up.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label
            htmlFor="admin-password"
            className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-900"
          >
            Password
          </label>
          <span className="font-body text-[11px] uppercase tracking-wider text-text-600">
            Rate-limited
          </span>
        </div>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-text-600">
            <KeyIcon />
          </span>
          <input
            id="admin-password"
            ref={passwordRef}
            name="password"
            type={revealed ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-describedby="admin-password-hint"
            className={`${adminInputClass} pr-12 pl-10`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-pressed={revealed}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-2 rounded-sm p-2 text-text-600 transition-colors hover:text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <p id="admin-password-hint" className="font-body text-xs text-text-600">
          Advisory strength meter only — it is never submitted, and the server checks the credential.
        </p>

        <div className="flex flex-col gap-1 pt-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2 font-body text-[11px] uppercase tracking-wider text-text-600">
            <span>Password strength (advisory)</span>
            <span className="font-semibold">{METER_LABELS[meter.level]}</span>
          </div>
          <div className="flex w-full gap-1" aria-hidden="true">
            {METER_SEGMENTS.map((segment) => (
              <span
                key={segment}
                className={`h-1 w-1/4 rounded-full ${
                  segment < meter.filled ? METER_FILL[meter.level] : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/*
        The design screen's row here is a "Remember session (12h timeout)" checkbox
        plus a "Reset Key?" link. Neither control exists in this implementation and
        neither can be made to: the session lifetime is a server constant (eight
        hours, `ADMIN_SESSION_TTL_SECONDS`) with no per-session override, and there
        is no password reset flow by decision (`docs/tasks/phase-06-hidden-admin-portal/backend-notes.md`
        §6 — re-provisioning is the documented path). A checkbox that changes
        nothing and a link to nowhere would be worse than the truth, so the row
        states the truth instead. Recorded in the phase completion notes.
      */}
      <p className="font-body text-xs leading-relaxed text-text-600">
        Sessions expire eight hours after sign-in, enforced on the server on every request. There is
        no self-service password reset; the account is re-provisioned.
      </p>

      <button type="submit" disabled={submitting} className={adminButtonClass("primary")}>
        <span>{submitting ? "Checking credential…" : "Sign in to admin portal"}</span>
        <ArrowRightIcon />
      </button>

      {/* Announced once the request settles, without stealing focus. */}
      <p aria-live="polite" className="sr-only">
        {submitting ? "Signing in" : error ? "Sign-in failed" : ""}
      </p>
    </form>
  );
}
