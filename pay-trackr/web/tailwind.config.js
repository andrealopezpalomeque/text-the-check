/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      backgroundColor: {
        primary: "#4DA892",
        secondary: "#6158FF",
        danger: "#E84A8A",
        base: "#27292D",
        warning: "#E6AE2C",
        accent: "#0072DF",
        success: "#1D9A38",
        // Surface colors for 70-20-10 rule
        surface: {
          DEFAULT: "#32353b",      // Cards, elevated surfaces (20%)
          hover: "#3a3d44",        // Hover state
        },
        ['primary-transparent']: "rgba(77, 168, 146, 0.7)",
        ['secondary-transparent']: "rgba(97, 88, 255, 0.7)",
        ['danger-transparent']: "rgba(232, 74, 138, 0.7)",
        ['base-transparent']: "rgba(39, 41, 45, 0.7)",
        ['warning-transparent']: "rgba(230, 174, 44, 0.7)",
        ['accent-transparent']: "rgba(0, 114, 223, 0.7)",
        ['success-transparent']: "rgba(29, 154, 56, 0.7)",
      },
      colors: {
        primary: "#4DA892",
        secondary: "#6158FF",
        danger: "#E84A8A",
        base: "#27292D",
        warning: "#E6AE2C",
        accent: "#0072DF",
        success: "#1D9A38",
        // Surface colors available as text/border colors too
        surface: {
          DEFAULT: "#32353b",
          hover: "#3a3d44",
        },
      },
      borderColor: {
        surface: "#3f4249",
      },
      keyframes: {
        jump: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        jump: 'jump 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}