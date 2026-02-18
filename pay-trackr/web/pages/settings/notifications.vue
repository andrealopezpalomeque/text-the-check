<template>
  <div class="notifications-page mb-8">
    <!-- Settings Navigation -->
    <SettingsNav />

    <div class="flex flex-col gap-6 px-3">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-left">Notificaciones</h1>
          <p class="text-gray-400 text-sm mt-1">Configura los recordatorios de pagos</p>
        </div>
      </div>

      <!-- Not Supported Warning -->
      <div v-if="!notificationStore.isSupported" class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <MdiAlertCircle class="text-2xl text-yellow-500" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-yellow-400">No disponible</h2>
            <p class="text-gray-400 mt-1">
              Tu navegador no soporta notificaciones push. Proba usando Chrome, Firefox o Edge en su ultima version.
            </p>
          </div>
        </div>
      </div>

      <!-- Permission Denied Warning -->
      <div v-else-if="notificationStore.isPermissionDenied" class="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <MdiBellOff class="text-2xl text-red-500" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-red-400">Notificaciones bloqueadas</h2>
            <p class="text-gray-400 mt-1">
              Has bloqueado las notificaciones para este sitio. Para activarlas:
            </p>
            <ol class="mt-3 text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Hace clic en el icono del candado en la barra de direcciones</li>
              <li>Busca "Notificaciones" en los permisos</li>
              <li>Cambialo a "Permitir"</li>
              <li>Recarga la pagina</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Status Card -->
        <div class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-6">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              :class="notificationStore.isRegistered ? 'bg-green-500/20' : 'bg-gray-600'"
            >
              <MdiBell v-if="notificationStore.isRegistered" class="text-2xl text-green-500" />
              <MdiBellOff v-else class="text-2xl text-gray-400" />
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-semibold" :class="notificationStore.isRegistered ? 'text-green-400' : 'text-white'">
                {{ notificationStore.isRegistered ? 'Notificaciones activadas' : 'Notificaciones desactivadas' }}
              </h2>
              <p class="text-gray-400 mt-1">
                {{ notificationStore.isRegistered
                  ? 'Vas a recibir recordatorios cuando tus pagos esten por vencer.'
                  : 'Activa las notificaciones para recibir recordatorios de pagos.'
                }}
              </p>
            </div>
          </div>

          <!-- Toggle Button -->
          <button
            v-if="notificationStore.isRegistered"
            @click="disableNotifications"
            :disabled="notificationStore.isLoading"
            class="mt-6 btn btn-danger w-full flex items-center justify-center gap-2"
          >
            <MdiLoading v-if="notificationStore.isLoading" class="animate-spin" />
            <MdiBellOff v-else />
            Desactivar notificaciones
          </button>
          <button
            v-else
            @click="enableNotifications"
            :disabled="notificationStore.isLoading"
            class="mt-6 btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <MdiLoading v-if="notificationStore.isLoading" class="animate-spin" />
            <MdiBell v-else />
            Activar notificaciones
          </button>
        </div>

        <!-- Info Card -->
        <div class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <MdiInformation class="text-primary" />
            Como funcionan las notificaciones
          </h3>
          <ul class="space-y-3 text-gray-400 text-sm">
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">1</span>
              <span>Recibiras recordatorios cuando tengas pagos proximos a vencer (3 dias antes)</span>
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">2</span>
              <span>Las notificaciones se envian dos veces al dia (mañana y tarde)</span>
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">3</span>
              <span>Solo se notifican los pagos que no hayas marcado como pagados</span>
            </li>
          </ul>

          <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p class="text-blue-400 text-sm flex items-start gap-2">
              <MdiDevices class="shrink-0 mt-0.5" />
              <span>Las notificaciones son por dispositivo. Si usas PayTrackr en varios dispositivos, activalas en cada uno.</span>
            </p>
          </div>
        </div>

        <!-- Test Notification (dev only) -->
        <div v-if="isDev && notificationStore.isRegistered" class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <MdiBug class="text-yellow-500" />
            Herramientas de desarrollo
          </h3>
          <button
            @click="sendTestNotification"
            class="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <MdiSend />
            Enviar notificacion de prueba
          </button>
          <p class="text-gray-500 text-xs mt-2">
            Token: {{ notificationStore.currentToken?.substring(0, 20) }}...
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import MdiBell from '~icons/mdi/bell';
import MdiBellOff from '~icons/mdi/bell-off';
import MdiAlertCircle from '~icons/mdi/alert-circle';
import MdiInformation from '~icons/mdi/information';
import MdiLoading from '~icons/mdi/loading';
import MdiDevices from '~icons/mdi/devices';
import MdiBug from '~icons/mdi/bug';
import MdiSend from '~icons/mdi/send';
import { useNotificationStore } from '~/stores/notification';
import { toast } from 'vue3-toastify';

definePageMeta({
  middleware: ['auth']
});

const notificationStore = useNotificationStore();
const config = useRuntimeConfig();
const isDev = config.public.nodeEnv === 'development' || process.dev;

async function enableNotifications() {
  const success = await notificationStore.registerToken();

  if (success) {
    toast.success('Notificaciones activadas correctamente');
    // Clear the localStorage flag so banner doesn't show again
    localStorage.setItem('notificationPermissionAsked', 'true');
  } else if (notificationStore.error) {
    toast.error(notificationStore.error);
  }
}

async function disableNotifications() {
  const success = await notificationStore.unregisterToken();

  if (success) {
    toast.success('Notificaciones desactivadas');
  } else if (notificationStore.error) {
    toast.error(notificationStore.error);
  }
}

function sendTestNotification() {
  // This just shows a local notification for testing
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('PayTrackr - Prueba', {
      body: 'Esta es una notificacion de prueba. Las notificaciones estan funcionando correctamente.',
      icon: '/img/new-logo.png',
      badge: '/img/new-logo.png'
    });
    toast.info('Notificacion de prueba enviada');
  }
}

// Check if already registered on mount
onMounted(async () => {
  // If permission is granted but not registered, try to register silently
  if (notificationStore.permissionStatus === 'granted' && !notificationStore.isRegistered) {
    await notificationStore.registerToken();
  }
});

useSeo({
  title: 'Notificaciones - PayTrackr',
  description: 'Configura las notificaciones de recordatorio de pagos',
  path: '/settings/notifications',
  noindex: true,
});
</script>

