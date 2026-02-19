<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo/Title Card -->
      <div class="text-center mb-8">
        <h1 class="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Text The Check
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Seguimiento colaborativo de gastos
        </p>
      </div>

      <!-- Wrap in ClientOnly to prevent SSR/hydration issues -->
      <ClientOnly>
        <!-- SSR fallback - always show loading during SSR -->
        <template #fallback>
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        </template>

        <!-- Show loading state while auth is initializing OR if authenticated (redirecting) -->
        <div v-if="showLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">
            {{ isAuthenticated ? 'Redirigiendo...' : 'Cargando...' }}
          </p>
        </div>

        <!-- Login Card - Only show if auth is loaded AND user is NOT authenticated -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div class="text-center mb-6">
            <h2 class="font-display text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Iniciar Sesión
            </h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Inicia sesión para ver los gastos del grupo
            </p>
          </div>

          <!-- Error Message -->
          <div
            v-if="authError"
            class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p class="text-sm text-red-800 dark:text-red-200">
              {{ authError }}
            </p>
          </div>

          <!-- Google Sign In Button -->
          <button
            @click="handleGoogleSignIn"
            :disabled="isSigningIn"
            class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg
              v-if="!isSigningIn"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>

            <div
              v-if="isSigningIn"
              class="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 border-t-gray-600 dark:border-t-gray-200 rounded-full animate-spin"
            ></div>

            <span>
              {{ isSigningIn ? 'Iniciando sesión...' : 'Continuar con Google' }}
            </span>
          </button>

          <!-- Info Text -->
          <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Al iniciar sesión, aceptas compartir tus gastos con el grupo de viaje
          </p>
        </div>
      </ClientOnly>

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Text The Check
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
  ssr: false  // Disable SSR - auth check only works on client
})

const { signInWithGoogle, error: authError, isAuthenticated, loading: authLoading } = useAuth()

// Track if we're actively signing in
const isSigningIn = ref(false)

// Computed to determine if we should show loading
// Show loading if: auth is still loading OR user is authenticated (and we're about to redirect)
const showLoading = computed(() => authLoading.value || isAuthenticated.value)

const handleGoogleSignIn = async () => {
  isSigningIn.value = true
  try {
    await signInWithGoogle()
    navigateTo('/grupos', { replace: true })
  } catch (error) {
    // Error is already set in useAuth
  } finally {
    isSigningIn.value = false
  }
}

// Watch for auth state changes - redirect authenticated users
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    navigateTo('/grupos', { replace: true })
  }
})

// Also check on mount for immediate redirect
onMounted(() => {
  if (!authLoading.value && isAuthenticated.value) {
    navigateTo('/grupos', { replace: true })
  }
})
</script>
