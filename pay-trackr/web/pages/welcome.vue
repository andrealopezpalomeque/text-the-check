<template>
  <div class="welcome-page">
    <div class="flex flex-col items-center justify-center gap-10 min-h-[90vh] max-w-md m-auto px-6">
      <!-- Logo & Branding -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <div class="absolute -inset-3 bg-primary/10 rounded-full blur-xl" aria-hidden="true"></div>
          <img class="relative w-24 h-24" src="/img/new-logo.png" alt="PayTrackr logo" width="96" height="96">
        </div>
        <div class="flex flex-col items-center gap-1 text-center">
          <h1 class="welcome-title">PayTrackr</h1>
          <p class="text-gray-400 text-base leading-relaxed">
            Gestión de pagos simple e inteligente
          </p>
        </div>
      </div>

      <!-- Features preview -->
      <div class="flex items-center justify-center gap-6 text-sm text-gray-400">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-primary"></span>
          Pagos
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-secondary"></span>
          Resúmenes
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-success"></span>
          WhatsApp
        </div>
      </div>

      <!-- Login card -->
      <div class="w-full flex flex-col items-center gap-5 bg-surface border border-surface rounded-2xl p-8">
        <p class="text-gray-300 text-sm text-center">
          Iniciá sesión para acceder a tu cuenta
        </p>
        <button class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl py-3 px-4 transition-colors" @click="googleSignIn">
          <FlatColorIconsGoogle class="text-xl" />
          <span>Continuar con Google</span>
        </button>
        <p v-if="error" class="text-danger text-sm text-center">
          Ocurrió un error al iniciar sesión. Por favor intentá de nuevo.
        </p>
        <p class="text-xs text-gray-500 text-center leading-relaxed">
          Al iniciar sesión aceptás los
          <NuxtLink to="/term-of-service" target="_blank" class="text-gray-400 hover:text-white underline underline-offset-2 transition-colors">términos de servicio</NuxtLink>
        </p>
      </div>

      <!-- Back to home -->
      <NuxtLink to="/?showLanding=true" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Volver al inicio
      </NuxtLink>
    </div>
    <TheFooter />
  </div>
</template>

<script setup>
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from 'firebase/auth'
import { getAuthInstance } from '~/utils/firebase'
import FlatColorIconsGoogle from '~icons/flat-color-icons/google';

definePageMeta({
  layout: false
})

const route = useRoute()
const error = ref(false)
const redirectTo = route.query?.redirect || '/'

// Handle redirect result when returning from Google sign-in
onMounted(async () => {
  try {
    const auth = getAuthInstance()
    const result = await getRedirectResult(auth)
    if (result) {
      navigateTo(redirectTo)
    }
  } catch (reason) {
    console.error('Failed redirect result', reason)
    error.value = reason
  }
})

function googleSignIn() {
  const auth = getAuthInstance()
  const googleAuthProvider = new GoogleAuthProvider()
  // Try popup first, fall back to redirect (handles third-party cookie blocks)
  signInWithPopup(auth, googleAuthProvider)
    .then(() => {
      navigateTo(redirectTo)
    })
    .catch((reason) => {
      if (reason.code === 'auth/popup-blocked' ||
          reason.code === 'auth/popup-closed-by-user' ||
          reason.code === 'auth/cancelled-popup-request') {
        console.warn('Popup failed, falling back to redirect', reason.code)
        return signInWithRedirect(auth, googleAuthProvider)
      }
      // For cookie/cross-origin issues, also fall back to redirect
      if (reason.code === 'auth/internal-error' ||
          reason.message?.includes('blocked')) {
        console.warn('Popup blocked by browser, using redirect', reason.code)
        return signInWithRedirect(auth, googleAuthProvider)
      }
      console.error('Failed signIn', reason)
      error.value = reason
    })
}

useSeo({
  title: 'Bienvenido a PayTrackr',
  description: 'Iniciá sesión en PayTrackr para gestionar tus pagos, recibir resúmenes semanales con IA y registrar gastos por WhatsApp.',
  path: '/welcome',
})
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background-color: #27292D;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 800;
  text-align: center;
}
</style>
