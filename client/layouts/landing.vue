<template>
  <div class="min-h-screen bg-ttc-bg">
    <LandingHeader />
    <main class="pt-14">
      <slot />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup>
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>
