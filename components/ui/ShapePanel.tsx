import React from "react";

export interface ShapePanelProps {
  className?: string;
  /** Compositional variation so stacked panels do not read as one repeated block. */
  motif?: "blueprint" | "arcs" | "drafting";
  tone?: "light" | "dark";
}

/**
 * ShapePanel — a token-only decorative panel.
 *
 * Used wherever a design screen places a photograph but no real, client-supplied
 * work photo exists. docs/04-design-system.md section 8 forbids stock photography
 * and AI-generated people, and section 5 requires photographic content to be real
 * work, so the frame is filled with geometry and palette instead of an image.
 *
 * Decorative by definition: it carries no text and is hidden from assistive
 * technology. Replace it with a real image only when the client supplies one.
 */
export const ShapePanel: React.FC<ShapePanelProps> = ({
  className = "",
  motif = "blueprint",
  tone = "light",
}) => {
  const isDark = tone === "dark";

  const base = isDark
    ? "bg-ink-950 border-surface/20 texture-grid-on-dark"
    : "bg-tint-100 border-line texture-grid";

  const grade = isDark
    ? "bg-gradient-to-br from-ink-950 via-ink-950 to-brand-700/40"
    : "bg-gradient-to-br from-brand-700/15 via-transparent to-accent-400/25";

  const stroke = isDark ? "text-accent-300/35" : "text-brand-700/30";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${base} ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 ${grade}`} />

      <svg
        className={`absolute inset-0 h-full w-full ${stroke}`}
        fill="none"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {motif === "blueprint" && (
          <>
            <rect x="56" y="34" width="96" height="56" stroke="currentColor" strokeWidth="1" />
            <path d="M0 164 L112 68 L232 120 L400 24" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="232" cy="120" r="5" fill="currentColor" />
            <path d="M112 68 V164" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          </>
        )}

        {motif === "arcs" && (
          <>
            <circle cx="304" cy="152" r="80" stroke="currentColor" strokeWidth="1" />
            <circle cx="304" cy="152" r="54" stroke="currentColor" strokeWidth="1" />
            <circle cx="304" cy="152" r="28" stroke="currentColor" strokeWidth="1" />
            <path d="M0 186 H152" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="152" cy="186" r="5" fill="currentColor" />
          </>
        )}

        {motif === "drafting" && (
          <>
            <path d="M0 44 H400" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
            <path d="M0 104 H400" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
            <path d="M0 164 H400" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
            <path d="M84 200 L188 0" stroke="currentColor" strokeWidth="1.5" />
            <path d="M240 200 L344 0" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    </div>
  );
};
