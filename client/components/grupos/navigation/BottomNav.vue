<template>
  <nav
    v-if="!groupStore.showGroupList"
    class="fixed bottom-0 left-0 right-0 z-50 bg-ttc-card border-t border-ttc-border md:hidden"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
  >
    <div class="flex items-center justify-around h-16">
      <!-- Inicio Tab -->
      <button
        @click="handleTabClick('inicio')"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isActive('inicio')
            ? 'text-ttc-primary'
            : 'text-ttc-text-muted hover:text-ttc-text'
        ]"
      >
        <IconHome class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Inicio</span>
        <div
          v-if="isActive('inicio')"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-ttc-primary rounded-full"
        />
      </button>

      <!-- Grupo Tab -->
      <button
        @click="handleTabClick('grupo')"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isActive('grupo')
            ? 'text-ttc-primary'
            : 'text-ttc-text-muted hover:text-ttc-text'
        ]"
      >
        <IconGroup class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Grupo</span>
        <div
          v-if="isActive('grupo')"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-ttc-primary rounded-full"
        />
      </button>

      <!-- Add Expense Button (Center, Elevated) -->
      <button
        @click="handleAddExpense"
        class="relative flex items-center justify-center -mt-4"
      >
        <div
          class="w-14 h-14 bg-ttc-primary hover:bg-ttc-primary/90 active:bg-ttc-primary/80 rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <IconPlus class="w-7 h-7 text-white" />
        </div>
      </button>

      <!-- Perfil Tab -->
      <NuxtLink
        to="/perfil"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isProfileActive
            ? 'text-ttc-primary'
            : 'text-ttc-text-muted hover:text-ttc-text'
        ]"
      >
        <IconUser class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Perfil</span>
        <div
          v-if="isProfileActive"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-ttc-primary rounded-full"
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
const groupStore = useGroupStore()
const { activeTab, switchTab, openExpenseModal } = useNavigationState()

const isActive = (tab) => {
  // Only show tab as active when on grupos dashboard
  if (route.path !== '/grupos') return false
  return activeTab.value === tab
}

const isProfileActive = computed(() => route.path === '/perfil')

const handleTabClick = (tab) => {
  // If already on dashboard, just switch tab
  if (route.path === '/grupos') {
    switchTab(tab)
  } else {
    // Navigate to dashboard with tab in URL
    const query = tab === 'inicio' ? {} : { tab }
    navigateTo({ path: '/grupos', query })
  }
}

const handleAddExpense = () => {
  // If not on dashboard, navigate first
  if (route.path !== '/grupos') {
    navigateTo('/grupos')
  }
  openExpenseModal()
}
</script>
