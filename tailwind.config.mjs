/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black:  '#0A0A0A',
          dark:   '#111111',
          card:   '#1A1A1A',
          blue:   '#3B82F6',
          'blue-dark': '#2563EB',
          purple: '#8B5CF6',
          white:  '#F8FAFC',
          muted:  '#94A3B8',
          border: '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-10px, 10px) scale(0.97)' },
        },
      },
      animation: {
        blob: 'blob 8s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
