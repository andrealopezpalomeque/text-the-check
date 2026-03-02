<template>
  <header class="bg-ttc-card border-b border-ttc-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Top bar with app name and mode toggle -->
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-3">
          <h1 class="font-display text-lg font-bold text-ttc-text">
            Text The Check
          </h1>
          <!-- Mode Toggle -->
          <button
            @click="switchToGrupos"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ttc-text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <IconGroup class="w-3.5 h-3.5" />
            <span>Grupos</span>
          </button>
        </div>

        <!-- Profile link -->
        <NuxtLink
          to="/profile"
          class="flex items-center gap-2 text-ttc-text hover:text-ttc-text transition-colors"
        >
          <IconUser class="w-5 h-5" />
          <span class="text-sm hidden sm:inline">Perfil</span>
        </NuxtLink>
      </div>

      <!-- Navigation Tabs -->
      <nav class="hidden md:flex overflow-x-auto -mb-px" aria-label="Navegación finanzas">
        <NuxtLink
          to="/finanzas"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas' }"
        >
          <span class="flex items-center gap-2"><span class="hidden sm:inline">Gastos</span> Fijos</span>
        </NuxtLink>
        <NuxtLink
          to="/finanzas/one-time"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas/one-time' }"
        >
          <span class="flex items-center gap-2"><span class="hidden sm:inline">Pagos</span> Unicos</span>
        </NuxtLink>
        <NuxtLink
          to="/finanzas/summary"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas/summary' || route.path === '/finanzas/weekly-summary' }"
        >
          Resumen
        </NuxtLink>
        <NuxtLink
          to="/finanzas/categories"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas/categories' }"
        >
          Categorias
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import IconGroup from '~icons/mdi/account-group'
import IconUser from '~icons/mdi/account'

const route = useRoute()
const { setMode } = useAppMode()

const switchToGrupos = () => {
  setMode('grupos')
  navigateTo('/grupos')
}
</script>

<style scoped>
.nav-tab {
  @apply py-3 px-4 text-ttc-text-muted border-b-2 border-transparent font-medium text-sm whitespace-nowrap;
  transition: color 0.2s, border-color 0.2s;
}

.nav-tab:hover {
  @apply text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600;
}

.nav-tab-active {
  @apply text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-semibold;
}
</style>
