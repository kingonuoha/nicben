import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* Colours map through the `-rgb` triplet tokens with `<alpha-value>` so
         Tailwind can resolve opacity modifiers (e.g. bg-surface/10). Mapping
         straight to `var(--color-x)` silently drops every `/NN` modifier in v3.
         D-003 still holds: the values live in docs/tokens, not here. */
      colors: {
        ink: {
          950: "rgb(var(--color-ink-950-rgb) / <alpha-value>)",
        },
        brand: {
          700: "rgb(var(--color-brand-700-rgb) / <alpha-value>)",
          500: "rgb(var(--color-brand-500-rgb) / <alpha-value>)",
        },
        accent: {
          400: "rgb(var(--color-accent-400-rgb) / <alpha-value>)",
          300: "rgb(var(--color-accent-300-rgb) / <alpha-value>)",
        },
        tint: {
          100: "rgb(var(--color-tint-100-rgb) / <alpha-value>)",
          50: "rgb(var(--color-tint-50-rgb) / <alpha-value>)",
        },
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        line: "rgb(var(--color-line-rgb) / <alpha-value>)",
        text: {
          900: "rgb(var(--color-text-900-rgb) / <alpha-value>)",
          600: "rgb(var(--color-text-600-rgb) / <alpha-value>)",
          "on-dark": "rgb(var(--color-text-on-dark-rgb) / <alpha-value>)",
          "on-accent": "rgb(var(--color-text-on-accent-rgb) / <alpha-value>)",
        },
        status: {
          success: "rgb(var(--color-success-rgb) / <alpha-value>)",
          error: "rgb(var(--color-error-rgb) / <alpha-value>)",
          warning: "rgb(var(--color-warning-rgb) / <alpha-value>)",
        },
      },
      /* Wire the fluid type scale from docs/04-design-system.md section 3 so
         headings stop using arbitrary stepped sizes. */
      fontSize: {
        display: "var(--fontSize-display)",
        h2: "var(--fontSize-h2)",
        h3: "var(--fontSize-h3)",
        eyebrow: "var(--fontSize-eyebrow)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
      },
      maxWidth: {
        container: "var(--layout-container)",
      },
      spacing: {
        "section-y": "var(--layout-section-y)",
      },
    },
  },
  plugins: [],
};

export default config;
