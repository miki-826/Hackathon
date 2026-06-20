import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ai: "#11203a",
        sumi: "#0c0f17",
        washi: "#efe2c4",
        kin: "#c8a24a",
        shu: "#b5462f",
      },
      fontFamily: {
        brush: ['"Yuji Syuku"', "serif"],
        mincho: ['"Shippori Mincho"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
