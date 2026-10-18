/**
 * Canonical origin used for the absolute URLs in `app/sitemap.ts` and
 * `app/robots.ts`.
 *
 * The production domain is **not** known to the build: `docs/00-README.md:59`
 * lists the domain among the items that remain `[CLIENT TO CONFIRM]`, and D-012
 * forbids substituting a placeholder or plausible-looking address. The origin is
 * therefore read from the environment at build time and the fallback is the
 * local development origin — never a fabricated brand domain. A production
 * deployment must set `NEXT_PUBLIC_SITE_URL` (e.g. `https://example.com`) or the
 * generated sitemap will advertise `http://localhost:3000`.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
