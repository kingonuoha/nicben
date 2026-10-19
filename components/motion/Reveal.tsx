"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReveal } from "./useReveal";
import type { MotionTokens } from "./tokens";

/**
 * Named durations so a caller picks a documented speed instead of a number.
 * The set is the token set — nothing else is accepted (D-003).
 */
export type Speed = "fast" | "base" | "medium" | "slow";

const SPEED_TOKEN: Record<Speed, keyof MotionTokens> = {
  fast: "durFast",
  base: "durBase",
  medium: "durMedium",
  slow: "durSlow",
};

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Fraction of the element that must be visible. Default 0.2. */
  threshold?: number;
  /** Viewport margin root buffer for comfortable viewing. Default "0px 0px -12% 0px". */
  margin?: string;
  /** Which motion token supplies the duration. Default "base" (450ms). */
  speed?: Speed;
  /** Edge the element travels from. Default "bottom". */
  from?: "bottom" | "top" | "left" | "right";
  /** ms to wait after the element enters view. */
  delay?: number;
}

/**
 * `Reveal` — one element, one in-view trigger, one transform.
 *
 * `docs/05-motion-spec.md` section 5 + section 55: the element is rendered in
 * its resting, visible state and only hidden again by JavaScript after mount
 * (see `useReveal`). Transform and opacity are the only animated properties
 * (section 8), and the transform starts at its offset, so the hidden state
 * occupies exactly the same layout box — no CLS (section 49).
 *
 * Row 41 (About images) is the horizontal caller: `from="left" | "right"` uses
 * `--motion-reveal-distance-x` (32px) against the 24px vertical token, which is
 * why this component exists next to `Stagger` rather than being folded into it.
 */
export function Reveal({
  children,
  className = "",
  threshold = 0.2,
  margin = "0px 0px -12% 0px",
  speed = "base",
  from = "bottom",
  delay = 0,
}: RevealProps) {
  const { ref, tokens, hidden } = useReveal(threshold, margin);

  const horizontal = from === "left" || from === "right";
  const offset = horizontal ? tokens.distanceX : tokens.distance;

  const target = horizontal
    ? {
        opacity: hidden ? 0 : 1,
        x: hidden ? (from === "left" ? -offset : offset) : 0,
      }
    : {
        opacity: hidden ? 0 : 1,
        y: hidden ? (from === "top" ? -offset : offset) : 0,
      };

  return (
    <motion.div
      ref={ref}
      className={className}
      data-reveal=""
      data-reveal-from={from}
      initial={false}
      animate={target}
      transition={
        hidden
          ? // Arming is an instant state change, never an animation. Without
            // this the server-visible element would fade *out* on mount.
            { duration: 0 }
          : {
              duration: (tokens[SPEED_TOKEN[speed]] as number) / 1000,
              delay: delay / 1000,
              ease: tokens.easeOut,
            }
      }
    >
      {children}
    </motion.div>
  );
}
