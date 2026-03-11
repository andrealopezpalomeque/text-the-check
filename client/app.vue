<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global loading overlay while auth initializes (protected routes only) -->
    <ClientOnly>
      <Transition name="fade">
        <div
          v-if="authLoading && !isPublicRoute"
          class="fixed inset-0 z-50 bg-ttc-bg flex flex-col items-center justify-center gap-4"
        >
          <AppLogo variant="stacked" />
          <div class="flex items-center gap-2 text-ttc-text-muted text-sm font-body">
            <span class="w-4 h-4 border-2 border-ttc-primary/30 border-t-ttc-primary rounded-full animate-spin"></span>
            Verificando sesión...
          </div>
        </div>
      </Transition>
    </ClientOnly>
  </div>
</template>

<script setup>
const { isAuthenticated, firestoreUser, loading: authLoading } = useAuth()
const route = useRoute()

const publicRoutes = ['/', '/iniciar-sesion', '/configurar', '/unirse', '/privacy', '/faq', '/landing-prueba']
const isPublicRoute = computed(() => publicRoutes.includes(route.path))
const expenseStore = useExpenseStore()
const paymentStore = usePaymentStore()
const userStore = useUserStore()
const groupStore = useGroupStore()
const { mode } = useAppMode()
const { initTheme } = useTheme()

// Finanzas stores
const finCategoryStore = useFinanzasCategoryStore()
const finRecurrentStore = useFinanzasRecurrentStore()
const finPaymentStore = useFinanzasPaymentStore()
const finTemplateStore = useFinanzasTemplateStore()
const finWeeklySummaryStore = useFinanzasWeeklySummaryStore()

onMounted(() => {
  initTheme()
})

// Initialize grupos data when authenticated
const initializeData = async () => {
  if (!firestoreUser.value) return

  await groupStore.fetchGroupsForUser(firestoreUser.value.id, firestoreUser.value.activeGroupId)

  // Always show group list after login — empty state is handled in GroupList
  groupStore.showGroupList = true

  const groupId = groupStore.selectedGroupId
  const members = groupStore.selectedGroupMembers

  if (groupId) {
    await Promise.all([
      expenseStore.initializeListeners(groupId),
      paymentStore.initializeListeners(groupId),
      userStore.fetchUsers(members, groupStore.selectedGroup?.ghostMembers)
    ])
  }
}

// Initialize finanzas data when authenticated
const initializeFinanzasData = async () => {
  if (!firestoreUser.value) return

  await Promise.all([
    finCategoryStore.fetchCategories(),
    finRecurrentStore.fetchRecurrentPayments(),
    finRecurrentStore.fetchPaymentInstances(6, false, true),
    finWeeklySummaryStore.fetchSummary()
  ])
  finRecurrentStore.processData(6)
}

// Watch for auth loading to complete and enforce access control
watch(authLoading, (loading) => {
  if (import.meta.server) return

  if (!loading) {
    const currentPath = route.path

    const publicPaths = ['/iniciar-sesion', '/configurar', '/unirse', '/', '/privacy']
    if (!isAuthenticated.value && !publicPaths.includes(currentPath)) {
      navigateTo('/iniciar-sesion', { replace: true })
    }
  }
})

// Watch for auth changes
watch(isAuthenticated, async (authenticated) => {
  if (authenticated) {
    await Promise.all([initializeData(), initializeFinanzasData()])
  } else {
    // Grupos cleanup
    expenseStore.stopListeners()
    paymentStore.stopListeners()
    groupStore.clearGroups()

    // Finanzas cleanup
    finCategoryStore.clearState()
    finRecurrentStore.clearState()
    finPaymentStore.clearState()
    finTemplateStore.clearState()
    finWeeklySummaryStore.clearState()

    if (import.meta.client && route.path !== '/iniciar-sesion' && route.path !== '/') {
      navigateTo('/iniciar-sesion', { replace: true })
    }
  }
}, { immediate: true })

// Watch for group changes and reinitialize data
watch(() => groupStore.selectedGroupId, async (newGroupId, oldGroupId) => {
  if (newGroupId && newGroupId !== oldGroupId && isAuthenticated.value) {
    const members = groupStore.selectedGroupMembers
    await Promise.all([
      expenseStore.initializeListeners(newGroupId),
      paymentStore.initializeListeners(newGroupId),
      userStore.fetchUsers(members, groupStore.selectedGroup?.ghostMembers)
    ])
  }
})

// Re-fetch users when ghost members change (added/removed/claimed via real-time sync)
watch(() => groupStore.selectedGroupGhostMembers, (newGhosts, oldGhosts) => {
  if (!isAuthenticated.value || !groupStore.selectedGroupId) return
  // Only re-fetch if the ghost list actually changed
  const newIds = newGhosts.map(g => g.id).join(',')
  const oldIds = (oldGhosts || []).map(g => g.id).join(',')
  if (newIds !== oldIds) {
    userStore.fetchUsers(groupStore.selectedGroupMembers, newGhosts)
  }
}, { deep: true })

// Cleanup on unmount
onUnmounted(() => {
  expenseStore.stopListeners()
  paymentStore.stopListeners()
})
</script>

<style scoped>
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-leave-to { opacity: 0; }
</style>
