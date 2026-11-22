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
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        canvas: "#F4F7FA",
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#EAF0F6",
          subtle: "#F8FAFC",
        },
        navy: {
          DEFAULT: "#0B1526",
          dark: "#070E1A",
          light: "#16233B",
        },
        text: {
          primary: "#0B1526",
          secondary: "#475569",
          tertiary: "#64748B",
          muted: "#94A3B8",
        },
        primary: {
          DEFAULT: "#0369A1",
          hover: "#075985",
          light: "#E0F2FE",
        },
        electric: {
          DEFAULT: "#0EA5E9",
        },
        emerald: {
          DEFAULT: "#059669",
          hover: "#047857",
          surface: "#ECFDF5",
          border: "#A7F3D0",
          text: "#065F46",
        },
        border: {
          metallic: "#DCE4EE",
          subtle: "#DCE4EE",
          strong: "#CBD5E1",
        },
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(11, 21, 38, 0.06), 0 1px 2px -1px rgba(11, 21, 38, 0.04)",
        card: "0 2px 4px 0 rgba(11, 21, 38, 0.05), 0 1px 2px 0 rgba(11, 21, 38, 0.03)",
        elevated: "0 4px 6px -1px rgba(11, 21, 38, 0.08), 0 2px 4px -2px rgba(11, 21, 38, 0.05)",
        modal: "0 20px 25px -5px rgba(11, 21, 38, 0.15), 0 8px 10px -6px rgba(11, 21, 38, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
