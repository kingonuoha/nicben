import React from "react";

export interface EyebrowChipProps {
  children: React.ReactNode;
  dotColor?: "teal" | "sky" | "navy";
  className?: string;
}

export const EyebrowChip: React.FC<EyebrowChipProps> = ({
  children,
  dotColor = "teal",
  className = "",
}) => {
  const dotClass = {
    teal: "bg-brand-500",
    sky: "bg-accent-400",
    navy: "bg-ink-950",
  }[dotColor];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface border border-line text-xs font-semibold uppercase tracking-wider text-text-600 shadow-sm ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
};
