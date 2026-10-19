import React from "react";
import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  /** Centered message. Rendered as the section heading. */
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
  /**
   * Drafting-convention labels for the card's registration-marks row, e.g.
   * `["Project-based work", "Registered in Texas"]`. Left and right. Any label
   * passed in must come from `docs/03-copy-deck.md` — the design screen's own
   * drafting strings (`SPEC:`, `SCALE:`, `REG_TX`) are mock artefacts (D-008).
   */
  marks?: readonly string[];
  /** Optional closing note: eyebrow label plus one approved sentence. */
  noteLabel?: string;
  noteBody?: string;
}

/**
 * Centered empty state used by hidden-until-real routes such as `/projects`.
 * Composition follows `docs/design/nicben_projects_empty_state/code.html`:
 * drafting card, registration-marks row, crosshair mark, message, CTA, and the
 * bordered closing note. The mark, the marks row and the texture are decorative
 * (`aria-hidden`), so the message and CTA are the only announced content.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  ctaLabel = "Get in Touch",
  ctaHref = "/contact",
  marks,
  noteLabel,
  noteBody,
}) => {
  return (
    <div className="group card-lift relative overflow-hidden rounded-lg bg-tint-50 border border-line hover:border-brand-500 shadow-card px-6 py-14 sm:px-10 sm:py-20 flex flex-col items-center text-center transition-all duration-300">
      <div
        className="absolute inset-0 opacity-5 texture-dots pointer-events-none"
        aria-hidden="true"
      />

      {marks && marks.length >= 2 && (
        <div
          className="relative z-10 w-full flex items-center justify-between gap-4 text-eyebrow font-semibold text-text-600 uppercase tracking-wider mb-10"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <span className="inline-block w-2 h-2 bg-brand-500 shrink-0" />
            <span className="truncate">{marks[0]}</span>
          </span>
          <span className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="truncate">{marks[1]}</span>
            <span className="inline-block w-2 h-2 bg-brand-500 shrink-0" />
          </span>
        </div>
      )}

      <div className="relative z-10 mb-8" aria-hidden="true">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-surface border border-line flex items-center justify-center shadow-card transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100">
          <span className="absolute top-2 left-2 text-brand-500 text-sm">
            +
          </span>
          <span className="absolute top-2 right-2 text-brand-500 text-sm">
            +
          </span>
          <span className="absolute bottom-2 left-2 text-brand-500 text-sm">
            +
          </span>
          <span className="absolute bottom-2 right-2 text-brand-500 text-sm">
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

      <h2 className="relative z-10 text-h2 font-bold text-ink-950 tracking-tight max-w-xl text-balance">
        {title}
      </h2>

      <div className="relative z-10 mt-8">
        <Button variant="primary" withArrow href={ctaHref}>
          {ctaLabel}
        </Button>
      </div>

      {noteBody && (
        <div className="relative z-10 mt-12 w-full max-w-2xl pt-8 border-t border-line">
          <div className="flex items-center justify-center gap-2">
            <span className="text-brand-700" aria-hidden="true">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                />
              </svg>
            </span>
            {noteLabel && (
              <span className="text-eyebrow font-semibold text-ink-950 uppercase tracking-wider">
                {noteLabel}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-text-600 leading-relaxed">
            {noteBody}
          </p>
        </div>
      )}
    </div>
  );
};
