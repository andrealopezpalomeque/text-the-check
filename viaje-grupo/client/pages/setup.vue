<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Title -->
      <div class="text-center mb-8">
        <h1 class="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Text The Check
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Configurá tu grupo para empezar
        </p>
      </div>

      <ClientOnly>
        <template #fallback>
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Create a group -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 class="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Crear un grupo
            </h2>
            <form @submit.prevent="handleCreate" class="space-y-4">
              <input
                v-model="groupName"
                type="text"
                placeholder="Nombre del grupo"
                required
                maxlength="100"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                :disabled="!groupName.trim() || loading"
                class="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {{ loading && mode === 'create' ? 'Creando...' : 'Crear grupo' }}
              </button>
            </form>
          </div>

          <!-- Divider -->
          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span class="text-sm text-gray-500 dark:text-gray-400">o</span>
            <div class="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          <!-- Join a group -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 class="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Unirse a un grupo
            </h2>
            <form @submit.prevent="handleJoin" class="space-y-4">
              <input
                v-model="joinInput"
                type="text"
                placeholder="Link de invitación o ID del grupo"
                required
                class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                :disabled="!joinInput.trim() || loading"
                class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {{ loading && mode === 'join' ? 'Uniéndose...' : 'Unirse' }}
              </button>
            </form>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
          </div>

          <!-- Logout -->
          <div class="text-center">
            <button
              @click="handleLogout"
              class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
  ssr: false
})

const { firestoreUser, signOut } = useAuth()
const groupStore = useGroupStore()
const router = useRouter()

const groupName = ref('')
const joinInput = ref('')
const loading = ref(false)
const error = ref(null)
const mode = ref(null)

const parseGroupId = (input) => {
  const trimmed = input.trim()
  // Try to extract group ID from a URL like /join?group=GROUP_ID
  try {
    const url = new URL(trimmed)
    const groupParam = url.searchParams.get('group')
    if (groupParam) return groupParam
  } catch {
    // Not a URL — treat as raw group ID
  }
  // Also handle partial paths like "join?group=ID"
  const match = trimmed.match(/[?&]group=([^&]+)/)
  if (match) return match[1]
  return trimmed
}

const handleCreate = async () => {
  if (!firestoreUser.value || !groupName.value.trim()) return
  loading.value = true
  error.value = null
  mode.value = 'create'
  try {
    await groupStore.createGroup(groupName.value.trim(), firestoreUser.value.id)
    navigateTo('/', { replace: true })
  } catch (err) {
    error.value = err.message || 'Error al crear el grupo'
  } finally {
    loading.value = false
  }
}

const handleJoin = async () => {
  if (!firestoreUser.value || !joinInput.value.trim()) return
  loading.value = true
  error.value = null
  mode.value = 'join'
  try {
    const groupId = parseGroupId(joinInput.value)
    await groupStore.joinGroup(groupId, firestoreUser.value.id)
    navigateTo('/', { replace: true })
  } catch (err) {
    error.value = err.message || 'Error al unirse al grupo'
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (err) {
    console.error('Sign out failed:', err)
  }
}
</script>
