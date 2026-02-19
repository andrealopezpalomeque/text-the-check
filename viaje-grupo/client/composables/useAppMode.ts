export type AppMode = 'grupos' | 'finanzas'

export const useAppMode = () => {
  const mode = useState<AppMode>('app-mode', () => 'grupos')

  // Initialize from localStorage on client
  if (import.meta.client) {
    const stored = localStorage.getItem('app-mode')
    if (stored === 'grupos' || stored === 'finanzas') {
      mode.value = stored
    }
  }

  const setMode = (newMode: AppMode) => {
    mode.value = newMode
    if (import.meta.client) {
      localStorage.setItem('app-mode', newMode)
    }
  }

  const toggleMode = () => {
    const newMode = mode.value === 'grupos' ? 'finanzas' : 'grupos'
    setMode(newMode)
    return newMode
  }

  return {
    mode: readonly(mode),
    setMode,
    toggleMode
  }
}
