<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
  >
    <div class="flex items-center justify-around h-16">
      <!-- Inicio Tab -->
      <button
        @click="handleTabClick('inicio')"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isActive('inicio')
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconHome class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Inicio</span>
        <div
          v-if="isActive('inicio')"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </button>

      <!-- Grupo Tab -->
      <button
        @click="handleTabClick('grupo')"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isActive('grupo')
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconGroup class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Grupo</span>
        <div
          v-if="isActive('grupo')"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </button>

      <!-- Add Expense Button (Center, Elevated) -->
      <button
        @click="handleAddExpense"
        class="relative flex items-center justify-center -mt-4"
      >
        <div
          class="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <IconPlus class="w-7 h-7 text-white" />
        </div>
      </button>

      <!-- Perfil Tab -->
      <NuxtLink
        to="/profile"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isProfileActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconUser class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Perfil</span>
        <div
          v-if="isProfileActive"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import IconHome from '~icons/mdi/home'
import IconGroup from '~icons/mdi/account-group'
import IconPlus from '~icons/mdi/plus'
import IconUser from '~icons/mdi/account'

const route = useRoute()
const { activeTab, switchTab, openExpenseModal } = useNavigationState()

const isActive = (tab) => {
  // Only show tab as active when on dashboard
  if (route.path !== '/') return false
  return activeTab.value === tab
}

const isProfileActive = computed(() => route.path === '/profile')

const handleTabClick = (tab) => {
  // If already on dashboard, just switch tab
  if (route.path === '/') {
    switchTab(tab)
  } else {
    // Navigate to dashboard with tab in URL
    const query = tab === 'inicio' ? {} : { tab }
    navigateTo({ path: '/', query })
  }
}

const handleAddExpense = () => {
  // If not on dashboard, navigate first
  if (route.path !== '/') {
    navigateTo('/')
  }
  openExpenseModal()
}
</script>
