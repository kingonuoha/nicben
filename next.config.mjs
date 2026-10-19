/**
 * Next configuration.
 *
 * Only one thing is configured here: the `X-Robots-Tag` response header for the
 * hidden administrative portal.
 *
 * `decisions.md` **D-004** requires `/admin` to be "completely unlinked from public
 * navigation, excluded from `sitemap.xml`, blocked in `robots.txt`
 * (`Disallow: /admin`), and returns `X-Robots-Tag: noindex, nofollow`".
 *
 * Three of those four are already satisfied elsewhere — the portal appears in neither
 * `components/layout/Header.tsx` nor `components/layout/Footer.tsx`, `app/sitemap.ts`
 * omits it, and `app/robots.ts` disallows it. The response header is the one that
 * cannot be set from a page: `app/admin/layout.tsx` can emit a
 * `<meta name="robots">` tag, but a `robots.txt`-honouring crawler that never
 * renders the document still reads the header first. Both are set, deliberately.
 *
 * `/api/admin/:path*` is covered too: an admin API response a crawler happens to
 * fetch should carry the same instruction as the screens it feeds.
 *
 * **This is a discoverability control, never a security boundary.**
 * `docs/06-tech-and-security-spec.md` §27: "`/admin` not linked anywhere,
 * `noindex, nofollow`, excluded from sitemap.xml and robots.txt disallow does NOT
 * replace auth". What protects the portal is the server-side session check on every
 * page and every API (`lib/auth/guard.ts`, `lib/admin/api.ts`).
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
