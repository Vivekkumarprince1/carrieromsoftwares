/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-black': '#121212',
        'secondary-black': '#1a1a1a',
        'primary-yellow': '#ffc107',
        'secondary-yellow': '#ffa000',
        'text-light': '#f9f9f9',
        'dark-gray': '#2a2a2a',
        'card-bg': '#1e1e1e',
        'lime-brand': '#a3c614',
        'lime-brand-light': '#bde02e',
        'lime-brand-dark': '#8aab0a',
      },
      backgroundColor: {
        'dark': '#121212',
        'card': '#1a1a1a',
        'input': '#2d2d2d',
      },
      textColor: {
        'primary': '#ffffff',
        'secondary': '#cccccc',
        'accent': '#ffd700',
      },
      borderColor: {
        'primary': '#2d2d2d',
        'accent': '#ffd700',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'glow-lime': '0 0 15px 5px rgba(163, 198, 20, 0.3)',
        'glow-yellow': '0 0 15px 5px rgba(250, 204, 21, 0.3)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [],
}
