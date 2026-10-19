"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useReveal } from "@/components/motion/useReveal";

export interface ProcessStep {
  /** Displayed step marker, e.g. `01`. */
  num: string;
  title: string;
  body: string;
}

export interface ProcessTimelineProps {
  steps: readonly ProcessStep[];
  className?: string;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Reusable process timeline, matching the Home "How we work" pattern
 * (`docs/01-sitemap-wireframes.md` section 4, Home item 6).
 *
 * Structure (`docs/04-design-system.md` section 5): numbered steps connected by a
 * line that fills as the user scrolls, each step a card with its number in a
 * circle. Steps are an ordered list because the sequence carries meaning.
 *
 * Motion (`docs/05-motion-spec.md` section 4):
 * - Sequential reveal down the 5 steps (`01` -> `05`) with 140ms step lag.
 * - Card hover: lifts -4px (`card-lift`), border brightens, number indicator lights up to brand teal.
 * - The connector fill is scroll-linked.
 *
 * Reduced motion (section 5): the scroll listener is never attached and the
 * line renders fully filled. Under `prefers-reduced-motion: reduce`, all cards render static and visible.
 */
export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({
  steps,
  className = "",
}) => {
  const listRef = useRef<HTMLOListElement>(null);
  const { ref: revealRef, tokens, hidden } = useReveal(0.2, "0px 0px -12% 0px");
  /** 1 = fully filled. */
  const [progress, setProgress] = useState(1);
  /**
   * Transition is attached only once the fill is genuinely scroll-driven, so
   * the first measurement snaps silently instead of animating from the
   * server-rendered completed line.
   */
  const [scrollDriven, setScrollDriven] = useState(false);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (typeof window.matchMedia !== "function") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let attached = false;

    const measure = () => {
      const rect = list.getBoundingClientRect();
      const viewport =
        window.innerHeight || document.documentElement.clientHeight || 0;
      if (rect.height <= 0 || viewport <= 0) return;
      // The fill completes as the timeline's own bottom edge crosses the
      // trigger line, which sits low in the viewport.
      const trigger = viewport * 0.72;
      setProgress(clamp01((trigger - rect.top) / rect.height));
    };

    const onScroll = () => {
      setScrollDriven(true);
      measure();
    };

    const onReducedChange = () => {
      if (reduced.matches) {
        detach();
        setProgress(1);
      } else {
        attach();
      }
    };

    function attach() {
      if (attached) return;
      attached = true;
      measure();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    }

    function detach() {
      if (!attached) return;
      attached = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }

    attach();

    if (typeof reduced.addEventListener === "function") {
      reduced.addEventListener("change", onReducedChange);
    }

    return () => {
      detach();
      if (typeof reduced.removeEventListener === "function") {
        reduced.removeEventListener("change", onReducedChange);
      }
    };
  }, []);

  const segments = Math.max(steps.length - 1, 1);

  return (
    <ol
      ref={(node) => {
        listRef.current = node;
        (revealRef as React.MutableRefObject<HTMLOListElement | null>).current = node;
      }}
      className={`flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-6 ${className}`}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        // Each connector occupies one share of the overall progress.
        const fill = clamp01(progress * segments - index);
        const fillStyle: React.CSSProperties = {
          transform: `scaleY(${fill})`,
          transformOrigin: "top",
          transitionDuration: "var(--motion-dur-fast)",
        };
        const fillStyleDesktop: React.CSSProperties = {
          transform: `scaleX(${fill})`,
          transformOrigin: "left",
          transitionDuration: "var(--motion-dur-fast)",
        };
        const fillClass = `block h-full w-full bg-brand-500${
          scrollDriven ? " transition-transform" : ""
        }`;

        return (
          <motion.li
            key={step.num}
            initial={false}
            animate={hidden ? { opacity: 0, y: tokens.distance } : { opacity: 1, y: 0 }}
            transition={
              hidden
                ? { duration: 0 }
                : {
                    duration: tokens.durBase / 1000,
                    delay: (index * 140) / 1000,
                    ease: tokens.easeOut,
                  }
            }
            className="group card-lift relative flex-1 min-w-0 rounded-xl border border-line bg-tint-50 shadow-card p-6 transition-all duration-300 hover:border-brand-500 hover:bg-surface"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-11 h-11 shrink-0 rounded-full bg-tint-100 border border-line text-brand-700 font-heading text-sm font-extrabold flex items-center justify-center transition-all duration-200 group-hover:bg-brand-500 group-hover:text-surface group-hover:border-brand-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                aria-hidden="true"
              >
                {step.num}
              </span>
              <h3 className="text-base font-bold text-ink-950 leading-snug">
                {step.title}
              </h3>
            </div>
            <p className="mt-3 text-sm text-text-600 leading-relaxed">
              {step.body}
            </p>

            {!isLast && (
              <>
                {/* Compact connector: vertical, aligned under the number circle. */}
                <span
                  aria-hidden="true"
                  className="lg:hidden absolute left-12 -bottom-4 h-4 w-px bg-line overflow-hidden"
                >
                  <span className={fillClass} style={fillStyle} />
                </span>
                {/* Desktop connector: horizontal, aligned with the number circle row. */}
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute top-12 -translate-y-1/2 -right-6 w-6 h-px bg-line overflow-hidden"
                >
                  <span className={fillClass} style={fillStyleDesktop} />
                </span>
              </>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
};
