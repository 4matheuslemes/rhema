import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
        },
        accent: "var(--accent)",
        success: "var(--success)",
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs:   ["0.75rem",   { lineHeight: "1rem" }],
        sm:   ["0.875rem",  { lineHeight: "1.25rem" }],
        base: ["1rem",      { lineHeight: "1.5rem" }],
        lg:   ["1.25rem",   { lineHeight: "1.75rem" }],
        xl:   ["1.75rem",   { lineHeight: "2.25rem" }],
        "2xl":["2.25rem",   { lineHeight: "2.75rem" }],
      },
      borderRadius: {
        sm:      "6px",
        DEFAULT: "10px",
        md:      "12px",
        lg:      "16px",
        xl:      "24px",
        full:    "9999px",
      },
      boxShadow: {
        card:       "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover":"0 4px 12px 0 rgba(0,0,0,0.08)",
        modal:      "0 20px 60px rgba(0,0,0,0.15)",
      },
      animation: {
        "fade-in":  "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s cubic-bezier(0.32,0.72,0,1)",
        "scale-in": "scale-in 0.15s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
