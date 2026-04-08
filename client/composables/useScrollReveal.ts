export function useScrollReveal(target: Ref<HTMLElement | null>, options: { threshold?: number } = {}) {
  const isVisible = ref(false)

  onMounted(() => {
    const el = toValue(target)
    if (!el) return

    // If element is already in viewport, show immediately
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible.value = true
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer.disconnect()
        }
      },
      { threshold: options.threshold ?? 0.05, rootMargin: '0px 0px -30px 0px' }
    )
    observer.observe(el)

    onUnmounted(() => observer.disconnect())
  })

  return { isVisible }
}
