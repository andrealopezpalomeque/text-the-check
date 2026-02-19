/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Landing page CSS variable-based colors
        'ttc-bg': 'var(--color-bg)',
        'ttc-surface': 'var(--color-surface)',
        'ttc-card': 'var(--color-card)',
        'ttc-border': 'var(--color-border)',
        'ttc-primary': 'var(--color-primary)',
        'ttc-primary-light': 'var(--color-primary-light)',
        'ttc-secondary': 'var(--color-secondary)',
        'ttc-accent': 'var(--color-accent)',
        'ttc-text': 'var(--color-text)',
        'ttc-text-muted': 'var(--color-text-muted)',
        'ttc-text-dim': 'var(--color-text-dim)',
        'ttc-danger': 'var(--color-danger)',
        'ttc-bubble-user-primary': 'var(--color-bubble-user-primary)',
        'ttc-bubble-user-accent': 'var(--color-bubble-user-accent)',
        'ttc-bubble-bot': 'var(--color-bubble-bot)',
        'ttc-toggle-primary': 'var(--color-toggle-primary)',
        'ttc-toggle-accent': 'var(--color-toggle-accent)',
        // Surface alias used by finanzas components
        'base': 'var(--color-surface)',
        // App colors (used by grupos & finanzas components with dark: variant)
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
          DEFAULT: '#3b82f6',
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
        },
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
        'body': ['DM Sans', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
        'sans': ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        'mono': ['Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'btn': '8px',
        'card': '12px',
        'modal': '16px',
        'tag': '6px',
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
      },
    },
  },
  plugins: [],
}
