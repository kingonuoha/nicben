import type { ReactNode } from "react";

/**
 * Token-styled primitives for the hidden admin portal.
 *
 * Every colour, radius and shadow below resolves to a token from
 * `docs/tokens/tokens.json` (`decisions.md` D-003): `ink-950`, `brand-700`,
 * `brand-500`, `accent-400`, `accent-300`, `tint-100`, `tint-50`, `surface`,
 * `line`, `text-900`, `text-600`, `status-*`. There is no raw hex, `rgb()`,
 * `rgba()` or `hsl()` in this file, and no default component-library look
 * (`docs/04-design-system.md` §8).
 *
 * The design screens (`docs/design/nicben_admin_login_admin_login`,
 * `docs/design/nicben_admin_enquiries_management_admin`) were exported from a
 * Stage theme carrying its own Material-style palette. Per `decisions.md` D-008
 * those files are structure references only, so the structure is reproduced and
 * the palette is mapped onto the project's tokens:
 *
 * | Design role                    | Token used here |
 * |--------------------------------|-----------------|
 * | deep navy panels / sidebar     | `ink-950`       |
 * | teal links, icons, focus       | `brand-700`     |
 * | pale blue chips / rows         | `tint-100`      |
 * | page background                | `tint-50`       |
 * | card surface                   | `surface`       |
 * | hairlines and dividers         | `line`          |
 * | bright accent dot / status     | `accent-400`    |
 *
 * The file has no `"use client"` directive: it renders no state and runs no
 * effects, so a server component and a client component can both import it.
 */

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The shared focus ring. `docs/04-design-system.md` §5 requires a visible focus
 * state on every control, and `docs/05-motion-spec.md` §5 requires it under
 * reduced motion too — a focus ring is a static state change, never animated.
 */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const CONTROL_BASE = `w-full rounded-sm border border-line bg-tint-50 px-3 py-2 font-body text-sm text-text-900 placeholder:text-text-600/70 transition-colors hover:border-brand-500 focus:border-brand-500 focus:bg-surface focus:outline-none ${FOCUS_RING}`;

export const adminInputClass = `${CONTROL_BASE}`;
export const adminSelectClass = `${CONTROL_BASE} cursor-pointer`;
export const adminTextareaClass = `${CONTROL_BASE} min-h-[96px] leading-relaxed`;

export type AdminButtonVariant = "primary" | "secondary" | "accent" | "danger" | "ghost";
export type AdminButtonSize = "sm" | "md";

/**
 * A control that is inert while a request is in flight still has to be legible,
 * so `disabled:` dims rather than disappears.
 */
export function adminButtonClass(
  variant: AdminButtonVariant = "primary",
  size: AdminButtonSize = "md",
): string {
  const sizes: Record<AdminButtonSize, string> = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
  };
  const variants: Record<AdminButtonVariant, string> = {
    primary: "bg-ink-950 text-surface hover:bg-brand-700",
    secondary: "bg-surface text-text-900 border border-line hover:border-brand-500 hover:text-brand-700",
    accent: "bg-accent-400 text-text-on-accent hover:bg-accent-300 font-semibold",
    danger: "bg-status-error text-surface hover:bg-status-error/90",
    ghost: "bg-transparent text-text-600 hover:bg-tint-100 hover:text-ink-950",
  };
  return `inline-flex items-center justify-center rounded-sm font-body font-medium uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${FOCUS_RING}`;
}

