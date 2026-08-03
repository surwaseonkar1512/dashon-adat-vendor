/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2e7d32', // Agricultural Green
        secondary: '#ffb300', // Amber/Harvest Gold
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        neutral: '#9e9e9e'
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
