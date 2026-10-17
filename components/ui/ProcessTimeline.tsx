import React from "react";

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

/**
 * Reusable five-step process timeline, matching the Home "How we work" pattern
 * (`docs/01-sitemap-wireframes.md` section 4, Home item 6).
 * Steps are ordered (`<ol>`) because the sequence carries meaning.
 */
export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({
  steps,
  className = "",
}) => {
  return (
    <ol
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 ${className}`}
    >
      {steps.map((step) => (
        <li
          key={step.num}
          className="flex flex-col justify-between p-6 rounded-md border border-line bg-tint-50 shadow-card hover:border-brand-500 transition-colors duration-[var(--motion-dur-fast)]"
        >
          <div>
            <span
              className="font-heading font-extrabold text-2xl text-brand-700 block mb-3"
              aria-hidden="true"
            >
              {step.num}
            </span>
            <h3 className="text-base font-bold text-ink-950 mb-2">
              {step.title}
            </h3>
            <p className="text-xs text-text-600 leading-relaxed">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
