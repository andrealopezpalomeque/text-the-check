import type { Expense } from '~/types'

export type TabType = 'inicio' | 'grupo'
export type ExpenseModalMode = 'create' | 'edit'

export const useNavigationState = () => {
  const activeTab = useState<TabType>('nav-active-tab', () => 'inicio')
  const isExpenseModalOpen = useState<boolean>('expense-modal-open', () => false)
  const expenseModalMode = useState<ExpenseModalMode>('expense-modal-mode', () => 'create')
  const expenseToEdit = useState<Expense | null>('expense-to-edit', () => null)

  // URL sync initialized flag (per composable instance tracking)
  const urlSyncInitialized = useState<boolean>('nav-url-sync-initialized', () => false)

  const route = useRoute()
  const router = useRouter()

  // Initialize tab from URL query param (only once)
  if (import.meta.client && !urlSyncInitialized.value) {
    const tabFromUrl = route.query.tab
    if (tabFromUrl === 'grupo' || tabFromUrl === 'inicio') {
      activeTab.value = tabFromUrl
    }
    urlSyncInitialized.value = true
  }

  // Watch for URL changes (e.g., browser back/forward button)
  if (import.meta.client) {
    watch(() => route.query.tab, (newTab) => {
      // Only update if on dashboard and tab is valid
      if (route.path === '/') {
        if (newTab === 'grupo') {
          activeTab.value = 'grupo'
        } else if (newTab === 'inicio' || newTab === undefined) {
          activeTab.value = 'inicio'
        }
      }
    })
  }

  const switchTab = (tab: TabType) => {
    activeTab.value = tab

    // Update URL (only on client and when on dashboard)
    if (import.meta.client && route.path === '/') {
      const query = { ...route.query }

      if (tab === 'inicio') {
        // Remove tab param for default tab (clean URL)
        delete query.tab
      } else {
        query.tab = tab
      }

      router.replace({ query })
    }
  }

  const openExpenseModal = () => {
    expenseModalMode.value = 'create'
    expenseToEdit.value = null
    isExpenseModalOpen.value = true
  }

  const openEditExpenseModal = (expense: Expense) => {
    expenseModalMode.value = 'edit'
    expenseToEdit.value = expense
    isExpenseModalOpen.value = true
  }

  const closeExpenseModal = () => {
    isExpenseModalOpen.value = false
    expenseModalMode.value = 'create'
    expenseToEdit.value = null
  }

  return {
    activeTab: readonly(activeTab),
    isExpenseModalOpen: readonly(isExpenseModalOpen),
    expenseModalMode: readonly(expenseModalMode),
    expenseToEdit: readonly(expenseToEdit),
    switchTab,
    openExpenseModal,
    openEditExpenseModal,
    closeExpenseModal
  }
}
