/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Modern LyZov Store Palette
        primary: "#0B0B0C",
        surface: "#141416",
        raised:  "#1D1D20",
        card:    "#18181B",
        accent: {
          DEFAULT: "#FF5722",
          hover:   "#E64A19",
          light:   "#FF7043",
          muted:   "rgba(255,87,34,0.12)",
        },
        border:  "#26262B",
        "border-light": "#323238",
        // Backward compatibility
        ivory:   "#0B0B0C",
        ink:     "#FFFFFF",
        charcoal:"#0B0B0C",
        stone:   "#8E8E93",
        hairline:"#26262B",
        "hairline-dark": "#26262B",
        gold: {
          DEFAULT: "#FF5722",
          light:   "#FF7043",
          dark:    "#E64A19",
        },
        cream:   "#F2F2F7",
      },
      fontFamily: {
        display: ["'Inter'", "-apple-system", "sans-serif"],
        sans:    ["'Inter'", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        tightest:  "-0.04em",
        widest2:   "0.15em",
        hero:      "-0.03em",
      },
      boxShadow: {
        soft:   "0 2px 16px rgba(0,0,0,0.3)",
        card:   "0 4px 24px rgba(0,0,0,0.45)",
        lift:   "0 12px 36px rgba(0,0,0,0.6)",
        accent: "0 0 20px rgba(255,87,34,0.3)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      animation: {
        "fade-up":  "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in":  "fadeIn 0.3s ease both",
        marquee:    "marquee 26s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};