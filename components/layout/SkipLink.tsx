import React from "react";

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink-950 focus:text-surface focus:rounded-pill focus:shadow-float focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm transition-transform"
    >
      Skip to main content
    </a>
  );
};
