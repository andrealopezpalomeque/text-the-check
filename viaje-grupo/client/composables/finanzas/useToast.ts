import { toast } from "vue3-toastify";

type ToastType = "success" | "error" | "info"

/**
 * Pay-trackr compatible toast function
 * Called as: useToast("success", "Message")
 */
export const useFinanzasToast = async (type: ToastType, message: string) => {
    if (import.meta.server) return;
    if (!message) return;

    toast[type](message, {
        position: "top-center",
        autoClose: 2000
    } as any);
};
