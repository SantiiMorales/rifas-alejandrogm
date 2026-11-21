import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "#05070A",
          card: "#12161F",
          elevated: "#1E2430",
        },
        neon: {
          green: "#1EE868",
          cyan: "#00D4FF",
          blue: "#0077E6",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#C4CBD4",
          muted: "#6E7785",
        },
        border: {
          metallic: "rgba(196, 203, 212, 0.18)",
        },
      },
      boxShadow: {
        "glow-green": "0 0 18px rgba(30, 232, 104, 0.35)",
        "glow-cyan": "0 0 18px rgba(0, 212, 255, 0.35)",
        "glow-blue": "0 0 18px rgba(0, 119, 230, 0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #0077E6 0%, #00D4FF 50%, #1EE868 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
