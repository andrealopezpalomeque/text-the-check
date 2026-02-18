<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="handleCancel"
        />

        <!-- Dialog -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
          <Transition name="scale">
            <div
              v-if="modelValue"
              class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6"
            >
              <!-- Icon -->
              <div
                v-if="variant !== 'default'"
                class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                :class="iconBgClass"
              >
                <IconAlert v-if="variant === 'warning'" :class="['w-6 h-6', iconColorClass]" />
                <IconDanger v-else-if="variant === 'danger'" :class="['w-6 h-6', iconColorClass]" />
              </div>

              <!-- Title -->
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                {{ title }}
              </h3>

              <!-- Message -->
              <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                {{ message }}
              </p>

              <!-- Actions -->
              <div class="flex gap-3">
                <button
                  type="button"
                  @click="handleCancel"
                  class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  {{ cancelText }}
                </button>
                <button
                  type="button"
                  @click="handleConfirm"
                  :class="[
                    'flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium',
                    confirmButtonClass
                  ]"
                >
                  {{ confirmText }}
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
import IconAlert from '~icons/mdi/alert-circle-outline'
import IconDanger from '~icons/mdi/alert-octagon-outline'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  variant: { type: String, default: 'default' }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const iconBgClass = computed(() => {
  return {
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    danger: 'bg-red-100 dark:bg-red-900/30',
    default: ''
  }[props.variant]
})

const iconColorClass = computed(() => {
  return {
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    default: ''
  }[props.variant]
})

const confirmButtonClass = computed(() => {
  if (props.variant === 'danger') {
    return 'bg-red-600 hover:bg-red-700 text-white'
  }
  return 'bg-blue-600 hover:bg-blue-700 text-white'
})

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
