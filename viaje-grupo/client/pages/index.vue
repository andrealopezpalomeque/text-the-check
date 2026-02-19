<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">Cargando...</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
  ssr: false
})

const { mode } = useAppMode()

onMounted(() => {
  navigateTo(mode.value === 'finanzas' ? '/finanzas' : '/grupos', { replace: true })
})
</script>
