import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#080B10",
        panel: "#101620",
        panel2: "#141C29",
        gold: "#D7B46A",
        sand: "#F2DFAE",
        muted: "#9CA8BA"
      },
      boxShadow: {
        glow: "0 24px 90px rgba(215,180,106,.18)",
      },
    },
  },
  plugins: [],
};
export default config;
