/**
 * HeroCluster — asymmetric hero image frame with floating fact chips.
 * Sourced directly from docs/design/nicben_asset_holdings_investments_home/code.html lines 57-84.
 */

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
        {/* Architectural Image */}
        <img
          className="w-full h-[400px] sm:h-[440px] object-cover object-center transform hover:scale-[1.02] transition-transform duration-500"
          alt="Modern commercial architectural development site with steel reinforced concrete framework and metropolitan skyline"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdowE5vD1ONHQt7g6flPepk59aLmG-D5xxaVnh2a0qUe10UMkSwMDjKrf6dYfKDgCYctEja8ci_aluKun2Sqwnq7KXUBVnBlR4H2XNeXjWfBbH1WBtY0LdZBXno8T1pXg2ESYpeAb1_J4Or-WsAzA1rwDbyoo0M_Zl_KuVN0Hg_ui-0bXgDrwVhPhffNvzKtn4220L9rCIV68FLcx1mei3fS-nhEU5EGfxMnE5dOWBjxGvRqJm9iQClg"
        />

        {/* Top-Right Architectural Badge Overlay */}
        <div className="absolute top-4 right-4 bg-ink-950/85 backdrop-blur-md text-surface px-3 py-2 rounded-lg flex flex-col gap-0.5 max-w-[180px] shadow-sm border border-surface/10">
          <span className="text-[10px] text-accent-300 tracking-widest uppercase font-semibold">
            Project Spec
          </span>
          <span className="text-xs font-bold text-surface">
            Operational Focus
          </span>
          <span className="text-[11px] text-text-on-dark/70">
            Multi-State Agility
          </span>
        </div>

        {/* Bottom Overlapping Fact Chips */}
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
              Registered Texas LLC
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
              Serving Clients Across U.S. States
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
