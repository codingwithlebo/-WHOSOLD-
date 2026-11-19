/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'on-surface-muted': '#8a695a',
      },
    },
  },
  plugins: [],
}
