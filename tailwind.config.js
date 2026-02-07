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
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#312e81',
        },
        // Dark theme colors matching Weavy.ai
        dark: {
          bg: '#0d0d0d',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#3a3a3a',
          text: '#e5e5e5',
          'text-muted': '#a3a3a3',
        }
      },
    },
  },
  plugins: [],
}