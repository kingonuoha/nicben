import { cache } from "react";

import { requireAdminSession } from "@/lib/auth/guard";

/**
 * The portal's page guard, memoised per request.
 *
 * `docs/06-tech-and-security-spec.md` §27 is the rule every screen is built on:
 * "Admin routes and admin APIs must all check the session **on the server**;
 * never rely on hidden UI."
 *
 * The portal enforces it twice on every protected route — once in
 * `app/admin/(protected)/layout.tsx`, so a page cannot be added without it, and
 * once at the top of the page itself, so the guarantee does not depend on a
 * single file staying correct. Both call this function:
 *
 * - verification is identical because it is the same function;
 * - React's `cache()` dedupes the two calls within one request, so the layout
 *   guard does not cost a second repository read for the same page render.
 *
 * `requireAdminSession()` redirects (`/admin/login`) rather than returning when
 * there is no valid session, and it never returns for a cookie that is absent,
 * malformed, forged, expired or names an account that no longer exists
 * (`lib/auth/guard.ts`). A redirect thrown inside `cache()` propagates to both
 * callers, which is the outcome the guard exists to produce.
 *
 * Server-only: it imports `lib/auth/*`, which reads cookies and `node:crypto`.
 */

export const adminSession = cache(requireAdminSession);
