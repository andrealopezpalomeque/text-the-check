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
              class="relative bg-white dark:bg-gray-800 w-full md:max-w-sm md:rounded-xl rounded-t-2xl shadow-xl"
              :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
            >
              <!-- Handle bar (mobile only) -->
              <div class="flex justify-center pt-3 pb-2 md:hidden">
                <div class="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Agregar miembro
                </h3>
                <button
                  @click="handleClose"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <IconClose class="w-6 h-6" />
                </button>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="p-6">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Agregá a alguien por nombre para dividir gastos. Cuando se una al grupo, puede reclamar su cuenta.
                </p>

                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    ref="nameInput"
                    v-model="name"
                    type="text"
                    placeholder="Ej: Juan"
                    class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    :disabled="submitting"
                  />
                </div>

                <p v-if="error" class="text-sm text-red-500 dark:text-red-400 mb-4">
                  {{ error }}
                </p>

                <button
                  type="submit"
                  :disabled="!name.trim() || submitting"
                  class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {{ submitting ? 'Agregando...' : 'Agregar' }}
                </button>
              </form>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import IconClose from '~icons/mdi/close'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const groupStore = useGroupStore()

const name = ref('')
const error = ref(null)
const submitting = ref(false)
const nameInput = ref(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    name.value = ''
    error.value = null
    nextTick(() => nameInput.value?.focus())
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
