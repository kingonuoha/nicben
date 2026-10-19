"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import {
  MOTION_FALLBACK,
  readMotionTokens,
  type MotionTokens,
} from "./tokens";

/**
 * Shared in-view reveal state for `Reveal`, `Stagger` and `ScrollProgress`.
 *
 * The one rule that shapes this hook is `docs/05-motion-spec.md` section 55:
 * *never hide content behind an animation — if JavaScript fails, all content is
 * visible.* So the server renders every element in its final, visible state and
 * the hidden state is applied by JavaScript only after the component has
 * mounted:
 *
 *   1. server + first client render → `hidden === false` (visible);
 *   2. `useLayoutEffect` (before the browser paints the hydrated frame) arms the
 *      reveal — but only when an IntersectionObserver exists and the visitor has
 *      not asked for reduced motion. Arming before paint is what stops a
 *      visible flash followed by a jump back to the hidden state;
 *   3. `useInView({ once: true })` flips the element to visible the first time it
 *      crosses `threshold`, and never again (section 49: trigger once, never
 *      replay on scroll up).
 *
 * If hydration never runs, an observer never fires, or `IntersectionObserver`
 * is missing, `armed` stays false and the content simply stays visible. Nothing
 * is gated on an observer firing.
 *
 * Reduced motion (section 53): the hook refuses to arm, so no transform, scale,
 * fade or replay exists at all — the element is already in its resting state.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface RevealState {
  ref: React.RefObject<HTMLDivElement | null>;
  tokens: MotionTokens;
  /** True only while the element is armed and still outside the trigger. */
  hidden: boolean;
  reduced: boolean;
}

export function useReveal(
  threshold = 0.2,
  margin: any = "0px 0px -12% 0px"
): RevealState {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: threshold,
    margin,
  });
  const prefersReducedMotion = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const [tokens, setTokens] = useState<MotionTokens>(MOTION_FALLBACK);

  useIsomorphicLayoutEffect(() => {
    setTokens(readMotionTokens());

    // Nothing to reveal with, and nothing may stay hidden: run visible.
    if (typeof IntersectionObserver === "undefined") return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    setArmed(true);
  }, []);

  const reduced = prefersReducedMotion === true;

  return {
    ref,
    tokens,
    hidden: armed && !reduced && !inView,
    reduced,
  };
}
