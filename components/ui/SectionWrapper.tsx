import React from "react";

export interface SectionWrapperProps {
  id?: string;
  as?: "section" | "div" | "article" | "footer";
  className?: string;
  containerClassName?: string;
  background?: "tint-50" | "tint-100" | "surface" | "ink" | "brand";
  children: React.ReactNode;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  as: Component = "section",
  className = "",
  containerClassName = "",
  background = "tint-50",
  children,
}) => {
  const bgStyles = {
    "tint-50": "bg-tint-50",
    "tint-100": "bg-tint-100",
    surface: "bg-surface",
    ink: "bg-ink-950 text-surface",
    brand: "bg-brand-700 text-surface",
  }[background];

  return (
    <Component
      id={id}
      className={`py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 ${bgStyles} ${className}`}
    >
      <div className={`max-w-container mx-auto ${containerClassName}`}>
        {children}
      </div>
    </Component>
  );
};
