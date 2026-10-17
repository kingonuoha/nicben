import React from "react";

export interface CardProps {
  children: React.ReactNode;
  variant?: "surface" | "tint" | "ink" | "brand" | "accent";
  notched?: boolean;
  notchedCorner?: "top-right" | "bottom-right";
  className?: string;
  onClick?: () => void;
}

/**
 * Concave scoop radius in pixels — sized to visually seat the CornerArrowButton.
 * Matches the md CornerArrowButton (44px / ~2 ≈ 28px visual radius).
 */
const SCOOP_R = 28;

/**
 * Build a CSS polygon + arc clip-path that cuts a concave circular notch.
 * The notch is in the specified corner so the CornerArrowButton can sit flush.
 */
function scoopClipPath(corner: "top-right" | "bottom-right"): string {
  // We approximate the concave arc with a set of polygon points.
  // For a true circular arc we generate points along a quarter-circle.
  const steps = 12;
  const r = SCOOP_R;

  if (corner === "top-right") {
    // Notch is top-right corner.
    // Polygon walks: top-left → top edge up to notch start → concave arc → right edge → bottom-right → bottom-left
    const arcPoints: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (Math.PI / 2) * (i / steps); // 0 → π/2
      const x = `calc(100% - ${(r * Math.cos(angle)).toFixed(2)}px)`;
      const y = `${(r - r * Math.sin(angle)).toFixed(2)}px`;
      arcPoints.push(`${x} ${y}`);
    }
    return `polygon(0 0, calc(100% - ${r}px) 0, ${arcPoints.join(", ")}, 100% ${r}px, 100% 100%, 0 100%)`;
  }

  // bottom-right
  const arcPoints: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (Math.PI / 2) * (i / steps);
    const x = `calc(100% - ${(r - r * Math.sin(angle)).toFixed(2)}px)`;
    const y = `calc(100% - ${(r * Math.cos(angle)).toFixed(2)}px)`;
    arcPoints.push(`${x} ${y}`);
  }
  return `polygon(0 0, 100% 0, 100% calc(100% - ${r}px), ${arcPoints.join(", ")}, calc(100% - ${r}px) 100%, 0 100%)`;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "surface",
  notched = false,
  notchedCorner = "top-right",
  className = "",
  onClick,
}) => {
  // 'accent' is an alias for 'brand' — both resolve to the same style
  const resolvedVariant = variant === "accent" ? "brand" : variant;

  const variantStyles = {
    surface: "bg-surface border-line text-text-900 shadow-card",
    tint: "bg-tint-100/70 border-line text-text-900 shadow-card",
    ink: "bg-ink-950 border-ink-950 text-surface shadow-float",
    brand: "bg-brand-700 border-brand-700 text-surface shadow-float",
  }[resolvedVariant];

  // For notched cards matching docs/design/ — concave scoop via clip-path
  const notchClass = notched
    ? "relative overflow-hidden rounded-2xl"
    : "rounded-2xl";

  const clipStyle: React.CSSProperties = notched
    ? { clipPath: scoopClipPath(notchedCorner) }
    : {};

  return (
    <div
      onClick={onClick}
      className={`border p-6 md:p-8 transition-all duration-200 ${variantStyles} ${notchClass} ${className}`}
      style={clipStyle}
    >
      {children}
    </div>
  );
};
