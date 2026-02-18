<template>
  <div class="w-full min-h-full">
    <TheHeader />

    <!-- Main navigation tabs (only for authenticated users) -->
    <div v-if="user" class="w-full bg-base border-b border-gray-700 mb-4">
      <div class="max-w-7xl m-auto px-0 sm:px-6">
        <nav class="flex overflow-x-auto" aria-label="Navegación principal">
          <NuxtLink to="/fijos" class="nav-tab" :class="{ 'nav-tab-active': route.path === '/fijos' }">
            <span class="flex items-center gap-2"><span class="hidden sm:inline">Gastos</span> Fijos</span>
          </NuxtLink>
          <NuxtLink to="/one-time" class="nav-tab" :class="{ 'nav-tab-active': route.path === '/one-time' }">
            <span class="flex items-center gap-2"><span class="hidden sm:inline">Pagos</span> Únicos</span>
          </NuxtLink>
          <NuxtLink to="/summary" class="nav-tab" :class="{ 'nav-tab-active': route.path === '/summary' }">
            Resumen Financiero
          </NuxtLink>
          <NuxtLink to="/weekly-summary" class="nav-tab" :class="{ 'nav-tab-active': route.path === '/weekly-summary' }">
            Resumen Semanal
          </NuxtLink>
          <NuxtLink to="/settings/categories" class="nav-tab" :class="{ 'nav-tab-active': route.path.startsWith('/settings') }">
            Configuración
          </NuxtLink>
        </nav>
      </div>
    </div>
    <div class="flex flex-col gap-12 max-w-7xl m-auto px-0 sm:px-6">
      <main>
        <slot @totals="updateTotals" />
      </main>
    </div>
    <TheFooter />
  </div>
</template>

<script setup>
import { getCurrentUserAsync } from '~/utils/firebase';

const user = import.meta.server ? null : await getCurrentUserAsync();
const route = useRoute();
// ----- Define Pinia Vars -----------
// ----- Define Computed ---------
</script>

<style scoped>
.selected {
  background-color: var(--secondary-color);
  color: white;
  font-weight: 600;
}

.nav-tab {
  @apply py-4 px-4 text-gray-300 border-b-2 border-transparent font-medium text-sm whitespace-nowrap;
  transition: color 0.2s, border-color 0.2s;
}

.nav-tab:hover {
  @apply text-white border-gray-500;
}

.nav-tab-active {
  @apply text-primary border-primary font-semibold;
}

/* Ensure tabs stack properly on very small screens */
@media (max-width: 380px) {
  nav {
    @apply flex-wrap justify-center;
  }
  
  .nav-tab {
    @apply text-center;
  }
}
</style>
