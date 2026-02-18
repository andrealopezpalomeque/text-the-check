<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
    <div class="container mx-auto px-4 py-6 max-w-2xl">
      <!-- Header -->
      <header class="mb-6">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:inline-flex"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </NuxtLink>
          <h1 class="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h1>
        </div>
      </header>

      <!-- Wrap in ClientOnly to prevent SSR hydration issues -->
      <ClientOnly>
        <template #fallback>
          <!-- SSR fallback - show loading state -->
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando perfil...</p>
          </div>
        </template>

        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando perfil...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="!firestoreUser" class="text-center py-12">
          <div class="text-red-500 dark:text-red-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">Error al cargar el perfil</p>
        </div>

        <!-- Profile Content -->
        <div v-else>
        <!-- User Info Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Información personal
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <!-- Avatar and Name -->
            <div class="flex items-center gap-4">
              <div
                v-if="user?.photoURL"
                class="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700"
              >
                <img :src="user.photoURL" :alt="firestoreUser.name" class="w-full h-full object-cover" />
              </div>
              <div
                v-else
                class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
              >
                <span class="text-white font-bold text-xl">
                  {{ getUserInitials(firestoreUser.name) }}
                </span>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ firestoreUser.name }}
                </h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                  {{ groupStore.selectedGroup?.name || 'Cargando grupo...' }}
                </p>
              </div>
            </div>

            <!-- Info Fields -->
            <div class="grid grid-cols-1 gap-4 pt-4">
              <div>
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                <p class="text-gray-900 dark:text-white">{{ firestoreUser.email || 'No configurado' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Teléfono</label>
                <p class="text-gray-900 dark:text-white font-mono">{{ firestoreUser.phone }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Alias (para @menciones)</label>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span
                    v-for="alias in firestoreUser.aliases"
                    :key="alias"
                    class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm rounded-full"
                  >
                    @{{ alias }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 class="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Información de pago
            </h2>
            <button
              v-if="!isEditing"
              @click="startEditing"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              Editar
            </button>
          </div>

          <div class="p-6">
            <!-- View Mode -->
            <div v-if="!isEditing" class="space-y-4">
              <div v-if="hasPaymentInfo">
                <div v-if="paymentForm.accountNumber" class="mb-4">
                  <label class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {{ paymentForm.accountType === 'cbu' ? 'CBU' : 'CVU' }}
                  </label>
                  <p class="text-gray-900 dark:text-white font-mono text-sm">{{ paymentForm.accountNumber }}</p>
                </div>
                <div v-if="paymentForm.alias" class="mb-4">
                  <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Alias</label>
                  <p class="text-gray-900 dark:text-white">{{ paymentForm.alias }}</p>
                </div>
                <div v-if="paymentForm.bankName">
                  <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Banco/Plataforma</label>
                  <p class="text-gray-900 dark:text-white">{{ paymentForm.bankName }}</p>
                </div>
              </div>
              <div v-else class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400 mb-4">
                  No hay información de pago configurada.
                </p>
                <button
                  @click="startEditing"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Agregar información de pago
                </button>
              </div>
            </div>

            <!-- Edit Mode -->
            <form v-else @submit.prevent="savePaymentInfo" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tipo de cuenta
                </label>
                <div class="flex gap-4 mb-3">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="paymentForm.accountType"
                      type="radio"
                      value="cbu"
                      class="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span class="text-gray-700 dark:text-gray-300">CBU</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="paymentForm.accountType"
                      type="radio"
                      value="cvu"
                      class="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span class="text-gray-700 dark:text-gray-300">CVU</span>
                  </label>
                </div>
                <input
                  v-model="paymentForm.accountNumber"
                  type="text"
                  maxlength="22"
                  pattern="\d{22}"
                  placeholder="0000000000000000000000 (22 dígitos)"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alias
                </label>
                <input
                  v-model="paymentForm.alias"
                  type="text"
                  maxlength="50"
                  placeholder="mi.alias.banco"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Banco/Plataforma
                </label>
                <input
                  v-model="paymentForm.bankName"
                  type="text"
                  maxlength="50"
                  placeholder="Mercado Pago, Binance, Personal Pay, etc."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- Error -->
              <div v-if="saveError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-200">{{ saveError }}</p>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  @click="cancelEditing"
                  class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                >
                  <span v-if="saving">Guardando...</span>
                  <span v-else>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Logout Section -->
        <div class="mt-6">
          <LogoutButton />
        </div>
        </div>
      </ClientOnly>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
  ssr: false  // Disable SSR - Firebase auth only works on client
})

const { user, firestoreUser, loading } = useAuth()
const userStore = useUserStore()
const groupStore = useGroupStore()

const isEditing = ref(false)
const saving = ref(false)
const saveError = ref(null)

// Computed property to properly handle loading state
// Only show loading while auth is initializing AND we don't have user data yet
const isLoading = computed(() => loading.value && !firestoreUser.value)

const paymentForm = reactive({
  accountType: 'cbu', // 'cbu' or 'cvu'
  accountNumber: '',
  alias: '',
  bankName: ''
})

// Initialize form from user data
const initForm = () => {
  const info = firestoreUser.value?.paymentInfo
  if (info?.cbu) {
    paymentForm.accountType = 'cbu'
    paymentForm.accountNumber = info.cbu
  } else if (info?.cvu) {
    paymentForm.accountType = 'cvu'
    paymentForm.accountNumber = info.cvu
  } else {
    paymentForm.accountType = 'cbu'
    paymentForm.accountNumber = ''
  }
  paymentForm.alias = info?.alias || ''
  paymentForm.bankName = info?.bankName || ''
}

// Watch for user changes
watch(firestoreUser, () => {
  initForm()
}, { immediate: true })

const hasPaymentInfo = computed(() => {
  return paymentForm.accountNumber || paymentForm.alias || paymentForm.bankName
})

const getUserInitials = (name) => {
  if (!name) return '??'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const startEditing = () => {
  isEditing.value = true
  saveError.value = null
}

const cancelEditing = () => {
  isEditing.value = false
  saveError.value = null
  initForm() // Reset to original values
}

const savePaymentInfo = async () => {
  if (!firestoreUser.value) return

  // Validate account number if provided
  if (paymentForm.accountNumber && !/^\d{22}$/.test(paymentForm.accountNumber)) {
    const accountTypeLabel = paymentForm.accountType === 'cbu' ? 'CBU' : 'CVU'
    saveError.value = `El ${accountTypeLabel} debe tener exactamente 22 dígitos`
    return
  }

  saving.value = true
  saveError.value = null

  try {
    await userStore.updateUserPaymentInfo(firestoreUser.value.id, {
      cbu: paymentForm.accountType === 'cbu' ? (paymentForm.accountNumber || null) : null,
      cvu: paymentForm.accountType === 'cvu' ? (paymentForm.accountNumber || null) : null,
      alias: paymentForm.alias || null,
      mercadoPago: null, // Keep for backwards compatibility but always null
      bankName: paymentForm.bankName || null
    })
    isEditing.value = false
  } catch (error) {
    console.error('Error saving payment info:', error)
    saveError.value = 'Error al guardar. Intenta nuevamente.'
  } finally {
    saving.value = false
  }
}
</script>
