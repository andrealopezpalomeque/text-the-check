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
          Inicia sesion para continuar
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-ttc-card border border-ttc-border rounded-xl p-8">
        <!-- Error -->
        <div
          v-if="errorMsg"
          class="mb-5 p-3 bg-ttc-danger/10 border border-ttc-danger/30 rounded-lg"
        >
          <p class="font-body text-sm text-ttc-danger">{{ errorMsg }}</p>
        </div>

        <!-- WhatsApp OTP: Step 1 — Phone input -->
        <div v-if="loginStep === 'phone'">
          <label class="block font-body text-sm font-medium text-ttc-text mb-2">
            Tu numero de WhatsApp
          </label>
          <div class="flex gap-2 mb-4">
            <input
              v-model="phoneInput"
              type="tel"
              placeholder="5491123456789"
              class="flex-1 px-4 py-3 bg-ttc-surface border border-ttc-border rounded-lg font-body text-sm text-ttc-text placeholder:text-ttc-text-dim focus:outline-none focus:border-ttc-primary transition-colors"
              @keyup.enter="requestOTP"
            />
          </div>
          <button
            @click="requestOTP"
            :disabled="isSubmitting || !phoneInput.trim()"
            class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-body text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div
              v-if="isSubmitting"
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>{{ isSubmitting ? 'Enviando...' : 'Iniciar con WhatsApp' }}</span>
          </button>
        </div>

        <!-- WhatsApp OTP: Step 2 — Code verification -->
        <div v-if="loginStep === 'code'">
          <p class="font-body text-sm text-ttc-text-muted mb-1">
            Enviamos un codigo a
          </p>
          <p class="font-body text-sm font-semibold text-ttc-text mb-4">
            {{ phoneInput }}
          </p>
          <label class="block font-body text-sm font-medium text-ttc-text mb-2">
            Codigo de 6 digitos
          </label>
          <input
            v-model="codeInput"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="w-full px-4 py-3 mb-4 bg-ttc-surface border border-ttc-border rounded-lg font-body text-lg text-center tracking-[0.3em] text-ttc-text placeholder:text-ttc-text-dim focus:outline-none focus:border-ttc-primary transition-colors"
            @keyup.enter="verifyOTP"
          />
          <button
            @click="verifyOTP"
            :disabled="isSubmitting || codeInput.length !== 6"
            class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-ttc-primary hover:bg-ttc-primary/90 text-white rounded-lg font-body text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div
              v-if="isSubmitting"
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <span>{{ isSubmitting ? 'Verificando...' : 'Verificar' }}</span>
          </button>
          <div class="mt-4 flex justify-between">
            <button
              @click="loginStep = 'phone'; codeInput = ''; errorMsg = null"
              class="font-body text-xs text-ttc-text-muted hover:text-ttc-primary transition-colors"
            >
              Cambiar numero
            </button>
            <button
              @click="requestOTP"
              :disabled="isSubmitting"
              class="font-body text-xs text-ttc-text-muted hover:text-ttc-primary transition-colors disabled:opacity-50"
            >
              Reenviar codigo
            </button>
          </div>
        </div>

        <!-- Google prompt: "Already have WhatsApp account?" -->
        <div v-if="loginStep === 'google-prompt'">
          <p class="font-body text-sm text-ttc-text mb-4">
            Ya tenes una cuenta creada por WhatsApp?
          </p>
          <div class="flex flex-col gap-3">
            <button
              @click="switchToOTP"
              class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-body text-sm font-semibold transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Si, iniciar con WhatsApp
            </button>
            <button
              @click="continueWithGoogle"
              class="w-full px-6 py-3 bg-ttc-surface border border-ttc-border rounded-lg font-body text-sm font-semibold text-ttc-text hover:border-ttc-text-dim transition-colors"
            >
              No, continuar con Google
            </button>
          </div>
        </div>

        <!-- Divider (only on phone/code steps) -->
        <div v-if="loginStep === 'phone' || loginStep === 'code'" class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-ttc-border" />
          <span class="font-body text-xs text-ttc-text-dim">o</span>
          <div class="flex-1 h-px bg-ttc-border" />
        </div>

        <!-- Google Sign In (secondary) -->
        <button
          v-if="loginStep === 'phone' || loginStep === 'code'"
          @click="handleGoogleSignIn"
          :disabled="isSubmitting"
          class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-ttc-surface border border-ttc-border rounded-lg font-body text-sm font-semibold text-ttc-text hover:border-ttc-text-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="!isSubmitting"
            class="w-5 h-5"
            viewBox="0 0 24 24"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <p class="mt-5 text-center font-body text-xs text-ttc-text-dim">
          Al iniciar sesion, aceptas los terminos de uso
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

