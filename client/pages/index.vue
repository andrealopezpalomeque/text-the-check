<template>
  <div>
    <!-- Auth-check overlay: shown briefly while Firebase resolves, hides landing from logged-in users -->
    <Transition name="fade">
      <div
        v-if="isCheckingAuth"
        class="fixed inset-0 z-[60] bg-ttc-bg flex flex-col items-center justify-center gap-4"
      >
        <AppLogo variant="stacked" />
        <div class="flex items-center gap-2 text-ttc-text-muted text-sm font-body">
          <span class="w-4 h-4 border-2 border-ttc-primary/30 border-t-ttc-primary rounded-full animate-spin"></span>
          Verificando sesión...
        </div>
      </div>
    </Transition>

    <HeroPrueba />
    <LandingSocialProof />
    <LandingFeatures />
    <ComoFunciona />
    <LandingInputTypes />
    <LandingModes />
    <LandingComparison />
    <CtaPrueba />
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
    // Keep overlay visible during redirect — user never sees landing flash
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
