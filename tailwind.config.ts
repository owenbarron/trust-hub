import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#008a94",
        "primary-dark": "#006c74",
        "primary-light": "#e0f2f3",
        "background-light": "#f5f8f8",
        "surface-light": "#ffffff",
        "border-light": "#dae6e7",
        "text-main": "#101818",
        "text-muted": "#5e8a8d",
        "slate-custom": "#4C4C4E",
      },
      fontFamily: {
        display: ["Public Sans", "sans-serif"],
        sans: ["Public Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
