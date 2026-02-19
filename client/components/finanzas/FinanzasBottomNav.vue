<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
  >
    <div class="flex items-center justify-around h-16">
      <!-- Fijos Tab -->
      <NuxtLink
        to="/finanzas"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          route.path === '/finanzas'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconCalendarCheck class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Fijos</span>
        <div
          v-if="route.path === '/finanzas'"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </NuxtLink>

      <!-- Únicos Tab -->
      <NuxtLink
        to="/finanzas/one-time"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          route.path === '/finanzas/one-time'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconReceiptText class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Únicos</span>
        <div
          v-if="route.path === '/finanzas/one-time'"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </NuxtLink>

      <!-- Center FAB Button -->
      <button
        @click="handleAdd"
        class="relative flex items-center justify-center -mt-4"
      >
        <div
          class="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <IconPlus class="w-7 h-7 text-white" />
        </div>
      </button>

      <!-- Resumen Tab -->
      <NuxtLink
        to="/finanzas/summary"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          isSummaryActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconChartBar class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Resumen</span>
        <div
          v-if="isSummaryActive"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </NuxtLink>

      <!-- Categorías Tab -->
      <NuxtLink
        to="/finanzas/categories"
        :class="[
          'relative flex flex-col items-center justify-center w-16 h-full transition-colors',
          route.path === '/finanzas/categories'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <IconTagMultiple class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">Categorías</span>
        <div
          v-if="route.path === '/finanzas/categories'"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import IconCalendarCheck from '~icons/mdi/calendar-check'
import IconReceiptText from '~icons/mdi/receipt-text'
import IconChartBar from '~icons/mdi/chart-bar'
import IconTagMultiple from '~icons/mdi/tag-multiple'
import IconPlus from '~icons/mdi/plus'

const route = useRoute()
const { openNewPaymentModal } = useFinanzasNavigationState()

const isSummaryActive = computed(() =>
  route.path === '/finanzas/summary' || route.path === '/finanzas/weekly-summary'
)

function handleAdd() {
  if (route.path === '/finanzas') {
    openNewPaymentModal('recurrent')
  } else if (route.path === '/finanzas/one-time') {
    openNewPaymentModal('one-time')
  } else {
    // Navigate to one-time page and open modal
    navigateTo('/finanzas/one-time')
    nextTick(() => {
      openNewPaymentModal('one-time')
    })
  }
}
</script>
