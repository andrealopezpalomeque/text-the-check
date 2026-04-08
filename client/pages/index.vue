<template>
  <div>
    <!-- Auth-check overlay -->
    <Transition name="fade">
      <div
        v-if="isCheckingAuth"
        class="fixed inset-0 z-[60] bg-ttc-bg flex flex-col items-center justify-center gap-4"
      >
        <AppLogo variant="stacked" />
        <div class="flex items-center gap-2 text-ttc-text-muted text-sm font-body">
          <span class="w-4 h-4 border-2 border-ttc-primary/30 border-t-ttc-primary rounded-full animate-spin" />
          Verificando sesión...
        </div>
      </div>
    </Transition>

    <!-- Sticky mobile WhatsApp CTA -->
    <LandingStickyWhatsApp />

    <!-- 1. Hero -->
    <LandingHero />

    <!-- 2. Social proof / pain point -->
    <LandingSocialProof />

    <!-- 3. How it works (timeline) -->
    <LandingHowItWorks />

    <!-- 4. Input types (horizontal scroll mobile) -->
    <LandingInputTypes />

    <!-- 5. Comparison (before/after) -->
    <LandingComparison />

    <!-- 6. Features + Balance -->
    <LandingFeaturesExpanded />

    <!-- 7. Final CTA (with beta badge) -->
    <LandingFinalCta />

    <!-- Bottom padding for sticky mobile CTA -->
    <div class="h-20 md:h-0" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'landing'
})

const { isAuthenticated, loading: authLoading } = useAuth()
const isCheckingAuth = ref(true)

const resolveAuth = () => {
  if (isAuthenticated.value) {
    navigateTo('/grupos', { replace: true })
  } else {
    isCheckingAuth.value = false
  }
}

onMounted(() => {
  if (!authLoading.value) {
    resolveAuth()
  }
})

watch(authLoading, (loading) => {
  if (!loading) {
    resolveAuth()
  }
})
</script>

<style scoped>
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-leave-to { opacity: 0; }
</style>
