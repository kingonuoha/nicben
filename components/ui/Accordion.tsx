"use client";

import React, { useState } from "react";

export interface AccordionItem {
  /** Stable id used to build the trigger/panel relationship. */
  id: string;
  question: string;
  answer: React.ReactNode;
  /** Optional row rendered under the answer (chips, links, callouts). */
  extra?: React.ReactNode;
}

export interface AccordionGroup {
  /** Anchor target id, e.g. `faq-group-about`. */
  id: string;
  title: string;
  items: readonly AccordionItem[];
}

export interface AccordionProps {
  groups: readonly AccordionGroup[];
  /** Id of the single item expanded on first paint. */
  defaultOpenId?: string;
}

/**
 * FAQ accordion.
 *
 * Accessibility: each trigger is a real `<button>` inside a heading with
 * `aria-expanded` + `aria-controls`; every panel is `role="region"` labelled by
 * its trigger. Enter/Space are handled natively by the button element.
 *
 * Motion: height is animated with the `accordion-panel` utility (grid-rows),
 * which reads its duration from `--motion-dur-base`. Under
 * `prefers-reduced-motion: reduce` that token collapses to 1ms, so the panel
 * shows and hides instantly. One item is open at a time.
 */
export const Accordion: React.FC<AccordionProps> = ({
  groups,
  defaultOpenId,
}) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-heading`}
          className="flex flex-col gap-4 scroll-mt-28"
        >
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-line">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0"
                aria-hidden="true"
              />
              <h2
                id={`${group.id}-heading`}
                className="text-lg sm:text-xl font-bold text-ink-950 tracking-tight"
              >
                {group.title}
              </h2>
            </div>
            <span className="text-xs font-semibold text-text-600 uppercase tracking-wider shrink-0">
              {group.items.length === 1
                ? "1 question"
                : `${group.items.length} questions`}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {group.items.map((item) => {
              const isOpen = openId === item.id;
              const triggerId = `${item.id}-trigger`;
              const panelId = `${item.id}-panel`;

              return (
                <div
                  key={item.id}
                  className="rounded-md bg-surface border border-line shadow-card overflow-hidden"
                >
                  <h3 className="text-base sm:text-lg">
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between gap-4 text-left p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-700 hover:bg-tint-50 transition-colors duration-[var(--motion-dur-fast)]"
                    >
                      <span className="font-bold text-ink-950 leading-snug">
                        {item.question}
                      </span>
                      <span
                        className={`w-10 h-10 rounded-full bg-tint-100 text-brand-700 flex items-center justify-center shrink-0 transition-transform duration-[var(--motion-dur-base)] ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </span>
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    data-open={isOpen ? "true" : "false"}
                    className="accordion-panel"
                  >
                    <div>
                      <div className="px-6 pb-6 pt-1 space-y-4">
                        <div className="text-sm text-text-600 leading-relaxed">
                          {item.answer}
                        </div>
                        {item.extra}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
