/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wy: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // Primary Theme Color (Indigo)
          600: '#4f46e5',
          900: '#312e81',
        }
      },
    },
  },
  plugins: [],
}