import React from "react";

export interface OfficeMapProps {
  className?: string;
  height?: number | string;
  variant?: "surface" | "dark";
  showLink?: boolean;
}

const OSM_EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=-97.79536%2C26.48605%2C-97.77936%2C26.49605&layer=mapnik&marker=26.49105%2C-97.78736";

const OSM_LARGE_MAP_URL =
  "https://www.openstreetmap.org/?mlat=26.49105&mlon=-97.78736#map=16/26.49105/-97.78736";

/**
 * Reusable OpenStreetMap embed displaying NICBEN's registered office:
 * 494 Sonora Ave, Raymondville, TX 78580.
 *
 * Fully free, zero API key, zero third-party cookies, lazy-loaded.
 */
export const OfficeMap: React.FC<OfficeMapProps> = ({
  className = "",
  height = 280,
  variant = "surface",
  showLink = true,
}) => {
  const isDark = variant === "dark";

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        isDark
          ? "bg-surface/5 border-surface/20 shadow-float"
          : "bg-surface border-line shadow-card"
      } ${className}`}
    >
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isDark
            ? "bg-surface/10 border-surface/20 text-surface"
            : "bg-tint-50 border-line text-ink-950"
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isDark ? "bg-accent-400" : "bg-brand-500"
            }`}
            aria-hidden="true"
          />
          Registered Office
        </span>
        <span
          className={`text-xs ${
            isDark ? "text-accent-300" : "text-text-600 font-medium"
          }`}
        >
          Raymondville, TX
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden bg-tint-100"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <iframe
          title="NICBEN Registered Office Location - 494 Sonora Ave, Raymondville, TX 78580"
          width="100%"
          height={typeof height === "number" ? height + 36 : "calc(100% + 36px)"}
          loading="lazy"
          src={OSM_EMBED_URL}
          className="border-0 w-full block pointer-events-auto"
        />
      </div>

      <div
        className={`px-4 py-2 flex items-center justify-between text-xs border-t ${
          isDark
            ? "bg-surface/5 border-surface/20 text-text-on-dark/70"
            : "bg-tint-50/60 border-line text-text-600"
        }`}
      >
        <span className="text-[11px]">
          Map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-950 transition-colors"
          >
            OpenStreetMap
          </a>
        </span>
        {showLink && (
          <a
            href={OSM_LARGE_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold inline-flex items-center gap-1 transition-colors rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDark
                ? "text-accent-300 hover:text-surface focus-visible:outline-accent-300"
                : "text-brand-700 hover:text-ink-950 focus-visible:outline-brand-700"
            }`}
          >
            View Larger Map
            <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </div>
  );
};
