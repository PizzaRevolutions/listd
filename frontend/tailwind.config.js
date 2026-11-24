/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Archival graphite/carbon palette
        carbon: {
          50: '#F5F6F8',
          100: '#E6E8EC',
          200: '#CED2D9',
          300: '#A4ACB9',
          400: '#757F90',
          500: '#535C6D',
          600: '#3D4452',
          700: '#2C323D',
          800: '#1D2129',
          850: '#151820',
          900: '#0E1117',
          950: '#090B0F',
        },
        // Tungsten amber accent (warm, archival, cinema projection feel)
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
