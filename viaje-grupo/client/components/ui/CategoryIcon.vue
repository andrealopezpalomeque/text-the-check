<template>
  <div
    :class="[
      'flex items-center justify-center flex-shrink-0 rounded-xl',
      sizeClasses,
      bgColorClass
    ]"
  >
    <component :is="iconComponent" :class="[iconSizeClasses, iconColorClass]" />
  </div>
</template>

<script setup>
import IconFood from '~icons/mdi/silverware-fork-knife'
import IconTransport from '~icons/mdi/car'
import IconAccommodation from '~icons/mdi/bed'
import IconEntertainment from '~icons/mdi/party-popper'
import IconShopping from '~icons/mdi/shopping'
import IconGeneral from '~icons/mdi/file-document-outline'

const props = defineProps({
  category: { type: String, required: true },
  size: { type: String, default: 'md' }
})

const iconComponent = computed(() => {
  const icons = {
    food: IconFood,
    transport: IconTransport,
    accommodation: IconAccommodation,
    entertainment: IconEntertainment,
    shopping: IconShopping,
    general: IconGeneral
  }
  return icons[props.category] ?? icons.general
})

const sizeClasses = computed(() => {
  return {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[props.size]
})

const iconSizeClasses = computed(() => {
  return {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[props.size]
})

const bgColorClass = computed(() => {
  const colors = {
    food: 'bg-orange-100 dark:bg-orange-900/30',
    transport: 'bg-blue-100 dark:bg-blue-900/30',
    accommodation: 'bg-purple-100 dark:bg-purple-900/30',
    entertainment: 'bg-pink-100 dark:bg-pink-900/30',
    shopping: 'bg-emerald-100 dark:bg-emerald-900/30',
    general: 'bg-gray-100 dark:bg-gray-700'
  }
  return colors[props.category] ?? colors.general
})

const iconColorClass = computed(() => {
  const colors = {
    food: 'text-orange-600 dark:text-orange-400',
    transport: 'text-blue-600 dark:text-blue-400',
    accommodation: 'text-purple-600 dark:text-purple-400',
    entertainment: 'text-pink-600 dark:text-pink-400',
    shopping: 'text-emerald-600 dark:text-emerald-400',
    general: 'text-gray-600 dark:text-gray-400'
  }
  return colors[props.category] ?? colors.general
})
</script>
