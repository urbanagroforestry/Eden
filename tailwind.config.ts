import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moss: "#355E3B",
        clay: "#8C6A4B",
        sage: "#DDE6D5",
        bark: "#2F3A2D"
      }
    }
  },
  plugins: []
};

export default config;
