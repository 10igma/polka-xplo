import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../extensions/*/ui/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Dynamic accent colour driven by CSS variable (set in layout.tsx) */
        accent: "var(--color-accent)",
        polkadot: {
          pink: "#E6007A",
          purple: "#6D3AEE",
          cyan: "#00B2FF",
          green: "#56F39A",
          lime: "#D3FF33",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
