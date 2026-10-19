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

/**
 * R-K: root metadata fallback. `docs/03-copy-deck.md` section 14 supplies no
 * site-wide default row, so the Home row is used **verbatim** (`:219`) and every
 * route exports its own section 14 pair. The previous fallback
 * ("Integrated project management, property improvement, and treasury management
 * across Texas.") had no deck line and was inherited by any route that did not
 * export metadata — it appeared on `/styleguide` and `/_not-found`.
 */
export const metadata: Metadata = {
  title: {
    default: "NICBEN Asset Holdings & Investments, Texas",
    template: "%s | NICBEN",
  },
  description:
    "Privately owned Texas LLC: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
  metadataBase: new URL("https://nicben.com"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
      { url: "/images/brand/nicben-logo-mark-dark.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/images/brand/nicben-logo-mark-dark.png" },
    ],
  },
  openGraph: {
    title: "NICBEN Asset Holdings & Investments, Texas",
    description:
      "Privately owned Texas LLC: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
    siteName: "NICBEN Asset Holdings & Investments LLC",
    url: "https://nicben.com",
    images: [
      {
        url: "/images/brand/nicben-meta-banner.jpg",
        width: 1200,
        height: 630,
        alt: "NICBEN Asset Holdings & Investments LLC — Texas LLC",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NICBEN Asset Holdings & Investments, Texas",
    description:
      "Privately owned Texas LLC: project management and contracting, property improvement and maintenance, and corporate treasury and investments.",
    images: ["/images/brand/nicben-meta-banner.jpg"],
  },
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
