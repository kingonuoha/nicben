"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      // On home page, consider scrolled after 80px
      setScrolled(window.scrollY > 80);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const pillars = [
    {
      title: "Project Management & Contracting",
      desc: "Turnkey coordination and delivery for construction-related projects.",
      href: "/what-we-do/project-management-contracting",
      badge: "Pillar 01",
    },
    {
      title: "Property Improvement & Maintenance",
      desc: "Renovation, plumbing, and physical plant preservation.",
      href: "/what-we-do/property-improvement-maintenance",
      badge: "Pillar 02",
    },
    {
      title: "Corporate Treasury & Investments",
      desc: "Internal liquidity management using company-owned funds.",
      href: "/what-we-do/treasury-investments",
      badge: "Pillar 03",
    },
  ];

  // Dynamic theme based on scroll & page:
  // When at top of homepage: Dark translucent aesthetic with crisp white text.
  // When scrolled OR on subpages: Standard clean white/surface pill with dark ink text.
  const isDarkHeroMode = isHomePage && !scrolled;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 pt-3 sm:pt-4 px-4 sm:px-6">
      <div
        className={`max-w-container mx-auto transition-all duration-300 rounded-pill ${
          isDarkHeroMode
            ? "bg-ink-950/40 backdrop-blur-md border border-surface/20 shadow-float py-3 px-4 sm:px-6"
            : scrolled
            ? "bg-surface/90 backdrop-blur-md border border-line shadow-float py-2.5 px-4 sm:px-6"
            : "bg-surface/80 backdrop-blur-sm border border-line/60 shadow-sm py-3 px-4 sm:px-6"
        } flex items-center justify-between`}
      >
        {/* Brand Logo / Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 rounded-md"
        >
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm tracking-wider ${
              isDarkHeroMode
                ? "bg-surface text-ink-950"
                : "bg-ink-950 text-surface"
            }`}
          >
            NB
          </span>
          <span
            className={`font-heading font-extrabold ${
              isDarkHeroMode ? "text-surface" : "text-ink-950"
            }`}
          >
            NICBEN
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className={`hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium ${
            isDarkHeroMode ? "text-surface/85" : "text-text-600"
          }`}
        >
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-pill transition-colors ${
              isDarkHeroMode
                ? "hover:text-surface hover:bg-surface/15 text-surface font-semibold"
                : pathname === "/"
                ? "text-ink-950 font-semibold"
                : "hover:text-ink-950 hover:bg-tint-100/60"
            }`}
          >
            Home
          </Link>

          {/* What We Do Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onMouseEnter={() => setDropdownOpen(true)}
              aria-expanded={dropdownOpen}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-pill transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 ${
                isDarkHeroMode
                  ? "hover:text-surface hover:bg-surface/15"
                  : "hover:text-ink-950 hover:bg-tint-100/60"
              } ${
                pathname.startsWith("/what-we-do")
                  ? isDarkHeroMode
                    ? "text-surface font-semibold"
                    : "text-ink-950 font-semibold"
                  : ""
              }`}
            >
              <span>What We Do</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-accent-300" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                onMouseLeave={() => setDropdownOpen(false)}
                className="absolute top-full left-0 mt-2 w-80 sm:w-96 p-3 bg-surface rounded-2xl border border-line shadow-float animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="p-2 border-b border-line mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-600 uppercase tracking-wider">
                    Our Three Disciplines
                  </span>
                  <Link
                    href="/what-we-do"
                    className="text-xs text-brand-700 hover:underline font-semibold"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-1">
                  {pillars.map((pillar) => (
                    <Link
                      key={pillar.badge}
                      href={pillar.href}
                      className="block p-3 rounded-xl hover:bg-tint-50 border border-transparent hover:border-line transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-brand-700">
                          {pillar.badge}
                        </span>
                        <span className="text-xs text-text-600 group-hover:translate-x-0.5 transition-transform">
                          →
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-ink-950 mt-1">
                        {pillar.title}
                      </h4>
                      <p className="text-xs text-text-600 mt-1 leading-snug">
                        {pillar.desc}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/about"
            className={`px-3 py-1.5 rounded-pill transition-colors ${
              isDarkHeroMode
                ? "hover:text-surface hover:bg-surface/15"
                : "hover:text-ink-950 hover:bg-tint-100/60"
            } ${
              pathname === "/about"
                ? isDarkHeroMode
                  ? "text-surface font-semibold"
                  : "text-ink-950 font-semibold"
                : ""
            }`}
          >
            About
          </Link>

          <Link
            href="/contact"
            className={`px-3 py-1.5 rounded-pill transition-colors ${
              isDarkHeroMode
                ? "hover:text-surface hover:bg-surface/15"
                : "hover:text-ink-950 hover:bg-tint-100/60"
            } ${
              pathname === "/contact"
                ? isDarkHeroMode
                  ? "text-surface font-semibold"
                  : "text-ink-950 font-semibold"
                : ""
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="hidden sm:block">
          <Button
            variant={isDarkHeroMode ? "accent" : "primary"}
            size="sm"
            withArrow
            href="/contact"
          >
            Get in Touch
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className={`md:hidden p-2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 ${
            isDarkHeroMode
              ? "text-surface hover:bg-surface/20"
              : "text-ink-950 hover:bg-tint-100"
          }`}
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Slide-Over Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[72px] z-50 bg-ink-950/40 backdrop-blur-sm md:hidden">
          <div className="bg-surface border-b border-line p-6 max-h-[85vh] overflow-y-auto rounded-b-3xl shadow-float animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-lg font-bold text-ink-950 py-1 border-b border-line/60"
              >
                Home
              </Link>
              <div className="py-1">
                <Link
                  href="/what-we-do"
                  className="text-lg font-bold text-ink-950 block mb-2"
                >
                  What We Do
                </Link>
                <div className="pl-3 border-l-2 border-brand-500 space-y-2 mt-2">
                  {pillars.map((pillar) => (
                    <Link
                      key={pillar.badge}
                      href={pillar.href}
                      className="block py-1 text-sm font-medium text-text-600 hover:text-ink-950"
                    >
                      <span className="text-xs text-brand-700 block font-semibold">
                        {pillar.badge}
                      </span>
                      {pillar.title}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/about"
                className="text-lg font-bold text-ink-950 py-1 border-b border-line/60"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-lg font-bold text-ink-950 py-1 border-b border-line/60"
              >
                Contact
              </Link>
              <div className="pt-4">
                <Button variant="primary" size="lg" withArrow href="/contact" className="w-full">
                  Get in Touch
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
