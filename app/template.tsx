"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Route-change fade — `docs/05-motion-spec.md` section 4 row 1, brief row 33.
 *
 * `template.tsx` is the only App Router boundary that remounts on every
 * navigation, which is exactly the lifetime of a route transition: the fresh
 * instance replays the `route-fade` keyframes (250ms, ease-out, opacity only —
 * no slide) while the untouched layout above it stays put.
 *
 * Why CSS: an `initial={{ opacity: 0 }}` Motion wrapper would be written into the
 * server HTML, and a visitor without JavaScript would meet a permanently blank
 * page (section 55). A CSS keyframe always runs to completion, with or without
 * the client bundle.
 *
 * The hidden admin portal opts out: navigation inside `/admin` is console work,
 * not presentation, and the Phase 06 shell was verified without a content
 * fade.
 */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return <div className="route-fade">{children}</div>;
}
