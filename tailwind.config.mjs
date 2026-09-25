/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black:       '#020202',
          dark:        '#070707',
          card:        '#0D0D0D',
          blue:        '#F5F5F7',
          'blue-dark': '#C8C8CC',
          purple:      '#888899',
          white:       '#F5F5F7',
          muted:       '#5C5C6A',
          border:      '#1C1C24',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
