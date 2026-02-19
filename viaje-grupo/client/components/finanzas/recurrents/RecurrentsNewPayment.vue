<template>
  <div>
    <RecurrentsManagePayment ref="newPayment" @onClose="() => showAddButton = true" @onCreated="emitCreated"/>
    <button
      @click="
        () => {
          showAddButton = false;
          newPayment.showModal();
        }
      "
      class="fixed bottom-6 right-6 z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      aria-label="Agregar nuevo pago"
    >
      <MdiPlus class="text-2xl" />
    </button>
  </div>
</template>

<script setup>
import MdiPlus from '~icons/mdi/plus';

// ------ Define Vars ------
const showAddButton = ref(true);

// Emit events
const emit = defineEmits(['onCreated']);

// Refs
const newPayment = ref(null);

// Methods
function emitCreated() {
  emit('onCreated');
}
</script>