import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `sitemap.xml` — public routes only.
 *
 * Excluded on purpose:
 * - `/admin` — sealed administrative portal (`docs/06-tech-and-security-spec.md`
 *   section 27: never in the sitemap; robots disallow is a discoverability
 *   control only and does NOT replace authentication).
 * - `/styleguide` — development-only tool, gated out of production
 *   (`docs/07-build-order.md` Step 2: "not linked, noindex").
 * - `/projects` — hidden until real projects exist
 *   (`docs/03-copy-deck.md` section 12, `docs/01-sitemap-wireframes.md:96`).
 *
 * Every entry below is a route whose H1 and metadata come from
 * `docs/03-copy-deck.md` section 14.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    { path: "/what-we-do", changeFrequency: "monthly", priority: 0.9 },
    {
      path: "/what-we-do/project-management-contracting",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      path: "/what-we-do/property-improvement-maintenance",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      path: "/what-we-do/treasury-investments",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.7 },
    { path: "/service-areas", changeFrequency: "monthly", priority: 0.7 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
