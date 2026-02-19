<template>
  <div>
    <NuxtLayout>
      <div v-show="!authLoading">
        <NuxtPage />
      </div>
    </NuxtLayout>

    <!-- Global loading overlay while auth initializes - ClientOnly to prevent SSR hydration issues -->
    <ClientOnly>
      <div
        v-if="authLoading"
        class="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
      >
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
const { isAuthenticated, firestoreUser, loading: authLoading } = useAuth()
const route = useRoute()
const expenseStore = useExpenseStore()
const paymentStore = usePaymentStore()
const userStore = useUserStore()
const groupStore = useGroupStore()
const { mode } = useAppMode()

// Initialize grupos data when authenticated
const initializeData = async () => {
  if (!firestoreUser.value) return

  // Fetch groups for the current user, passing activeGroupId for priority selection
  await groupStore.fetchGroupsForUser(firestoreUser.value.id, firestoreUser.value.activeGroupId)

  // If user has no groups, redirect to setup page
  if (groupStore.groups.length === 0) {
    navigateTo('/setup', { replace: true })
    return
  }

  // Initialize data for the selected group
  const groupId = groupStore.selectedGroupId
  const members = groupStore.selectedGroupMembers

  if (groupId) {
    expenseStore.initializeListeners(groupId)
    paymentStore.initializeListeners(groupId)
    userStore.fetchUsers(members)
  }
}

// SECURITY: Watch for auth loading to complete and enforce access control
// This catches cases where the middleware allowed access during loading
watch(authLoading, (loading) => {
  // Only run on client side
  if (import.meta.server) return

  if (!loading) {
    // Auth has finished loading - enforce access control
    const currentPath = route.path

    const publicPaths = ['/login', '/setup', '/join']
    if (!isAuthenticated.value && !publicPaths.includes(currentPath)) {
      // User is not authenticated and on a protected route - redirect to login
      window.location.href = '/login'
    }
  }
})

// Watch for auth changes
watch(isAuthenticated, async (authenticated) => {
  if (authenticated) {
    await initializeData()
  } else {
    // Stop listeners and clear state when not authenticated
    expenseStore.stopListeners()
    paymentStore.stopListeners()
    groupStore.clearGroups()

    // Only redirect on client side, and only if not on login page
    if (import.meta.client && route.path !== '/login') {
      window.location.href = '/login'
    }
  }
}, { immediate: true })

// Watch for group changes and reinitialize data
watch(() => groupStore.selectedGroupId, (newGroupId, oldGroupId) => {
  if (newGroupId && newGroupId !== oldGroupId && isAuthenticated.value) {
    const members = groupStore.selectedGroupMembers
    expenseStore.initializeListeners(newGroupId)
    paymentStore.initializeListeners(newGroupId)
    userStore.fetchUsers(members)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  expenseStore.stopListeners()
  paymentStore.stopListeners()
})
</script>
