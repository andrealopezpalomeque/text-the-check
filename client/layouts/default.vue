<template>
  <div class="min-h-screen bg-ttc-bg">
    <AppHeader />
    <main class="pt-14">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>
