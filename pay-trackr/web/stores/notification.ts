import { defineStore } from 'pinia';
import { getCurrentUser, requestFCMToken, onForegroundMessage } from '~/utils/firebase';
import { FcmTokenSchema } from '~/utils/odm/schemas/fcmTokenSchema';
import type { MessagePayload } from 'firebase/messaging';

interface FcmToken {
  id: string;
  token: string;
  notificationsEnabled: boolean;
  createdAt: any;
}

interface NotificationState {
  tokens: FcmToken[];
  currentToken: string | null;
  isLoading: boolean;
  isRegistered: boolean;
  notificationsEnabled: boolean;
  error: string | null;
  unsubscribeForeground: (() => void) | null;
}

// Schema instance
const fcmTokenSchema = new FcmTokenSchema();

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    tokens: [],
    currentToken: null,
    isLoading: false,
    isRegistered: false,
    notificationsEnabled: true,
    error: null,
    unsubscribeForeground: null
  }),

  getters: {
    // Check if notifications are supported in this browser
    isSupported: () => {
      if (typeof window === 'undefined') return false;
      return 'Notification' in window && 'serviceWorker' in navigator;
    },

    // Get current browser permission status
    permissionStatus: () => {
      if (typeof window === 'undefined') return 'default';
      if (!('Notification' in window)) return 'unsupported';
      return Notification.permission;
    },

    // Check if we can request permission (not denied, not already granted)
    canRequestPermission(): boolean {
      return this.permissionStatus === 'default';
    },

    // Check if permission was denied
    isPermissionDenied(): boolean {
      return this.permissionStatus === 'denied';
    }
  },

  actions: {
    // Get or create a unique device ID for this browser/device
    getDeviceId(): string {
      const storageKey = 'paytrackr_device_id';
      let deviceId = localStorage.getItem(storageKey);

      if (!deviceId) {
        // Generate a unique ID for this device
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(storageKey, deviceId);
      }

      return deviceId;
    },

    // Register FCM token for push notifications
    async registerToken(): Promise<boolean> {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      if (!this.isSupported) {
        this.error = 'Las notificaciones no están soportadas en este navegador';
        return false;
      }

      this.isLoading = true;
      this.error = null;

      try {
        // Get VAPID key from runtime config
        const config = useRuntimeConfig();
        const vapidKey = config.public.firebaseVapidKey as string;

        if (!vapidKey) {
          this.error = 'Configuración de notificaciones no disponible';
          return false;
        }

        // Request FCM token (this will also request permission if needed)
        const token = await requestFCMToken(vapidKey);

        if (!token) {
          // Permission was denied or error occurred
          if (Notification.permission === 'denied') {
            this.error = 'Permiso de notificaciones denegado. Habilitalo desde la configuración del navegador.';
          } else {
            this.error = 'No se pudo obtener el token de notificaciones';
          }
          return false;
        }

        // Get device ID for deduplication
        const deviceId = this.getDeviceId();

        // Save token to Firestore (replaces old token for this device)
        const result = await fcmTokenSchema.registerToken(token, deviceId);

        if (result.success) {
          this.currentToken = token;
          this.isRegistered = true;
          this.notificationsEnabled = true;

          // Set up foreground message listener
          this.setupForegroundListener();

          return true;
        } else {
          this.error = result.error || 'Error al registrar el token';
          return false;
        }
      } catch (error) {
        console.error('Error registering FCM token:', error);
        this.error = 'Error al activar las notificaciones';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Unregister current token (disable notifications on this device)
    async unregisterToken(): Promise<boolean> {
      if (!this.currentToken) {
        return true; // Already unregistered
      }

      this.isLoading = true;

      try {
        const result = await fcmTokenSchema.deleteToken(this.currentToken);

        if (result.success) {
          this.currentToken = null;
          this.isRegistered = false;

          // Clean up foreground listener
          if (this.unsubscribeForeground) {
            this.unsubscribeForeground();
            this.unsubscribeForeground = null;
          }

          return true;
        } else {
          this.error = result.error || 'Error al desactivar las notificaciones';
          return false;
        }
      } catch (error) {
        console.error('Error unregistering FCM token:', error);
        this.error = 'Error al desactivar las notificaciones';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Toggle notifications on/off for current device
    async toggleNotifications(enabled: boolean): Promise<boolean> {
      if (!this.currentToken) {
        if (enabled) {
          // Need to register first
          return this.registerToken();
        }
        return true;
      }

      this.isLoading = true;

      try {
        // Find the token document
        const result = await fcmTokenSchema.find({
          where: [{ field: 'token', operator: '==', value: this.currentToken }]
        });

        if (result.success && result.data && result.data.length > 0) {
          const tokenDoc = result.data[0];
          const updateResult = await fcmTokenSchema.toggleNotifications(tokenDoc.id, enabled);

          if (updateResult.success) {
            this.notificationsEnabled = enabled;
            return true;
          }
        }

        this.error = 'Error al actualizar preferencias de notificaciones';
        return false;
      } catch (error) {
        console.error('Error toggling notifications:', error);
        this.error = 'Error al actualizar preferencias';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Fetch user's tokens from Firestore
    async fetchTokens(): Promise<boolean> {
      const user = getCurrentUser();

      if (!user) {
        return false;
      }

      this.isLoading = true;

      try {
        const result = await fcmTokenSchema.findAllForUser();

        if (result.success && result.data) {
          this.tokens = result.data as FcmToken[];
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error fetching tokens:', error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Set up listener for foreground messages
    setupForegroundListener() {
      // Clean up existing listener
      if (this.unsubscribeForeground) {
        this.unsubscribeForeground();
      }

      this.unsubscribeForeground = onForegroundMessage((payload: MessagePayload) => {
        console.log('Foreground message received:', payload);

        // Show toast notification when app is open
        const { $toast } = useNuxtApp();

        if ($toast && payload.notification) {
          $toast.info(payload.notification.body || 'Nueva notificación', {
            position: 'top-right',
            autoClose: 5000
          });
        }
      });
    },

    // Delete all tokens for current user (useful for logout)
    async deleteAllTokens(): Promise<boolean> {
      this.isLoading = true;

      try {
        const result = await fcmTokenSchema.deleteAllForUser();

        if (result.success) {
          this.tokens = [];
          this.currentToken = null;
          this.isRegistered = false;

          // Clean up foreground listener
          if (this.unsubscribeForeground) {
            this.unsubscribeForeground();
            this.unsubscribeForeground = null;
          }

          return true;
        }

        return false;
      } catch (error) {
        console.error('Error deleting all tokens:', error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Clear store state
    clearState() {
      if (this.unsubscribeForeground) {
        this.unsubscribeForeground();
      }

      this.tokens = [];
      this.currentToken = null;
      this.isLoading = false;
      this.isRegistered = false;
      this.notificationsEnabled = true;
      this.error = null;
      this.unsubscribeForeground = null;
    }
  }
});
