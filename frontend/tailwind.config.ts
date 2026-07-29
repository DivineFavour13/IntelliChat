import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12141C",       // background
        paper: "#EDEAE3",     // primary text
        muted: "#8B8D98",     // secondary text
        signal: "#E8A33D",    // single accent — assistant / active states
        panel: "#1B1E29",     // message bubble / card background
        userBubble: "#2A2E3D",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
