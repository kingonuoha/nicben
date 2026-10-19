import type { ReactNode } from "react";

/**
 * The portal's page furniture — heading block, toolbar row and section rhythm.
 *
 * These are the three things every screen in the portal repeats. They are
 * presentation only and are deliberately separate from the auth guard so a screen
 * cannot accidentally inherit a data read along with a heading.
 */

/** Eyebrow + H1 + optional supporting line, matching the design's title block. */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-widest text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-700" aria-hidden="true" />
          {eyebrow}
        </span>
        <h1 className="font-heading text-h2 font-extrabold tracking-tight text-ink-950">{title}</h1>
        {description ? (
          <p className="max-w-2xl font-body text-sm leading-relaxed text-text-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

/**
 * A KPI tile.
 *
 * `value` is always a number the server just read. `docs/04-design-system.md` §8
 * forbids fake statistics, and a metric that is `[CLIENT TO CONFIRM]` is not shown
 * at all rather than shown as a placeholder.
 */
export function MetricCard({
  label,
  value,
  icon,
  footer,
  tone = "surface",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  footer: ReactNode;
  tone?: "surface" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`flex flex-col justify-between rounded-md border p-4 ${
        dark ? "border-ink-950 bg-ink-950 text-text-on-dark" : "border-line bg-surface shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            className={`font-body text-[11px] font-semibold uppercase tracking-wider ${
              dark ? "text-text-on-dark/70" : "text-text-600"
            }`}
          >
            {label}
          </span>
          <span
            className={`font-heading text-h3 font-extrabold tabular-nums tracking-tight ${
              dark ? "text-surface" : "text-ink-950"
            }`}
          >
            {value}
          </span>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            dark ? "bg-surface/10 text-accent-400" : "bg-tint-100 text-brand-700"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div
        className={`mt-4 flex flex-wrap items-center gap-2 pt-2 font-body text-xs ${
          dark ? "text-text-on-dark/80" : "text-text-600"
        }`}
      >
        {footer}
      </div>
    </div>
  );
}

/** Vertical rhythm between the panels of a screen. */
export function AdminSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 rounded-md border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-2 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-bold tracking-tight text-ink-950">{title}</h2>
          {description ? (
            <p className="max-w-3xl font-body text-xs leading-relaxed text-text-600">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className="px-4 py-4 sm:px-6">{children}</div>
    </section>
  );
}
