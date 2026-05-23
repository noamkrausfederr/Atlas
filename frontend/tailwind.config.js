/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
        glow: '0 30px 70px rgba(192, 132, 252, 0.18)',
        card: '0 6px 20px rgba(0, 0, 0, 0.08)'
      },
      colors: {
        brand: {
          50: '#f9f5ff',
          100: '#f4ebff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          500: '#c084fc',
          700: '#8b5cf6'
        }
      }
    }
  },
  plugins: []
};
