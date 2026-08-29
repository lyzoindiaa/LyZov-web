/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Clean Premium Light Store Palette
        primary: "#FFFFFF",
        surface: "#F9FAFB",
        raised:  "#F3F4F6",
        card:    "#FFFFFF",
        ink: {
          DEFAULT: "#111827",
          light:   "#374151",
          muted:   "#6B7280",
          subtle:  "#9CA3AF",
        },
        accent: {
          DEFAULT: "#D97706", // Amber Gold / Luxury Warm Accent
          hover:   "#B45309",
          light:   "#FEF3C7",
          dark:    "#92400E",
        },
        brand: {
          DEFAULT: "#111827", // Dark Navy-Black for primary CTAs
          hover:   "#1F2937",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light:   "#F3F4F6",
          dark:    "#D1D5DB",
        },
        // Fallbacks
        ivory:   "#FFFFFF",
        charcoal:"#111827",
        stone:   "#6B7280",
        hairline:"#E5E7EB",
        "hairline-dark": "#E5E7EB",
        gold: {
          DEFAULT: "#D97706",
          light:   "#FEF3C7",
          dark:    "#92400E",
        },
        cream:   "#F9FAFB",
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        display: ["'Inter'", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft:   "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card:   "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        lift:   "0 10px 30px -4px rgba(0, 0, 0, 0.08)",
        nav:    "0 1px 12px 0 rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        xl2: "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};