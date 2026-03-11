<template>
  <header class="bg-ttc-card border-b border-ttc-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Top bar with app name and mode toggle -->
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-3">
          <AppLogo variant="horizontal" />
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
          to="/perfil"
          class="hidden md:flex items-center gap-2 text-ttc-text hover:text-ttc-text transition-colors"
        >
          <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName || 'User'"
            referrerpolicy="no-referrer"
            class="w-6 h-6 rounded-full ring-1 ring-ttc-border" />
          <div v-else class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center">
            <span class="text-white font-medium text-[9px]">{{ getUserInitials(user?.displayName) }}</span>
          </div>
          <span class="text-sm">{{ user?.displayName }}</span>
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
          to="/finanzas/pagos-unicos"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas/pagos-unicos' }"
        >
          <span class="flex items-center gap-2"><span class="hidden sm:inline">Pagos</span> Únicos</span>
        </NuxtLink>
        <NuxtLink
          to="/finanzas/resumen"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas/resumen' || route.path === '/finanzas/resumen-semanal' }"
        >
          Resumen
        </NuxtLink>
        <NuxtLink
          to="/finanzas/categorias"
          class="nav-tab"
          :class="{ 'nav-tab-active': route.path === '/finanzas/categorias' }"
        >
          Categorías
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import IconGroup from '~icons/mdi/account-group'

const route = useRoute()
const { setMode } = useAppMode()
const { user } = useAuth()

const switchToGrupos = () => {
  setMode('grupos')
  navigateTo('/grupos')
}

const getUserInitials = (displayName) => {
  if (!displayName) return 'U'
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] ?? 'U'}${parts[1]?.[0] ?? ''}`.toUpperCase()
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
