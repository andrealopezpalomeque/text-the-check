<template>
  <header class="bg-ttc-card border-b border-ttc-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Top bar with app name and mode toggle -->
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <TtcSymbol size-class="w-5 h-5" class="text-ttc-primary" />
            <h1 class="font-display text-lg font-bold text-ttc-text">
              Text The Check
            </h1>
          </div>
          <!-- Mode Toggle -->
          <button
            @click="switchToGrupos"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ttc-text-muted hover:text-ttc-primary hover:bg-ttc-primary/10 rounded-md transition-colors"
          >
            <IconGroup class="w-3.5 h-3.5" />
            <span>Grupos</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Theme Toggle -->
          <ThemeToggle />

          <!-- Profile link -->
          <NuxtLink
          to="/profile"
          class="flex items-center gap-2 text-ttc-text hover:text-ttc-text transition-colors"
        >
          <IconUser class="w-5 h-5" />
          <span class="text-sm hidden sm:inline">Perfil</span>
        </NuxtLink>
        </div>
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
  @apply text-ttc-text border-ttc-border;
}

.nav-tab-active {
  @apply text-ttc-primary border-ttc-primary font-semibold;
}
</style>
