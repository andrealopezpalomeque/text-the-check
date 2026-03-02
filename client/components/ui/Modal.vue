<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="handleBackdropClick"
        />

        <!-- Modal (bottom sheet on mobile, centered on desktop) -->
        <div class="fixed inset-0 flex items-end md:items-center justify-center">
          <Transition name="slide-up">
            <div
              v-if="isOpen"
              ref="modalContainer"
              class="relative bg-ttc-card w-full md:max-w-md md:rounded-xl rounded-t-2xl shadow-xl max-h-[90vh] md:max-h-[85vh] flex flex-col"
              :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
              @click.stop
            >
              <!-- Handle bar (mobile only) -->
              <div class="flex justify-center pt-3 pb-1 md:hidden">
                <div class="w-10 h-1 bg-ttc-border rounded-full" />
              </div>

              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-ttc-border shrink-0">
                <slot name="header">
                  <h3 class="text-lg font-semibold text-ttc-text">Modal</h3>
                </slot>
                <button
                  @click="close"
                  aria-label="Cerrar"
                  class="text-ttc-text-muted hover:text-ttc-text p-1.5 rounded-lg hover:bg-ttc-card-hover transition-colors cursor-pointer"
                >
                  <IconoirCancel class="w-5 h-5" />
                </button>
              </div>

              <!-- Body -->
              <div class="px-6 py-4 overflow-y-auto flex-1 dark-scrollbar">
                <slot name="body">
                  <slot />
                </slot>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-ttc-border shrink-0 empty:hidden [&>*]:m-0">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import IconoirCancel from '~icons/iconoir/cancel'

const props = defineProps({
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['onClose'])

const isOpen = ref(false)
const modalContainer = ref(null)

onKeyStroke('Escape', () => {
  if (isOpen.value) close()
})

function open() {
  isOpen.value = true
  if (process.client) {
    document.body.classList.add('modal-opened')
  }
}

function showModal() {
  open()
}

function close() {
  isOpen.value = false
  if (process.client) {
    document.body.classList.remove('modal-opened')
  }
  emit('onClose')
}

function closeModal() {
  close()
}

function handleBackdropClick(ev) {
  // Guard for date picker popover clicks (vc- classes from VCalendar)
  if (ev.target?.classList && Array.from(ev.target.classList).some(cl => cl.includes('vc-'))) {
    return
  }
  if (props.closeOnBackdrop) {
    close()
  }
}

defineExpose({
  open,
  close,
  showModal,
  closeModal,
  isOpen,
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: scale(0.95);
  }
}
</style>
