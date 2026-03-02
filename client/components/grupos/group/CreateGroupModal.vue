<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="handleClose"
        />

        <!-- Modal (bottom sheet on mobile, centered on desktop) -->
        <div class="fixed inset-0 flex items-end md:items-center justify-center">
          <Transition name="slide-up">
            <div
              v-if="isOpen"
              class="relative bg-white dark:bg-gray-800 w-full md:max-w-md md:rounded-xl rounded-t-2xl shadow-xl"
              :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
            >
              <!-- Handle bar (mobile only) -->
              <div class="flex justify-center pt-3 pb-2 md:hidden">
                <div class="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                  <button
                    v-if="step === 2"
                    @click="step = 1"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
                    <IconArrowLeft class="w-5 h-5" />
                  </button>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ step === 1 ? 'Crear grupo' : 'Agregar miembros' }}
                  </h3>
                </div>
                <button
                  @click="handleClose"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <IconClose class="w-6 h-6" />
                </button>
              </div>

              <!-- Step 1: Group Name -->
              <div v-if="step === 1" class="p-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del grupo
                </label>
                <input
                  ref="nameInput"
                  v-model="groupName"
                  type="text"
                  placeholder="Ej: Viaje a Bariloche"
                  maxlength="100"
                  class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @keydown.enter="goToStep2"
                />
                <button
                  @click="goToStep2"
                  :disabled="!groupName.trim()"
                  class="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Siguiente
                </button>
              </div>

              <!-- Step 2: Add Members -->
              <div v-else class="p-6">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Agregá miembros por nombre. Cuando se unan al grupo, pueden reclamar su cuenta.
                </p>

                <!-- Member input -->
                <form @submit.prevent="addMember" class="flex gap-2 mb-4">
                  <input
                    ref="memberInput"
                    v-model="memberName"
                    type="text"
                    placeholder="Nombre del miembro"
                    class="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="submitting"
                  />
                  <button
                    type="submit"
                    :disabled="!memberName.trim() || submitting"
                    class="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                </form>

                <!-- Members list -->
                <div v-if="members.length > 0" class="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  <div
                    v-for="(member, index) in members"
                    :key="index"
                    class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center">
                        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ getInitials(member) }}</span>
                      </div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ member }}</span>
                    </div>
                    <button
                      @click="removeMember(index)"
                      :disabled="submitting"
                      class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                    >
                      <IconClose class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p v-if="error" class="text-sm text-red-500 dark:text-red-400 mb-4">
                  {{ error }}
                </p>

                <!-- Actions -->
                <button
                  @click="handleCreate"
                  :disabled="submitting"
                  class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {{ submitting ? 'Creando...' : (members.length > 0 ? 'Crear grupo' : 'Crear sin miembros') }}
                </button>
                <button
                  v-if="members.length > 0"
                  @click="members = []; handleCreate()"
                  :disabled="submitting"
                  class="w-full mt-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Omitir y crear solo
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import IconClose from '~icons/mdi/close'
import IconArrowLeft from '~icons/mdi/arrow-left'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { firestoreUser } = useAuth()
const groupStore = useGroupStore()

const step = ref(1)
const groupName = ref('')
const memberName = ref('')
const members = ref([])
const error = ref(null)
const submitting = ref(false)
const nameInput = ref(null)
const memberInput = ref(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    step.value = 1
    groupName.value = ''
    memberName.value = ''
    members.value = []
    error.value = null
    nextTick(() => nameInput.value?.focus())
  }
})

const handleClose = () => {
  if (!submitting.value) emit('close')
}

const goToStep2 = () => {
  if (!groupName.value.trim()) return
  step.value = 2
  nextTick(() => memberInput.value?.focus())
}

const addMember = () => {
  const name = memberName.value.trim()
  if (!name) return

  if (members.value.some(m => m.toLowerCase() === name.toLowerCase())) {
    error.value = 'Ya agregaste a alguien con ese nombre'
    return
  }

  members.value.push(name)
  memberName.value = ''
  error.value = null
  nextTick(() => memberInput.value?.focus())
}

const removeMember = (index) => {
  members.value.splice(index, 1)
}

const getInitials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}

const handleCreate = async () => {
  if (!firestoreUser.value || !groupName.value.trim() || submitting.value) return

  submitting.value = true
  error.value = null

  try {
    // Create the group
    await groupStore.createGroup(groupName.value.trim(), firestoreUser.value.id)

    // Add ghost members if any
    const membersToAdd = [...members.value]
    for (const name of membersToAdd) {
      await groupStore.addGhostMember(name)
    }

    // Enter the newly created group
    groupStore.showGroupList = false

    emit('close')
  } catch (err) {
    error.value = err.message || 'Error al crear el grupo'
  } finally {
    submitting.value = false
  }
}
</script>
