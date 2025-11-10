import { type Config } from 'tailwindcss'
export default {
  content: ['./**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbff', 100: '#e6f4ff', 200: '#cce9ff', 300: '#99d3ff', 400: '#66bdff', 500: '#1e90ff', 600: '#0077e6', 700: '#005bb4', 800: '#004080', 900: '#00284d'
        },
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
} satisfies Config