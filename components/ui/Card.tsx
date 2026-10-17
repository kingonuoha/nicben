import React from "react";

export interface CardProps {
  children: React.ReactNode;
  variant?: "surface" | "tint" | "ink" | "brand" | "accent";
  notched?: boolean;
  notchedCorner?: "top-right" | "bottom-right";
  className?: string;
  onClick?: () => void;
}

type ResolvedVariant = "surface" | "tint" | "ink" | "brand";

/**
 * Concave scoop radius in pixels. A 28px radius reads as a sizeable corner cut
 * on a ~230px card while staying well clear of the card's padding box.
 */
const SCOOP_R = 28;

/**
 * Build the CSS polygon + arc clip-path for a concave circular notch.
 *
 * The scoop runs from `(100% - r, 0)` to `(100%, r)`; the region between the
 * arc and the corner is removed. With the documented card geometry (r = 28,
 * content inset 24-32px) the removed region is a corner sliver that stays
 * inside the card's padding, never the content box.
 *
 * This path is applied ONLY to the decorative background layer (see below), so
 * even if a caller reduces the padding or enlarges the button, nothing inside
 * the card can be clipped.
 */
function scoopClipPath(corner: "top-right" | "bottom-right"): string {
  const steps = 12;
  const r = SCOOP_R;

  if (corner === "top-right") {
    const arcPoints: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (Math.PI / 2) * (i / steps); // 0 → π/2
      const x = `calc(100% - ${(r * Math.cos(angle)).toFixed(2)}px)`;
      const y = `${(r - r * Math.sin(angle)).toFixed(2)}px`;
      arcPoints.push(`${x} ${y}`);
    }
    return `polygon(0 0, calc(100% - ${r}px) 0, ${arcPoints.join(", ")}, 100% ${r}px, 100% 100%, 0 100%)`;
  }

  const arcPoints: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (Math.PI / 2) * (i / steps);
    const x = `calc(100% - ${(r - r * Math.sin(angle)).toFixed(2)}px)`;
    const y = `calc(100% - ${(r * Math.cos(angle)).toFixed(2)}px)`;
    arcPoints.push(`${x} ${y}`);
  }
  return `polygon(0 0, 100% 0, 100% calc(100% - ${r}px), ${arcPoints.join(", ")}, calc(100% - ${r}px) 100%, 0 100%)`;
}

/** Surface fill + border, no shadow (the shadow stays on the unclipped root). */
const PANEL: Record<ResolvedVariant, string> = {
  surface: "bg-surface border-line",
  tint: "bg-tint-100/70 border-line",
  ink: "bg-ink-950 border-ink-950",
  brand: "bg-brand-700 border-brand-700",
};

const SHADOW: Record<ResolvedVariant, string> = {
  surface: "shadow-card",
  tint: "shadow-card",
  ink: "shadow-float",
  brand: "shadow-float",
};

const TEXT: Record<ResolvedVariant, string> = {
  surface: "text-text-900",
  tint: "text-text-900",
  ink: "text-surface",
  brand: "text-surface",
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = "surface",
  notched = false,
  notchedCorner = "top-right",
  className = "",
  onClick,
}) => {
  // 'accent' is an alias for 'brand' — both resolve to the same style
  const resolvedVariant: ResolvedVariant =
    variant === "accent" ? "brand" : variant;

  /*
    Notched cards are built in two layers:

    1. the root — border, padding, shadow, hover lift. NEVER clipped, so it can
       never cut a descendant. `card-notched` gives the real children their own
       positioned paint layer (globals.css) so they render above layer 2.
    2. a decorative background layer carrying the fill, the border and the
       concave scoop clip-path.

    Layer 2 is `aria-hidden` and `pointer-events-none`, so the visual notch and
    the interactive box are fully decoupled.
  */
  const rootClass = notched
    ? `card-notched group card-lift relative rounded-2xl border border-transparent p-6 md:p-8 ${SHADOW[resolvedVariant]} ${TEXT[resolvedVariant]}`
    : `group card-lift relative rounded-2xl border p-6 md:p-8 ${PANEL[resolvedVariant]} ${SHADOW[resolvedVariant]} ${TEXT[resolvedVariant]}`;

  return (
    <div onClick={onClick} className={`${rootClass} ${className}`}>
      {notched && (
        <span
          data-notch-layer=""
          aria-hidden="true"
          className={`absolute inset-0 rounded-2xl border pointer-events-none ${PANEL[resolvedVariant]}`}
          style={{ clipPath: scoopClipPath(notchedCorner) }}
        />
      )}
      {children}
    </div>
  );
};
