"use client";

import { motion } from "motion/react";
import { useReveal } from "./useReveal";
import type { Speed } from "./Reveal";
import type { MotionTokens } from "./tokens";

const SPEED_TOKEN: Record<Speed, keyof MotionTokens> = {
  fast: "durFast",
  base: "durBase",
  medium: "durMedium",
  slow: "durSlow",
};

export interface ScrollProgressProps {
  className?: string;
  /** Fraction of the rule that must be visible before it draws. Default 0.2. */
  threshold?: number;
  /** Viewport margin root buffer for comfortable viewing. Default "0px 0px -12% 0px". */
  margin?: string;
  /** Which motion token supplies the draw duration. Default "medium" (600ms). */
  speed?: Speed;
  /** ms. */
  delay?: number;
}

/**
 * `ScrollProgress` — the left-to-right draw used by the CTA band (row 45).
 *
 * The rule is a `scaleX(0)` → `scaleX(1)` transform with `transform-origin:
 * left`, which is the only way to "draw" a line without animating `width`
 * (section 8 forbids animating layout properties). It draws once, when the
 * element it is attached to scrolls to `threshold`, and never redraws on the way
 * back up (section 49).
 *
 * Reduced motion and no-JavaScript both leave the rule in its finished state:
 * the element ships untransformed, and the primitive only ever animates *to*
 * that state. A static underline is not motion, so section 53 is satisfied.
 *
 * Callers position it: `<ScrollProgress className="absolute inset-x-0 -bottom-1
 * h-px bg-accent-300" />`.
 */
export function ScrollProgress({
  className = "",
  threshold = 0.2,
  margin = "0px 0px -12% 0px",
  speed = "medium",
  delay = 0,
}: ScrollProgressProps) {
  const { ref, tokens, hidden } = useReveal(threshold, margin);

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      data-scroll-progress=""
      className={className}
      initial={false}
      animate={{ scaleX: hidden ? 0 : 1 }}
      style={{ transformOrigin: "left center" }}
      transition={
        hidden
          ? { duration: 0 }
          : {
              duration: (tokens[SPEED_TOKEN[speed]] as number) / 1000,
              delay: delay / 1000,
              ease: tokens.easeOut,
            }
      }
    />
  );
}
