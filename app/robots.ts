import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `robots.txt`.
 *
 * `Disallow` is a **discoverability control only**. `docs/06-tech-and-security-spec.md`
 * section 27 states it explicitly: "`/admin` … excluded from sitemap.xml and
 * robots.txt disallow does NOT replace auth". The administrative portal must be
 * protected by server-side session checks (`06-tech-and-security-spec.md`
 * section 27 and the "Admin routes and admin APIs must all check the session on
 * the server" requirement), never by this file. Nothing here is a security
 * boundary.
 *
 * - `/admin` — sealed portal, never linked (D-004).
 * - `/styleguide` — development-only tool, gated out of production
 *   (`docs/07-build-order.md` Step 2: "not linked, noindex").
 *
 * `/projects` is not disallowed here: it is a real route that will be published
 * once real projects exist. It is kept out of `sitemap.xml` and out of the
 * header/footer until then, per `docs/03-copy-deck.md` section 12.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/styleguide"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
