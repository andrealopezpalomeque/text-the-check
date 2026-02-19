export const useTheme = () => {
  const theme = useState('theme', () => 'dark')

  const applyTheme = (value) => {
    document.documentElement.setAttribute('data-theme', value)
    // Sync Tailwind dark mode class for app components (grupos/finanzas)
    if (value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
    localStorage.setItem('ttc-theme', theme.value)
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('ttc-theme')
      if (saved) {
        theme.value = saved
      }
      applyTheme(theme.value)
    }
  }

  return { theme, toggleTheme, initTheme }
}
