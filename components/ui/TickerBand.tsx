"use client";

/**
 * TickerBand — infinite horizontal marquee of service keywords.
 *
 * Items from copy deck Section 2:
 *   Project Management ✱ Contracting ✱ Renovation ✱ Plumbing ✱
 *   Property Maintenance ✱ Corporate Treasury ✱ Investments
 *
 * Band treatment: full-width `--ink-950` band with accent asterisk separators
 * (docs/04-design-system.md section 5 "Ticker band", D-013).
 *
 * WCAG 2.2.2 (A) — this content moves for 32s on an infinite loop, so it must
 * be pausable by any input method (docs/05-motion-spec.md section 5):
 *   - pointer: hover anywhere on the band pauses (CSS `:hover` safety net plus
 *     the component state, so the control's icon stays truthful);
 *   - keyboard: the visible pause/play button pauses, and focus anywhere inside
 *     the band pauses through `:focus`/`:blur`;
 *   - touch: the visible pause/play button is always rendered unless the user
 *     prefers reduced motion (`motion-reduce:hidden`, because there is nothing
 *     to pause in that mode), so it is reachable without a pointer hover;
 *   - reduced motion: the animation is removed entirely and the items render as
 *     a static wrapped row, so the control is hidden (nothing to pause).
 *
 * The second copy of the list exists only to hide the loop seam and is hidden
 * from assistive technology, so the services are announced once.
 */

import { useState } from "react";

const ITEMS = [
  "Project Management",
  "Contracting",
  "Renovation",
  "Plumbing",
  "Property Maintenance",
  "Corporate Treasury",
  "Investments",
] as const;

function TickerItems({ decorative = false }: { decorative?: boolean }) {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-3 shrink-0"
          aria-hidden={decorative || undefined}
        >
          {i > 0 && (
            <span className="text-accent-400" aria-hidden="true">
              ✱
            </span>
          )}
          <span>{item}</span>
        </span>
      ))}
    </>
  );
}

export function TickerBand({ className = "" }: { className?: string }) {
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);

  // Kept as separate flags so moving the pointer away while the control still
  // holds focus cannot resume the animation.
  const paused = userPaused || hoverPaused || focusPaused;

  return (
    <section
      aria-label="Services ticker"
      className={`w-full bg-ink-950 ${className}`}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      <div className="mx-auto flex max-w-container items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1 overflow-hidden font-heading font-bold text-surface uppercase tracking-wider text-sm md:text-base">
          <div
            className="animate-ticker items-center gap-3 whitespace-nowrap"
            data-paused={paused}
          >
            <TickerItems />
            {/* Separators between duplicated halves keep the loop spacing even */}
            <span className="text-accent-400 shrink-0" aria-hidden="true">
              ✱
            </span>
            <TickerItems decorative />
            <span className="text-accent-400 shrink-0" aria-hidden="true">
              ✱
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-pressed={userPaused}
          aria-label={
            userPaused ? "Play the services ticker" : "Pause the services ticker"
          }
          className="inline-flex motion-reduce:hidden shrink-0 items-center justify-center h-11 w-11 rounded-full border border-surface/25 bg-surface/10 text-surface hover:bg-surface/20 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          {paused ? (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8.25 4.5 18 12l-9.75 7.5V4.5Z" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7.5 4.5h3v15h-3v-15ZM13.5 4.5h3v15h-3v-15Z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
