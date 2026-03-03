<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Text The Check
        </h1>
      </div>

      <ClientOnly>
        <template #fallback>
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        </template>

        <!-- Loading state -->
        <div v-if="pageLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Cargando grupo...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
          <NuxtLink
            to="/grupos"
            class="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Ir a mis grupos
          </NuxtLink>
        </div>

        <!-- Join card -->
        <div v-else-if="groupData" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div class="text-center mb-6">
            <h2 class="font-display text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Unirse a grupo
            </h2>
            <p class="text-lg text-gray-700 dark:text-gray-300">
              {{ groupData.name }}
            </p>
          </div>

          <!-- Ghost member claim step -->
          <div v-if="ghostMembers.length > 0 && !selectedGhostId">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
              Sos alguno de estos miembros?
            </p>
            <div class="space-y-2 mb-4">
              <button
                v-for="ghost in ghostMembers"
                :key="ghost.id"
                @click="selectedGhostId = ghost.id"
                class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3"
              >
                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center flex-shrink-0">
                  <span class="text-xs font-medium text-gray-400">{{ getInitials(ghost.name) }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ ghost.name }}</span>
              </button>
            </div>
            <button
              @click="handleJoin"
              :disabled="joining"
              class="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-colors"
            >
              {{ joining ? 'Uniéndose...' : 'No, soy nuevo' }}
            </button>
          </div>

          <!-- Confirm claim (selected a ghost) -->
          <div v-else-if="selectedGhostId" class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tu cuenta se vinculará con <strong class="text-gray-900 dark:text-white">{{ selectedGhostName }}</strong> y heredará todos sus gastos y deudas.
            </p>
            <div class="space-y-2">
              <button
                @click="handleClaim"
                :disabled="joining"
                class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {{ joining ? 'Vinculando...' : `Soy ${selectedGhostName}` }}
              </button>
              <button
                @click="selectedGhostId = null"
                :disabled="joining"
                class="w-full px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Volver
              </button>
            </div>
          </div>

          <!-- Default join (no ghosts or skipped) -->
          <div v-else class="text-center">
            <button
              @click="handleJoin"
              :disabled="joining"
              class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {{ joining ? 'Uniéndose...' : `Unirse a ${groupData.name}` }}
            </button>
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import { doc, getDoc } from 'firebase/firestore'

definePageMeta({
  middleware: ['auth'],
  ssr: false
})

const route = useRoute()
const { firestoreUser } = useAuth()
const groupStore = useGroupStore()
const { db } = useFirebase()

const groupData = ref(null)
const pageLoading = ref(true)
const joining = ref(false)
const error = ref(null)
const selectedGhostId = ref(null)

const groupId = computed(() => route.query.group)

const ghostMembers = computed(() => {
  return groupData.value?.ghostMembers || []
})

const selectedGhostName = computed(() => {
  const ghost = ghostMembers.value.find(g => g.id === selectedGhostId.value)
  return ghost?.name || ''
})

const getInitials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}

const loadGroup = async () => {
  if (!groupId.value) {
    error.value = 'No se especificó un grupo'
    pageLoading.value = false
    return
  }

  try {
    const groupRef = doc(db, 'ttc_group', groupId.value)
    const groupSnap = await getDoc(groupRef)

    if (!groupSnap.exists()) {
      error.value = 'Grupo no encontrado'
      pageLoading.value = false
      return
    }

    const data = groupSnap.data()

    // If already a member, enter the group directly
    if (firestoreUser.value && data.members?.includes(firestoreUser.value.id)) {
      groupStore.currentUserId = firestoreUser.value.id
      await groupStore.fetchGroupsForUser(firestoreUser.value.id)
      await groupStore.enterGroup(groupId.value)
      navigateTo('/grupos', { replace: true })
      return
    }

    groupData.value = { id: groupSnap.id, ...data }
  } catch (err) {
    error.value = 'Error al cargar el grupo'
    console.error(err)
  } finally {
    pageLoading.value = false
  }
}

const handleJoin = async () => {
  if (!firestoreUser.value || !groupId.value) return
  joining.value = true
  error.value = null

  try {
    await groupStore.joinGroup(groupId.value, firestoreUser.value.id)
    groupStore.showGroupList = false
    navigateTo('/grupos', { replace: true })
  } catch (err) {
    error.value = err.message || 'Error al unirse al grupo'
  } finally {
    joining.value = false
  }
}

const handleClaim = async () => {
  if (!firestoreUser.value || !groupId.value || !selectedGhostId.value) return
  joining.value = true
  error.value = null

  try {
    await groupStore.claimGhostMember(groupId.value, selectedGhostId.value, firestoreUser.value.id)
    groupStore.showGroupList = false
    navigateTo('/grupos', { replace: true })
  } catch (err) {
    error.value = err.message || 'Error al vincular cuenta'
  } finally {
    joining.value = false
  }
}

// Wait for firestoreUser to be available then load
watch(
  () => firestoreUser.value,
  (user) => {
    if (user) loadGroup()
  },
  { immediate: true }
)
</script>
