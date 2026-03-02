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
        'ttc-success': 'var(--color-success)',
        'ttc-warning': 'var(--color-warning)',
        'ttc-input': 'var(--color-input)',
        'ttc-card-hover': 'var(--color-card-hover)',
        'ttc-bubble-user-primary': 'var(--color-bubble-user-primary)',
        'ttc-bubble-user-accent': 'var(--color-bubble-user-accent)',
        'ttc-bubble-bot': 'var(--color-bubble-bot)',
        'ttc-toggle-primary': 'var(--color-toggle-primary)',
        'ttc-toggle-accent': 'var(--color-toggle-accent)',
        // Semantic app colors (mapped to CSS variables for theme switching)
        positive: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
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
        // primary now routes through the CSS variable so it follows the theme
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
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