/** The same treatment for a link that is styled as a button. */
export function adminLinkButtonClass(
  variant: AdminButtonVariant = "secondary",
  size: AdminButtonSize = "md",
): string {
  return adminButtonClass(variant, size);
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Panel({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag className={`rounded-md border border-line bg-surface shadow-card ${className}`}>{children}</Tag>
  );
}

/** The eyebrow label used above every panel heading, matching the design's tracking. */
export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-body text-[11px] font-semibold uppercase tracking-widest text-brand-700">
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const size = Tag === "h1" ? "text-h2" : Tag === "h2" ? "text-h3" : "text-lg";
  return (
    <Tag className={`font-heading font-bold tracking-tight text-ink-950 ${size} ${className}`}>
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/* Chips and notices                                                           */
/* -------------------------------------------------------------------------- */

export type PillTone = "neutral" | "brand" | "accent" | "success" | "warning" | "error";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "bg-tint-100 text-text-600",
  brand: "bg-brand-700 text-surface",
  accent: "bg-accent-300 text-text-on-accent",
  success: "bg-status-success/15 text-status-success",
  warning: "bg-status-warning/20 text-ink-950",
  error: "bg-status-error/15 text-status-error",
};

export function Pill({
  tone = "neutral",
  children,
  title,
  wrap = false,
}: {
  tone?: PillTone;
  children: ReactNode;
  title?: string;
  /**
   * Allow the label to wrap. A category label from the copy deck ("Property
   * improvement and maintenance") is wider than a dense table column and forcing it
   * onto one line pushed the actions column out of view.
   */
  wrap?: boolean;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-wider ${
        wrap ? "text-left" : "whitespace-nowrap"
      } ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export type NoticeTone = "info" | "warning" | "error" | "success";

/**
 * `role` is deliberate: an error or a delivery failure is announced
 * (`role="alert"`), an informational note is not (`role="status"` would
 * interrupt for something that is not urgent).
 */
export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const tones: Record<NoticeTone, string> = {
    info: "border-brand-500/40 bg-tint-100 text-text-900",
    warning: "border-status-warning/50 bg-status-warning/10 text-text-900",
    error: "border-status-error/50 bg-status-error/10 text-text-900",
    success: "border-status-success/50 bg-status-success/10 text-text-900",
  };
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`flex flex-col gap-1 rounded-sm border px-3 py-2.5 font-body text-sm ${tones[tone]}`}
    >
      {title ? <span className="font-semibold text-ink-950">{title}</span> : null}
      {children ? <div className="leading-relaxed text-text-600">{children}</div> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

/** An empty list is a real state, not an error. Rendered in place of a table body. */
export function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-line bg-tint-50 px-4 py-6 text-center font-body text-sm text-text-600">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

export function TableShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left font-body text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  scope = "col",
}: {
  children: ReactNode;
  align?: "left" | "right";
  scope?: "col" | "row";
}) {
  return (
    <th
      scope={scope}
      className={`whitespace-nowrap border-b border-line bg-tint-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-line px-4 py-3 align-top text-text-900 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A labelled field. The label is a real `<label for>` and the hint is wired
 * through `aria-describedby`, so the control is announced without relying on
 * the placeholder (`docs/04-design-system.md` §5 "Forms": visible labels, not
 * placeholder-only).
 */
export function Field({
  id,
  label,
  hint,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-900"
        >
          {label}
        </label>
        {optional ? (
          <span className="font-body text-[11px] uppercase tracking-wider text-text-600">Optional</span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="font-body text-xs leading-relaxed text-text-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A read-only label/value pair, used by the enquiry drawer's detail grid. */
export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-[11px] uppercase tracking-wider text-text-600">{label}</span>
      <span className="font-body text-sm text-text-900">{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A timestamp as the operator reads it. Rendered server-side only: the portal is
 * a single-operator internal tool and a fixed locale keeps the server and client
 * markup identical (a locale mismatch would be a hydration error).
 */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** `1234` bytes → `1.2 KB`. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The same instant in the shortest form that stays unambiguous: a 24-hour clock and a
 * two-letter zone.
 *
 * Used in the list tables, where a column of full timestamps is the widest thing on
 * the page — measured at 1,235px of table against a 1,110px column at 1440px, which
 * pushed the actions column off-screen. Every second matters less than the action does;
 * timestamps in the detail overlay and the audit trail keep the full form.
 */
export function formatTimestampCompact(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** Two initials for the drawer's avatar, from a name the sender typed. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}
