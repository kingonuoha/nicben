import type { Metadata } from "next";
import { Bricolage_Grotesque, Montserrat, Caveat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NICBEN Asset Holdings & Investments",
  description:
    "Integrated project management, property improvement, and treasury management across Texas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${montserrat.variable} ${caveat.variable}`}
    >
      <body className="font-body text-text-900 bg-tint-50 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-surface">
        <SkipLink />
        <Header />
        {/*
          R2a-1: the fixed pill header sits over the page at every route, so the
          clearance is restored once, here. Measured header bottom is 78 px at
          360 px and 74 px above the sm breakpoint (production build, CDP device
          metrics), so `pt-20` (80 px) clears it by construction rather than by
          per-page padding. `pt-20` is the Tailwind step on the documented
          4 px spacing scale (docs/04-design-system.md section 4).
        */}
        <div id="main-content" className="flex-1 pt-20">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
