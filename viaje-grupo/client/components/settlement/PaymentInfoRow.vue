<template>
  <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
    <div class="min-w-0">
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ label }}</p>
      <p
        :class="[
          'text-sm text-gray-900 dark:text-white truncate',
          mono ? 'font-mono' : ''
        ]"
      >
        {{ value }}
      </p>
    </div>
    <button
      @click.stop="copyToClipboard"
      class="text-xs font-medium transition-colors flex-shrink-0 ml-2 px-2 py-1 rounded"
      :class="copied
        ? 'text-positive-600 dark:text-positive-400 bg-positive-50 dark:bg-positive-900/20'
        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'"
    >
      {{ copied ? 'Copiado' : 'Copiar' }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  fieldKey: { type: String, required: true },
  mono: { type: Boolean, default: true }
})

const toast = useToast()
const copied = ref(false)

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    toast.success('Copiado al portapapeles')

    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    toast.error('Error al copiar')
  }
}
</script>
