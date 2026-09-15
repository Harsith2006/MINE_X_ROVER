/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0e1626",
        panel2: "#111c31",
        edge: "#1e2a44",
        ink: "#dbe4f3",
        dim: "#8b98b3",
      },
    },
  },
  plugins: [],
}

