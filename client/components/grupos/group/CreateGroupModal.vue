<template>
  <Modal ref="modal" @onClose="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <button
          v-if="step === 2"
          @click="step = 1"
          class="text-ttc-text-muted hover:text-ttc-text p-1"
        >
          <IconArrowLeft class="w-5 h-5" />
        </button>
        <h3 class="text-lg font-semibold text-ttc-text">
          {{ step === 1 ? 'Crear grupo' : 'Agregar miembros' }}
        </h3>
      </div>
    </template>

    <template #body>
      <!-- Step 1: Group Name -->
      <div v-if="step === 1">
        <label class="block text-sm font-medium text-ttc-text mb-2">
          Nombre del grupo
        </label>
        <input
          ref="nameInput"
          v-model="groupName"
          type="text"
          placeholder="Ej: Viaje a Bariloche"
          maxlength="100"
          class="w-full px-3 py-2.5 border border-ttc-border rounded-btn bg-ttc-input text-ttc-text focus:ring-2 focus:ring-ttc-primary focus:border-transparent"
          @keydown.enter="goToStep2"
        />
      </div>

      <!-- Step 2: Add Members -->
      <div v-else>
        <p class="text-sm text-ttc-text-muted mb-4">
          Agregá miembros por nombre. Cuando se unan al grupo, pueden reclamar su cuenta.
        </p>

        <!-- Member input -->
        <form @submit.prevent="addMember" class="flex gap-2 mb-4">
          <input
            ref="memberInput"
            v-model="memberName"
            type="text"
            placeholder="Nombre del miembro"
            class="flex-1 px-3 py-2.5 border border-ttc-border rounded-btn bg-ttc-input text-ttc-text focus:ring-2 focus:ring-ttc-primary focus:border-transparent"
            :disabled="submitting"
          />
          <button
            type="submit"
            :disabled="!memberName.trim() || submitting"
            class="px-4 py-2.5 bg-ttc-input hover:bg-ttc-card-hover disabled:opacity-50 disabled:cursor-not-allowed text-ttc-text font-medium rounded-btn transition-colors"
          >
            Agregar
          </button>
        </form>

        <!-- Members list -->
        <div v-if="members.length > 0" class="space-y-2 mb-4 max-h-48 overflow-y-auto">
          <div
            v-for="(member, index) in members"
            :key="index"
            class="flex items-center justify-between px-3 py-2 bg-ttc-bg rounded-lg"
          >
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-ttc-input border border-dashed border-ttc-border flex items-center justify-center">
                <span class="text-xs font-medium text-ttc-text-muted">{{ getInitials(member) }}</span>
              </div>
              <span class="text-sm font-medium text-ttc-text">{{ member }}</span>
            </div>
            <button
              @click="removeMember(index)"
              :disabled="submitting"
              class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
            >
              <IconoirCancel class="w-4 h-4" />
            </button>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 dark:text-red-400 mb-4">
          {{ error }}
        </p>
      </div>
    </template>

    <template #footer>
      <!-- Step 1 footer -->
      <div v-if="step === 1" class="w-full">
        <button
          @click="goToStep2"
          :disabled="!groupName.trim()"
          class="w-full py-2.5 bg-ttc-primary hover:bg-ttc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-btn transition-colors"
        >
          Siguiente
        </button>
      </div>

      <!-- Step 2 footer -->
      <div v-else class="w-full space-y-2">
        <button
          @click="handleCreate"
          :disabled="submitting"
          class="w-full py-2.5 bg-ttc-primary hover:bg-ttc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-btn transition-colors"
        >
          {{ submitting ? 'Creando...' : (members.length > 0 ? 'Crear grupo' : 'Crear sin miembros') }}
        </button>
        <button
          v-if="members.length > 0"
          @click="members = []; handleCreate()"
          :disabled="submitting"
          class="w-full py-2 text-sm text-ttc-text-muted hover:text-ttc-text transition-colors"
        >
          Omitir y crear solo
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import IconArrowLeft from '~icons/mdi/arrow-left'
import IconoirCancel from '~icons/iconoir/cancel'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { firestoreUser } = useAuth()
const groupStore = useGroupStore()
const modal = ref(null)

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
    modal.value?.open()
    nextTick(() => nameInput.value?.focus())
  } else {
    modal.value?.close()
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
