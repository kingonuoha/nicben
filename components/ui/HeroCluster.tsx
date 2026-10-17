/**
 * HeroCluster — asymmetric hero visual frame with floating fact chips.
 * Structure follows docs/design/nicben_asset_holdings_investments_home/code.html
 * lines 57-84 (layout and structure reference only — D-008).
 */

import { ShapePanel } from "@/components/ui/ShapePanel";

export function HeroCluster({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Background architectural accent blur */}
      <div
        className="absolute -inset-4 bg-brand-500/20 rounded-3xl blur-2xl -z-10 transform rotate-1 pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Frame */}
      <div className="relative rounded-2xl overflow-hidden bg-surface shadow-float border border-line">
        {/* R1-5: a remote AI-generated architectural image stood here. It is
            replaced with a token-only treatment — docs/04-design-system.md
            section 8 forbids stock and AI-generated imagery, and no real work
            photograph has been supplied yet. */}
        <ShapePanel className="w-full h-[400px] sm:h-[440px] rounded-none border-0" motif="arcs" />

        {/* Bottom Overlapping Fact Chips — docs/03-copy-deck.md:27-28 */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row gap-2">
          {/* Chip 1 */}
          <div className="bg-surface/95 backdrop-blur-sm px-3.5 py-2 rounded-pill flex items-center gap-2 shadow-card border border-line">
            <svg
              className="w-4 h-4 text-brand-700 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-xs font-semibold text-ink-950">
              Registered in Texas
            </span>
          </div>

          {/* Chip 2 */}
          <div className="bg-tint-50/95 backdrop-blur-sm px-3.5 py-2 rounded-pill flex items-center gap-2 shadow-card border border-line">
            <svg
              className="w-4 h-4 text-brand-700 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="text-xs font-semibold text-ink-950">
              Serving clients across the US
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
