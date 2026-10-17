import React from "react";
import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  /** Centered message. Rendered as the section heading. */
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Centered empty state used by hidden-until-real routes such as `/projects`.
 * Composition follows `docs/design/nicben_projects_empty_state/code.html`:
 * drafting card, registration marks, crosshair mark, message, CTA.
 * The mark and the marks row are decorative (`aria-hidden`).
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  ctaLabel = "Get in Touch",
  ctaHref = "/contact",
}) => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-tint-50 border border-line shadow-card px-6 py-14 sm:px-10 sm:py-20 flex flex-col items-center text-center">
      <div
        className="absolute inset-0 opacity-5 texture-dots pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full flex items-center justify-between text-xs font-semibold text-text-600 uppercase tracking-wider mb-10"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-brand-500" />
          <span>Projects</span>
        </span>
        <span className="hidden sm:inline">Drafting</span>
      </div>

      <div className="relative z-10 mb-8" aria-hidden="true">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-surface border border-line flex items-center justify-center shadow-card">
          <span className="absolute top-2 left-2 text-brand-500 text-xs">
            +
          </span>
          <span className="absolute top-2 right-2 text-brand-500 text-xs">
            +
          </span>
          <span className="absolute bottom-2 left-2 text-brand-500 text-xs">
            +
          </span>
          <span className="absolute bottom-2 right-2 text-brand-500 text-xs">
            +
          </span>
          <svg
            className="w-12 h-12 text-brand-500"
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              fill="currentColor"
              fillOpacity="0.15"
              height="8"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              width="36"
              x="6"
              y="32"
            />
            <path
              d="M12 32V36M18 32V35M24 32V36M30 32V35M36 32V36"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.75"
            />
            <path
              d="M24 6L11 26H37L24 6Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <circle
              className="text-accent-400"
              cx="24"
              cy="18"
              fill="currentColor"
              r="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              className="text-accent-400"
              d="M24 21V32"
              stroke="currentColor"
              strokeDasharray="2 2"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      <h2 className="relative z-10 text-2xl sm:text-3xl font-bold text-ink-950 tracking-tight max-w-xl">
        {title}
      </h2>

      <div className="relative z-10 mt-8">
        <Button variant="primary" withArrow href={ctaHref}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
};
