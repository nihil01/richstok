import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          100: "#fee2e2",
          200: "#fca5a5",
          300: "#f87171",
          400: "#ef4444",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#63171b",
        },
        pulse: {
          500: "#ef4444",
        },
        flame: {
          500: "#dc2626",
        },
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(circle at 15% 20%, rgba(220,38,38,0.18), transparent 35%), radial-gradient(circle at 85% 10%, rgba(185,28,28,0.16), transparent 32%), radial-gradient(circle at 78% 84%, rgba(239,68,68,0.12), transparent 36%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(220,38,38,0.22), 0 12px 30px rgba(220,38,38,0.3)",
        card: "0 20px 44px rgba(3, 8, 20, 0.35)",
      },
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
