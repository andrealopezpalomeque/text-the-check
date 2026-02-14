/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
        'body': ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'btn': '8px',
        'card': '12px',
        'modal': '16px',
        'tag': '6px',
      },
    },
  },
  plugins: [],
}
