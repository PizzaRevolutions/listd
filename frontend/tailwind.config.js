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
        // Pure black OLED canvas and dark charcoal elevations
        ld: {
          bg: '#000000',
          surface: '#121316',
          'surface-hover': '#1A1B20',
          pill: '#16171B',
          'pill-hover': '#22242A',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          muted: '#9CA3AF',
          faint: '#525866',
        },
        // Carbon palette for retro-compatibility
        carbon: {
          50: '#F5F6F8',
          100: '#E6E8EC',
          200: '#CED2D9',
          300: '#A4ACB9',
          400: '#757F90',
          500: '#535C6D',
          600: '#3D4452',
          700: '#2C323D',
          800: '#16171B',
          850: '#121316',
          900: '#0C0D10',
          950: '#000000',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.375rem', // 22px
        '4xl': '1.75rem',  // 28px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
