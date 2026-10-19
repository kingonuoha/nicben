import React from "react";
import Link from "next/link";
import Image from "next/image";

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
              aria-label="NICBEN Home"
            >
              <Image
                src="/images/brand/nicben-logo-horizontal-white.png"
                alt="NICBEN Asset Holdings & Investments"
                width={170}
                height={46}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-text-on-dark/80 text-sm max-w-sm leading-relaxed">
              NICBEN Asset Holdings & Investments LLC is a privately owned company registered in Texas.
            </p>
            <div className="pt-2 text-xs text-text-on-dark/60 space-y-1">
              <p>494 Sonora Ave, Raymondville, TX 78580</p>
              {/* docs/03-copy-deck.md:44 — the only approved locality line. */}
              <p className="text-accent-300">Serving clients in various U.S. states</p>
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
              {/*
                docs/03-copy-deck.md:14 defines the What We Do column as the
                three pillar links only. The uncited "All Disciplines Overview →"
                link that stood here was removed under D-008.
              */}
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

          {/* Column 3: Contact. docs/03-copy-deck.md:14 defines this column as
              address, email, phone; D-012 withholds the email and phone until the
              client confirms them, so the slots below stay reserved and empty
              rather than carrying a substitute address or a bare marker. */}
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
                  Contact
                </Link>
              </li>
              <li className="text-text-on-dark/70">
                494 Sonora Ave, Raymondville, TX 78580
              </li>
              {/* Reserved slot: confirmed email and phone drop in here. */}
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
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-text-on-dark/70 hover:text-accent-300 transition-colors"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-on-dark/60">
          <p>© {currentYear} NICBEN Asset Holdings & Investments LLC. All rights reserved.</p>
          {/*
            An uncited treasury-compliance line stood here. docs/03-copy-deck.md
            provides no approved footer copy for it — the only investment-boundary
            wording in the deck is the section 6 notice (marked
            [PENDING CLIENT / LAWYER REVIEW]) which supplies the Pillar 3 page
            notice, not a footer line. Removed under D-008 rather than paraphrased.
          */}
        </div>
      </div>
    </footer>
  );
};
