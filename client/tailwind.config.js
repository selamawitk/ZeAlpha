/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDFCFB',
          DEFAULT: '#C5A059',
          dark: '#1A1A1A',
        },
        ivory: '#FDFCFB',
        dark: '#1A1A1A',
        gold: '#C5A059',
        secondary: '#5F6368',
        accent: '#E8D5B5',
      },
      animation: {
        // Custom "Surge" pulse for gifts > 90%
        'surge-pulse': 'surge 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        surge: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: .8, transform: 'scale(1.02)' },
        }
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(197, 160, 89, 0.2)',
      }
    },
  },
  plugins: [],
}