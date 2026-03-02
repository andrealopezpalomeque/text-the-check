<template>
  <Modal ref="modal" @onClose="handleClose">
    <template #header>
      <h3 class="text-lg font-semibold text-ttc-text">
        Agregar miembro
      </h3>
    </template>

    <template #body>
      <form @submit.prevent="handleSubmit" id="add-ghost-form">
        <p class="text-sm text-ttc-text-muted mb-4">
          Agregá a alguien por nombre para dividir gastos. Cuando se una al grupo, puede reclamar su cuenta.
        </p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-ttc-text mb-1">
            Nombre
          </label>
          <input
            ref="nameInput"
            v-model="name"
            type="text"
            placeholder="Ej: Juan"
            class="w-full px-3 py-2.5 border border-ttc-border rounded-btn bg-ttc-input text-ttc-text focus:ring-2 focus:ring-ttc-primary focus:border-transparent"
            :disabled="submitting"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500 dark:text-red-400 mb-4">
          {{ error }}
        </p>
      </form>
    </template>

    <template #footer>
      <button
        type="submit"
        form="add-ghost-form"
        :disabled="!name.trim() || submitting"
        class="w-full py-2.5 bg-ttc-primary hover:bg-ttc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-btn transition-colors"
      >
        {{ submitting ? 'Agregando...' : 'Agregar' }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const groupStore = useGroupStore()
const modal = ref(null)

const name = ref('')
const error = ref(null)
const submitting = ref(false)
const nameInput = ref(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    name.value = ''
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

const handleSubmit = async () => {
  if (!name.value.trim() || submitting.value) return

  submitting.value = true
  error.value = null

  try {
    await groupStore.addGhostMember(name.value)
    emit('close')
  } catch (err) {
    error.value = err.message || 'Error al agregar miembro'
  } finally {
    submitting.value = false
  }
}
</script>
