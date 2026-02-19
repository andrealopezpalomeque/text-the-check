<template>
  <div class="min-h-screen bg-ttc-bg flex items-center justify-center px-4">
    <div class="max-w-sm w-full">
      <!-- Logo -->
      <div class="text-center mb-10">
        <TtcSymbol size-class="w-12 h-12 mx-auto mb-4" />
        <h1 class="font-nunito font-extrabold text-2xl text-ttc-text">
          Text <span class="text-ttc-primary">The</span> Check
        </h1>
        <p class="mt-2 font-body text-sm text-ttc-text-muted">
          Iniciá sesión para continuar
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-ttc-card border border-ttc-border rounded-xl p-8">
        <!-- Error -->
        <div
          v-if="error"
          class="mb-5 p-3 bg-ttc-danger/10 border border-ttc-danger/30 rounded-lg"
        >
          <p class="font-body text-sm text-ttc-danger">{{ error }}</p>
        </div>

        <!-- Google Sign In -->
        <button
          @click="handleSignIn"
          :disabled="isSigningIn"
          class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-ttc-surface border border-ttc-border rounded-lg font-body text-sm font-semibold text-ttc-text hover:border-ttc-text-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="!isSigningIn"
            class="w-5 h-5"
            viewBox="0 0 24 24"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>

          <div
            v-if="isSigningIn"
            class="w-5 h-5 border-2 border-ttc-border border-t-ttc-primary rounded-full animate-spin"
          />

          <span>{{ isSigningIn ? 'Iniciando sesión...' : 'Continuar con Google' }}</span>
        </button>

        <p class="mt-5 text-center font-body text-xs text-ttc-text-dim">
          Al iniciar sesión, aceptás los términos de uso
        </p>
      </div>

      <!-- Back to landing -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/"
          class="font-body text-sm text-ttc-text-muted hover:text-ttc-primary transition-colors"
        >
          &larr; Volver al inicio
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
  ssr: false
})

const { signInWithGoogle, error, isAuthenticated, loading } = useAuth()
const isSigningIn = ref(false)

const handleSignIn = async () => {
  isSigningIn.value = true
  try {
    await signInWithGoogle()
    navigateTo('/grupos', { replace: true })
  } catch {
    // error is set by useAuth
  } finally {
    isSigningIn.value = false
  }
}

// Redirect if already authenticated
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    navigateTo('/grupos', { replace: true })
  }
})

onMounted(() => {
  if (!loading.value && isAuthenticated.value) {
    navigateTo('/grupos', { replace: true })
  }
})
</script>
