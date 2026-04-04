import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "logo-spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "logo-spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "logo-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "logo-sweep": {
          "0%": {
            transform: "translateX(-18%) scaleX(0.92)",
            opacity: "0.55",
          },
          "50%": {
            transform: "translateX(18%) scaleX(1.06)",
            opacity: "1",
          },
          "100%": {
            transform: "translateX(-18%) scaleX(0.92)",
            opacity: "0.55",
          },
        },
      },
      animation: {
        "logo-spin-slow": "logo-spin-slow 12s linear infinite",
        "logo-spin-reverse": "logo-spin-reverse 8s linear infinite",
        "logo-pulse": "logo-pulse 2s ease-in-out infinite",
        "logo-sweep": "logo-sweep 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;