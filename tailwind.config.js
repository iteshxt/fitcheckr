/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        blob: 'blob 7s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'merge-left': 'merge-left 1.5s ease-in-out',
        'merge-right': 'merge-right 1.5s ease-in-out',
        'fade-in': 'fade-in 0.8s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'scale-in': 'scale-in 0.5s ease-out',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        'merge-left': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateX(100px) scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'translateX(200px) scale(0.6)', opacity: '0' },
        },
        'merge-right': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateX(-100px) scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'translateX(-200px) scale(0.6)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
