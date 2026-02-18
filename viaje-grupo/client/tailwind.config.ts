import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'sans-serif'],  // For app name & headings
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],  // For body text (default)
        mono: ['Monaco', 'Courier New', 'monospace']  // For numbers (keep existing)
      },
      colors: {
        // Color coding as per requirements
        positive: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        negative: {
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
        }
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
      margin: {
        'safe': 'env(safe-area-inset-bottom, 0px)',
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-bottom, 0px))',
      }
    },
  },
  plugins: [],
} satisfies Config
