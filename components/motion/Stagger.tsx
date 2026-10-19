"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { useReveal } from "./useReveal";
import { MOTION_FALLBACK, type MotionTokens } from "./tokens";
import type { Speed } from "./Reveal";

/**
 * Section 49: "stagger groups cap at 6 items". The seventh child and anything
 * after it start with the sixth child instead of pushing the group later and
 * later. Nothing is ever dropped — the cap changes the delay, never the content.
 */
const MAX_STAGGER_ITEMS = 6;

const SPEED_TOKEN: Record<Speed, keyof MotionTokens> = {
  fast: "durFast",
  base: "durBase",
  medium: "durMedium",
  slow: "durSlow",
};

interface StaggerState {
  hidden: boolean;
  tokens: MotionTokens;
  step: number;
  duration: number;
  distance: number;
}

const StaggerContext = createContext<StaggerState | null>(null);

export interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Fraction of the group that must be visible. Default 0.2. */
  threshold?: number;
  /** Viewport margin root buffer for comfortable viewing. Default "0px 0px -12% 0px". */
  margin?: string;
  /** Which motion token supplies the duration. Default "base" (450ms). */
  speed?: Speed;
  /** Custom delay in ms between consecutive children. Default reads token (80ms). */
  step?: number;
  /** Custom vertical reveal distance in px. Default reads token (24px). */
  distance?: number;
}

/**
 * `Stagger` — a group that enters together, one child after another.
 *
 * Row 38 (three-pillar cards) and row 43 (section headings: eyebrow first,
 * heading one 80ms step later) are the two callers. The group owns the single
 * in-view observer; the children own the transforms. Every child receives the
 * same duration and the same distance — only its delay differs. That is what
 * makes the three pillar cards measurably equal in timing and travel (D-001)
 * instead of three hand-tuned one-offs.
 *
 * Direct children must be `StaggerItem` elements: the group injects each child's
 * position into it. Any other node is passed through untouched and stays
 * visible.
 */
export function Stagger({
  children,
  className = "",
  threshold = 0.2,
  margin = "0px 0px -12% 0px",
  speed = "base",
  step,
  distance,
}: StaggerProps) {
  const { ref, tokens, hidden } = useReveal(threshold, margin);
  const items = Children.toArray(children);

  const state: StaggerState = {
    hidden,
    tokens,
    step: step ?? tokens.stagger,
    duration: tokens[SPEED_TOKEN[speed]] as number,
    distance: distance ?? tokens.distance,
  };

  return (
    <StaggerContext.Provider value={state}>
      <div ref={ref} className={className} data-stagger="">
        {items.map((child, index) =>
          isValidElement(child)
            ? cloneElement(child as ReactElement<{ index?: number }>, { index })
            : child,
        )}
      </div>
    </StaggerContext.Provider>
  );
}

export interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  /** Injected by `Stagger`; do not pass by hand. */
  index?: number;
}

/**
 * One child of a `Stagger`. Renders a `motion.div` so the offset lives on a
 * transform that cannot move the layout, and flips to visible the moment the
 * group's observer fires. Outside a `Stagger` it simply renders visible.
 */
export function StaggerItem({
  children,
  className = "",
  index = 0,
}: StaggerItemProps) {
  const state = useContext(StaggerContext);
  const hidden = state?.hidden ?? false;
  const tokens = state?.tokens ?? MOTION_FALLBACK;
  const distance = state?.distance ?? tokens.distance;
  const step = Math.min(index, MAX_STAGGER_ITEMS - 1);

  return (
    <motion.div
      className={className}
      data-stagger-item=""
      data-stagger-index={step}
      initial={false}
      animate={hidden ? { opacity: 0, y: distance } : { opacity: 1, y: 0 }}
      transition={
        hidden
          ? { duration: 0 }
          : {
              duration: (state?.duration ?? tokens.durBase) / 1000,
              delay: state ? (step * state.step) / 1000 : 0,
              ease: tokens.easeOut,
            }
      }
    >
      {children}
    </motion.div>
  );
}
