import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1AABEC",
          dark: "#1590C9",
          light: "#E3F6FD",
          soft: "#C8EBFA",
        },
        taiga: {
          DEFAULT: "#22B558",
          dark: "#1A9447",
          light: "#E5F8EC",
          soft: "#C8EFD6",
        },
        pay: "#22B558",
        page: "#F2F7F5",
        surface: "#FFFFFF",
        ink: "#1A1A1A",
        muted: "#4B5563",
        line: "#E5E7EB",
      },
      boxShadow: {
        card: "0 2px 16px rgba(26, 26, 26, 0.06)",
        soft: "0 2px 12px rgba(26, 170, 236, 0.12)",
        green: "0 2px 12px rgba(34, 181, 88, 0.12)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1AABEC 0%, #22B558 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #E3F6FD 0%, #E5F8EC 100%)",
        "hero-mesh":
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(26, 170, 236, 0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(34, 181, 88, 0.14) 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #f2f7f5 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "fade-up": "fadeUp 0.45s ease-out forwards",
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        float: "float 4s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
