import React from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  withArrow?: boolean;
  external?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  href,
  withArrow = false,
  external = false,
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-pill transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-50 disabled:cursor-not-allowed group";

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2.5",
    lg: "text-base px-6 py-3.5 gap-3",
  }[size];

  const variantStyles = {
    primary:
      "bg-ink-950 text-surface hover:bg-brand-700 active:bg-ink-950 shadow-sm",
    secondary:
      "bg-surface text-ink-950 border border-line hover:border-brand-500 hover:text-brand-700 active:bg-tint-100",
    accent:
      "bg-accent-400 text-ink-950 hover:bg-accent-300 font-semibold shadow-sm",
    ghost:
      "bg-transparent text-text-600 hover:text-ink-950 hover:bg-tint-100/60",
  }[variant];

  const arrowCircle = withArrow ? (
    <span
      className={`inline-flex items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
        size === "sm" ? "w-4 h-4 ml-0.5" : size === "lg" ? "w-6 h-6 ml-1" : "w-5 h-5 ml-1"
      } ${
        variant === "primary"
          ? "bg-surface text-ink-950"
          : variant === "accent"
          ? "bg-ink-950 text-surface"
          : "bg-ink-950 text-surface"
      }`}
      aria-hidden="true"
    >
      <svg
        className={size === "sm" ? "w-2.5 h-2.5" : size === "lg" ? "w-3.5 h-3.5" : "w-3 h-3"}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    </span>
  ) : null;

  const combinedClasses = `${baseStyles} ${sizeStyles} ${variantStyles} ${className}`;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {children}
          {arrowCircle}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {children}
        {arrowCircle}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
      {arrowCircle}
    </button>
  );
};
