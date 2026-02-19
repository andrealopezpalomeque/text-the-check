import type { ToastInterface } from 'vue-toastification'

export const useToast = () => {
  const { $toast } = useNuxtApp() as unknown as { $toast: ToastInterface }

  return {
    success: (message: string) => $toast.success(message),
    error: (message: string) => $toast.error(message),
    info: (message: string) => $toast.info(message),
    warning: (message: string) => $toast.warning(message)
  }
}
