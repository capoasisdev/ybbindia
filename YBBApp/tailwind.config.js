/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#132242",
          2: "#1F3363",
          soft: "#5A6786",
          dark: "#0E1730"
        },
        paper: {
          DEFAULT: "#F6F1E6",
          2: "#EEE6D3",
        },
        card: "#FFFDF8",
        brass: {
          DEFAULT: "#B4863A",
          2: "#8C6425",
          light: "#E7CE9C",
        },
        forest: {
          DEFAULT: "#1E4B3E",
          light: "#E4EEE8",
        },
        brick: {
          DEFAULT: "#9A4230",
          light: "#F3E1DB",
        },
        line: {
          DEFAULT: "#E1D8C2",
          ink: "rgba(255,255,255,0.14)",
        },
        muted: "#7A7160"
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Public Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        frame: "38px",
        screen: "28px",
      }
    },
  },
  plugins: [],
}
