/**
 * Motion token bridge.
 *
 * Every duration, stagger, distance and easing curve used by the Motion
 * primitives lives in `app/globals.css` (`docs/tokens/tokens.css`) and nowhere
 * else. D-003 forbids duplicating those values in component code, so the
 * primitives read the computed custom properties at runtime instead of
 * carrying a second copy.
 *
 * Runtime reading buys one more guarantee for free: under
 * `prefers-reduced-motion: reduce` the stylesheet collapses
 * `--motion-dur-*`/`--motion-reveal-distance*`, and every Motion animation
 * built on these tokens inherits the collapse without an extra branch.
 *
 * The fallbacks below mirror the values in `globals.css` exactly and exist only
 * for the two cases where `getComputedStyle` is unavailable (server render) or
 * a property is missing. They are not a second source of truth: if a token
 * changes, this file changes with it or the reader silently falls back to the
 * documented default.
 */

/** `cubic-bezier()` control points, the shape Motion's `ease` accepts. */
export type Bezier = [number, number, number, number];

export interface MotionTokens {
  /** ms — hover, press (`--motion-dur-fast`). */
  durFast: number;
  /** ms — scroll reveals (`--motion-dur-base`). */
  durBase: number;
  /** ms — hero entrance, timeline (`--motion-dur-slow`). */
  durSlow: number;
  /** ms — About images, CTA band draw (`--motion-dur-medium`). */
  durMedium: number;
  /** ms — route change fade (`--motion-dur-route`). */
  durRoute: number;
  /** ms — one stagger step in a reveal group (`--motion-stagger`). */
  stagger: number;
  /** ms — hero fact-chip step (`--motion-stagger-hero`). */
  staggerHero: number;
  /** px — vertical reveal offset (`--motion-reveal-distance`). */
  distance: number;
  /** px — horizontal reveal offset for the About images (`--motion-reveal-distance-x`). */
  distanceX: number;
  /** Entrance / emphasis curve (`--motion-ease-out`). */
  easeOut: Bezier;
}

export const MOTION_FALLBACK: MotionTokens = {
  durFast: 180,
  durBase: 450,
  durSlow: 800,
  durMedium: 600,
  durRoute: 250,
  stagger: 80,
  staggerHero: 150,
  distance: 24,
  distanceX: 32,
  easeOut: [0.22, 1, 0.36, 1],
};

function readMs(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: number,
): number {
  const raw = styles.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  // `450ms` parses as 450; `0.45s` parses as 0.45 and needs the unit check.
  return raw.endsWith("ms") ? value : value * 1000;
}

function readPx(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: number,
): number {
  const raw = styles.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readBezier(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: Bezier,
): Bezier {
  const match = styles
    .getPropertyValue(name)
    .trim()
    .match(/cubic-bezier\(([^)]+)\)/);
  if (!match) return fallback;
  const points = match[1].split(",").map((point) => Number.parseFloat(point));
  if (points.length !== 4 || points.some((point) => !Number.isFinite(point))) {
    return fallback;
  }
  return [points[0], points[1], points[2], points[3]];
}

/** Read the live token values. Server-side this returns the fallbacks. */
export function readMotionTokens(): MotionTokens {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return MOTION_FALLBACK;
  }

  const styles = getComputedStyle(document.documentElement);

  return {
    durFast: readMs(styles, "--motion-dur-fast", MOTION_FALLBACK.durFast),
    durBase: readMs(styles, "--motion-dur-base", MOTION_FALLBACK.durBase),
    durSlow: readMs(styles, "--motion-dur-slow", MOTION_FALLBACK.durSlow),
    durMedium: readMs(
      styles,
      "--motion-dur-medium",
      MOTION_FALLBACK.durMedium,
    ),
    durRoute: readMs(styles, "--motion-dur-route", MOTION_FALLBACK.durRoute),
    stagger: readMs(styles, "--motion-stagger", MOTION_FALLBACK.stagger),
    staggerHero: readMs(
      styles,
      "--motion-stagger-hero",
      MOTION_FALLBACK.staggerHero,
    ),
    distance: readPx(
      styles,
      "--motion-reveal-distance",
      MOTION_FALLBACK.distance,
    ),
    distanceX: readPx(
      styles,
      "--motion-reveal-distance-x",
      MOTION_FALLBACK.distanceX,
    ),
    easeOut: readBezier(styles, "--motion-ease-out", MOTION_FALLBACK.easeOut),
  };
}
