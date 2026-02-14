export const useTheme = () => {
  const theme = useState('theme', () => 'dark')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem('ttc-theme', theme.value)
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('ttc-theme')
      if (saved) {
        theme.value = saved
      }
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  }

  return { theme, toggleTheme, initTheme }
}
