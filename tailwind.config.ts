import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "var(--color-ink-950)",
        },
        brand: {
          700: "var(--color-brand-700)",
          500: "var(--color-brand-500)",
        },
        accent: {
          400: "var(--color-accent-400)",
          300: "var(--color-accent-300)",
        },
        tint: {
          100: "var(--color-tint-100)",
          50: "var(--color-tint-50)",
        },
        surface: "var(--color-surface)",
        line: "var(--color-line)",
        text: {
          900: "var(--color-text-900)",
          600: "var(--color-text-600)",
          "on-dark": "var(--color-text-on-dark)",
          "on-accent": "var(--color-text-on-accent)",
        },
        status: {
          success: "var(--color-success)",
          error: "var(--color-error)",
          warning: "var(--color-warning)",
        },
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
