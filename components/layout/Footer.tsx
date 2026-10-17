import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink-950 text-text-on-dark border-t border-ink-950/40 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 pb-12 border-b border-surface/10">
          {/* Brand & Corporate Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-surface font-bold text-xl tracking-tight"
            >
              <span className="w-8 h-8 rounded-lg bg-surface text-ink-950 flex items-center justify-center font-heading font-extrabold text-sm">
                NB
              </span>
              <span className="font-heading font-extrabold text-surface">
                NICBEN
              </span>
            </Link>
            <p className="text-text-on-dark/80 text-sm max-w-sm leading-relaxed">
              NICBEN Asset Holdings & Investments LLC is a privately owned company registered in Texas.
            </p>
            <div className="pt-2 text-xs text-text-on-dark/60 space-y-1">
              <p>494 Sonora Ave, Raymondville, TX 78580</p>
              <p className="text-accent-300">Serving clients across various U.S. states on a project basis.</p>
            </div>
          </div>

          {/* Column 1: What We Do (Strict Equal Weight) */}
          <div>
            <h3 className="text-xs font-bold text-surface uppercase tracking-wider mb-4">
              What We Do
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/what-we-do/project-management-contracting"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Project Management & Contracting
                </Link>
              </li>
              <li>
                <Link
                  href="/what-we-do/property-improvement-maintenance"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Property Improvement & Maintenance
                </Link>
              </li>
              <li>
                <Link
                  href="/what-we-do/treasury-investments"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Corporate Treasury & Investments
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  href="/what-we-do"
                  className="text-xs font-semibold text-accent-400 hover:text-surface transition-colors"
                >
                  All Disciplines Overview →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div>
            <h3 className="text-xs font-bold text-surface uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  About NICBEN
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/service-areas"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Service Areas
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact (address only — email and phone are [CLIENT TO CONFIRM]) */}
          <div>
            <h3 className="text-xs font-bold text-surface uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Contact & Enquiries
                </Link>
              </li>
              <li className="text-text-on-dark/70">
                494 Sonora Ave, Raymondville, TX 78580
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-xs font-bold text-surface uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-on-dark/60">
          <p>© {currentYear} NICBEN Asset Holdings & Investments LLC. All rights reserved.</p>
          <p className="text-text-on-dark/40 text-center sm:text-right">
            Corporate Treasury manages proprietary company funds only. No external investment solicitation.
          </p>
        </div>
      </div>
    </footer>
  );
};
