<template>
  <div v-if="showBanner" class="fixed bottom-4 right-4 p-4 bg-gray-800 rounded-lg shadow-lg z-50 max-w-sm">
    <div class="flex items-start">
      <div class="flex-1">
        <h3 class="font-medium text-white">Activar Notificaciones</h3>
        <p class="text-sm text-gray-300 mt-1">
          Recibí recordatorios cuando tus pagos estén por vencer para que no te olvides de ninguno.
        </p>
      </div>
      <button @click="dismissBanner" class="text-gray-400 hover:text-white">
        <span class="sr-only">Cerrar</span>
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div class="mt-3 flex space-x-3">
      <button
        @click="enableNotifications"
        :disabled="notificationStore.isLoading"
        class="flex-[2] bg-primary text-white px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-50 shadow-sm shadow-primary/30"
      >
        <span v-if="notificationStore.isLoading">Activando...</span>
        <span v-else>Activar</span>
      </button>
      <button
        @click="dismissBanner"
        :disabled="notificationStore.isLoading"
        class="flex-[1] bg-gray-700 text-gray-300 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        Ahora no
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useNotificationStore } from '~/stores/notification';
import { toast } from 'vue3-toastify';

const notificationStore = useNotificationStore();
const showBanner = ref(false);

onMounted(() => {
  // Check if we've asked before
  const hasAskedBefore = localStorage.getItem('notificationPermissionAsked');

  // Show banner if:
  // - Notifications are supported
  // - Permission hasn't been granted yet
  // - We haven't asked before
  // - Permission wasn't denied
  if (notificationStore.isSupported &&
      notificationStore.permissionStatus !== 'granted' &&
      !notificationStore.isPermissionDenied &&
      !hasAskedBefore) {
    showBanner.value = true;
  }

  // If permission is already granted, set up foreground listener
  if (notificationStore.permissionStatus === 'granted' && !notificationStore.isRegistered) {
    // Try to register token silently (user already granted permission before)
    notificationStore.registerToken();
  }
});

onBeforeUnmount(() => {
  // Store handles cleanup internally
});

async function enableNotifications() {
  const success = await notificationStore.registerToken();

  showBanner.value = false;
  localStorage.setItem('notificationPermissionAsked', 'true');

  if (success) {
    toast.success('Notificaciones activadas correctamente');
  } else if (notificationStore.error) {
    toast.error(notificationStore.error);
  }
}

function dismissBanner() {
  showBanner.value = false;
  localStorage.setItem('notificationPermissionAsked', 'true');
}
</script>
