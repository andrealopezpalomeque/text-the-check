import type { ToastInterface } from 'vue-toastification'

type ToastType = "success" | "error" | "info"

/**
 * Pay-trackr compatible toast function
 * Called as: useFinanzasToast("success", "Message")
 * Delegates to the vue-toastification plugin registered in plugins/toast.client.ts
 */
export const useFinanzasToast = (type: ToastType, message: string) => {
    if (import.meta.server) return;
    if (!message) return;

    const { $toast } = useNuxtApp() as unknown as { $toast: ToastInterface }
    $toast[type](message)
};
