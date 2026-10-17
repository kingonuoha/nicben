import React from "react";
import Link from "next/link";

export interface CornerArrowButtonProps {
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const CornerArrowButton: React.FC<CornerArrowButtonProps> = ({
  href,
  onClick,
  ariaLabel = "View details",
  size = "md",
  className = "",
}) => {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  /*
    The 45deg hover/focus rotation from docs/05-motion-spec.md section 4 is
    driven by the `corner-arrow` utility in globals.css, which sits next to the
    `.group` selector. That keeps the transform and its
    `prefers-reduced-motion: reduce` fallback in one place — a Tailwind
    `group-hover:rotate-45` pair cannot be reliably overridden by
    `motion-reduce:group-hover:rotate-0` because both compile to the same
    specificity and the winner is source order.
  */
  const baseStyles = `corner-arrow inline-flex items-center justify-center rounded-full bg-ink-950 text-surface hover:bg-brand-700 active:bg-ink-950 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${sizeStyles} ${className}`;

  const icon = (
    <svg
      className={iconSizes}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={baseStyles}>
        {icon}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={baseStyles}>
      {icon}
    </button>
  );
};
