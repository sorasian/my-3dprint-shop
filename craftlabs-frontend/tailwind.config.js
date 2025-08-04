// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#121212',
        'bg-secondary': '#1a1a1a',
        'bg-tertiary': '#252525',
        'bg-card': 'rgba(30, 30, 30, 0.7)',
        'bg-glass': 'rgba(255, 130, 0, 0.15)',
        'neon-primary': '#ff8200',
        'neon-primary-glow': 'rgba(255, 130, 0, 0.7)',
        'neon-secondary': '#144b85',
        'neon-accent': '#00ffcc',
        'text-primary': 'rgba(255, 255, 255, 0.87)',
        'text-secondary': 'rgba(255, 255, 255, 0.6)',
        'text-tertiary': 'rgba(255, 255, 255, 0.4)',
        'border-light': 'rgba(255, 255, 255, 0.1)',
        'border-glass': 'rgba(255, 255, 255, 0.2)',
        'border-neon': '#ff8200',
      },
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 15px rgba(255, 130, 0, 0.7)',
        'neon-lg': '0 0 25px rgba(255, 130, 0, 0.7)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        zoomIn: { '0%': { opacity: 0, transform: 'scale(0.95)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        zoomIn: 'zoomIn 0.3s ease-out',
      }
    },
  },
  plugins: [],
};