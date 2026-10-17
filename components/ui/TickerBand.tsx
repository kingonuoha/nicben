/**
 * TickerBand — infinite horizontal marquee of service keywords.
 * Server component (no 'use client'). Pure CSS animation.
 *
 * Items from copy deck Section 2:
 *   Project Management ✱ Contracting ✱ Renovation ✱ Plumbing ✱
 *   Property Maintenance ✱ Corporate Treasury ✱ Investments
 *
 * Band treatment: full-width `--ink-950` band with accent asterisk separators
 * (docs/04-design-system.md section 5 "Ticker band", D-013). The Stage mock's
 * `bg-tint-100` is a design artefact and does not govern.
 *
 * prefers-reduced-motion: animation disabled, items show in static flex-wrap.
 */

const ITEMS = [
  "Project Management",
  "Contracting",
  "Renovation",
  "Plumbing",
  "Property Maintenance",
  "Corporate Treasury",
  "Investments",
] as const;

function TickerContent() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-3 shrink-0">
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
  return (
    <section
      aria-label="Services ticker"
      className={`w-full bg-ink-950 py-4 overflow-hidden ${className}`}
    >
      {/*
        Outer wrapper: on hover, pause the animation.
        The inner flex container holds two copies of the items so that
        when translateX(-50%) is reached the seam is invisible.
      */}
      <div className="overflow-hidden font-heading font-bold text-surface uppercase tracking-wider text-sm md:text-base">
        <div className="animate-ticker items-center gap-3 whitespace-nowrap">
          <TickerContent />
          {/* Separator between duplicated halves */}
          <span className="text-accent-400 shrink-0" aria-hidden="true">
            ✱
          </span>
          <TickerContent />
          {/* Second separator so spacing is even when it loops */}
          <span className="text-accent-400 shrink-0" aria-hidden="true">
            ✱
          </span>
        </div>
      </div>
    </section>
  );
}