const config = useRuntimeConfig()
const { signInWithGoogle, signInWithOTP, signOut, error, isAuthenticated, loading, firestoreUser, user } = useAuth()

const loginStep = ref('phone')  // 'phone' | 'code' | 'google-prompt'
const phoneInput = ref('')
const codeInput = ref('')
const isSubmitting = ref(false)
const errorMsg = ref(null)

// Pending Google auth data for the prompt flow
const pendingGoogleUser = ref(null)

const apiBase = config.public.apiBaseUrl

const requestOTP = async () => {
  isSubmitting.value = true
  errorMsg.value = null
  try {
    const res = await $fetch(`${apiBase}/auth/otp/request`, {
      method: 'POST',
      body: { phone: phoneInput.value.trim() },
    })
    loginStep.value = 'code'
    codeInput.value = ''
  } catch (err) {
    errorMsg.value = err?.data?.error || err?.message || 'Error al enviar el codigo'
  } finally {
    isSubmitting.value = false
  }
}

const verifyOTP = async () => {
  isSubmitting.value = true
  errorMsg.value = null
  try {
    const res = await $fetch(`${apiBase}/auth/otp/verify`, {
      method: 'POST',
      body: { phone: phoneInput.value.trim(), code: codeInput.value.trim() },
    })
    await signInWithOTP(res.token)
    navigateTo('/grupos', { replace: true })
  } catch (err) {
    errorMsg.value = err?.data?.error || err?.message || 'Error al verificar el codigo'
  } finally {
    isSubmitting.value = false
  }
}

const handleGoogleSignIn = async () => {
  isSubmitting.value = true
  errorMsg.value = null
  try {
    const result = await signInWithGoogle()

    // Check if this is a freshly auto-created user (no email match found, UID-based doc)
    // If the firestore user ID matches the firebase UID, it was just auto-created
    // AND the user has no phone (not a WhatsApp user), proceed normally
    // But if the user doc was just created (id === firebase uid) and has no prior data,
    // show the WhatsApp account prompt
    if (result.firestoreUser.id === result.firebaseUser.uid && !result.firestoreUser.phone) {
      // Newly created Google account — ask if they have a WhatsApp account
      pendingGoogleUser.value = result
      loginStep.value = 'google-prompt'
      isSubmitting.value = false
      return
    }

    navigateTo('/grupos', { replace: true })
  } catch {
    // error is set by useAuth
    errorMsg.value = error.value
  } finally {
    isSubmitting.value = false
  }
}

const switchToOTP = async () => {
  // Sign out of Google, switch to WhatsApp OTP flow
  await signOut()
  pendingGoogleUser.value = null
  loginStep.value = 'phone'
  errorMsg.value = null
}

const continueWithGoogle = () => {
  // Proceed with the Google account as-is
  pendingGoogleUser.value = null
  navigateTo('/grupos', { replace: true })
}

// Redirect if already authenticated
watch(isAuthenticated, (authenticated) => {
  if (authenticated && loginStep.value !== 'google-prompt') {
    navigateTo('/grupos', { replace: true })
  }
})

onMounted(() => {
  if (!loading.value && isAuthenticated.value) {
    navigateTo('/grupos', { replace: true })
  }
})
</script>
