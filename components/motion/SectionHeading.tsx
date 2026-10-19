"use client";

import type { ReactNode } from "react";
import { Stagger, StaggerItem } from "./Stagger";

export interface SectionHeadingProps {
  eyebrow: ReactNode;
  heading: ReactNode;
  className?: string;
}

/**
 * Section heading reveal — `docs/05-motion-spec.md` row 43.
 *
 * Fade up 450ms at 15% in view, eyebrow chip first and the heading one
 * `--motion-stagger` step (80ms) later. It is deliberately a composition of the
 * two primitives and not a fourth animation model: the eyebrow and the heading
 * are the same two `StaggerItem`s the pillar cards use, with the same duration
 * and distance, so the group timing is one code path.
 *
 * Only blocks that really are a section heading use this. Section bodies, cards
 * and the referral note stay still — `docs/04-design-system.md` section 8
 * forbids a uniform fade-up on every element.
 */
export function SectionHeading({
  eyebrow,
  heading,
  className = "",
}: SectionHeadingProps) {
  return (
    <Stagger className={className} threshold={0.15}>
      <StaggerItem>{eyebrow}</StaggerItem>
      <StaggerItem>{heading}</StaggerItem>
    </Stagger>
  );
}
