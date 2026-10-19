import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The portal's outermost layout.
 *
 * It wraps **both** `/admin/login` and the protected screens, so it must not
 * call a session guard — a guard here would redirect the login page to itself
 * (`lib/auth/guard.ts` documents exactly that trap). The guard lives in
 * `app/admin/(protected)/layout.tsx`, and again at the top of every page below it.
 *
 * ### Deliberately not a security control
 *
 * `robots` and the `X-Robots-Tag` response header set in `next.config.mjs` are
 * discoverability controls. `docs/06-tech-and-security-spec.md` §27 states the
 * point directly: "`/admin` … excluded from sitemap.xml and robots.txt disallow
 * does NOT replace auth". The control is the server-side session check.
 *
 * `data-admin-shell` is the hook `app/globals.css` uses to suppress the public
 * header and footer for portal routes. See the comment there: the alternative
 * (moving every public page into a route group) is a public-site change and out of
 * this phase's scope.
 */

export const metadata: Metadata = {
  title: "Admin portal | NICBEN",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-shell className="min-h-[100dvh] bg-tint-50">
      {children}
    </div>
  );
}
