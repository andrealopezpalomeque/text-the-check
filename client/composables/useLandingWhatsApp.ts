export function useLandingWhatsApp() {
  const config = useRuntimeConfig()
  const whatsappPhone = config.public.whatsappPhoneNumber || '5491100000000'
  const whatsappLink = computed(() => `https://wa.me/${whatsappPhone}?text=HOLA`)
  return { whatsappLink, whatsappPhone }
}
