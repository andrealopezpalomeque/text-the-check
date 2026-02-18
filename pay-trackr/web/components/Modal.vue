<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click="handleBackdropClick" role="dialog" aria-modal="true">
        <div ref="modalContainer" class="modal-container" @click.stop>
          <div class="modal-header">
            <slot name="header">
              <h3 class="text-lg font-medium">Modal Title</h3>
            </slot>
            <button @click="close" aria-label="Cerrar" class="p-3 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer">
              <IconoirCancel class="text-[1.143rem]"/>
            </button>
          </div>

          <div class="modal-body dark-scrollbar">
            <slot name="body">
              <slot></slot>
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import IconoirCancel from '~icons/iconoir/cancel';

const props = defineProps({
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['onClose']);

const isOpen = ref(false);
const modalContainer = ref(null);

// Escape key handling
onKeyStroke('Escape', () => {
  if (isOpen.value) close();
});

function open() {
  isOpen.value = true;
  if (process.client) {
    document.body.classList.add('modal-opened');
  }
}

// Alias for ModalStructure compatibility
function showModal() {
  open();
}

function close() {
  isOpen.value = false;
  if (process.client) {
    document.body.classList.remove('modal-opened');
  }
  emit('onClose');
}

// Alias for ModalStructure compatibility
function closeModal() {
  close();
}

function handleBackdropClick(ev) {
  // Guard for date picker popover clicks (vc- classes from VCalendar)
  if (ev.target?.classList && Array.from(ev.target.classList).some(cl => cl.includes('vc-'))) {
    return;
  }
  if (props.closeOnBackdrop) {
    close();
  }
}

// Expose methods
defineExpose({
  open,
  close,
  showModal,
  closeModal,
  isOpen
});
</script>

<style scoped>
.modal-footer :deep(button), .modal-footer :deep(input[type="submit"]) {
    margin: 0px;
}
</style>
