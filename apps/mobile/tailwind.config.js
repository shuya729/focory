/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        app: {
          background: "rgb(var(--color-background) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
          "surface-subtle": "rgb(var(--color-surface-subtle) / <alpha-value>)",
          accent: "rgb(var(--color-accent) / <alpha-value>)",
          "accent-strong": "rgb(var(--color-accent-strong) / <alpha-value>)",
          "accent-muted": "rgb(var(--color-accent-muted) / <alpha-value>)",
          "accent-soft": "rgb(var(--color-accent-soft) / <alpha-value>)",
          "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
          "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
          "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
          icon: "rgb(var(--color-icon) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
          "border-subtle": "rgb(var(--color-border-subtle) / <alpha-value>)",
          "neutral-soft": "rgb(var(--color-neutral-soft) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
