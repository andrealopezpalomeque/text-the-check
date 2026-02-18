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
            to="/setup"
            class="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Ir a configuración
          </NuxtLink>
        </div>

        <!-- Join card -->
        <div v-else-if="groupData" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h2 class="font-display text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Unirse a grupo
          </h2>
          <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {{ groupData.name }}
          </p>
          <button
            @click="handleJoin"
            :disabled="joining"
            class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {{ joining ? 'Uniéndose...' : `Unirse a ${groupData.name}` }}
          </button>
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

const groupId = computed(() => route.query.group)

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

    // If already a member, redirect to home
    if (firestoreUser.value && data.members?.includes(firestoreUser.value.id)) {
      // Make sure group is selected and data is loaded
      groupStore.currentUserId = firestoreUser.value.id
      await groupStore.fetchGroupsForUser(firestoreUser.value.id)
      await groupStore.selectGroup(groupId.value)
      navigateTo('/', { replace: true })
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
    navigateTo('/', { replace: true })
  } catch (err) {
    error.value = err.message || 'Error al unirse al grupo'
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
