import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f1e8",
        ink: "#1d1408",
        accent: "#d96226",
        accentDark: "#8f3413",
        herb: "#5f7c42",
        sand: "#e8dcc7",
      },
      boxShadow: {
        card: "0 18px 40px rgba(29, 20, 8, 0.12)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(29,20,8,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
