/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'wheeldle-dark': '#121623',
        'wheeldle-card': '#1e2130',
        'wheeldle-hover': '#2a2f40',
      }
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['disabled'],
      textColor: ['disabled']
    },
  },
  plugins: [],
} 