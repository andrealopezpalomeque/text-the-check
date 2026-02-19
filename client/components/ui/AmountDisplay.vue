<template>
  <span
    :class="[
      'font-mono tabular-nums whitespace-nowrap flex-shrink-0',
      sizeClasses,
      colorClasses
    ]"
  >
    <span v-if="showSign && amount !== 0">{{ amount >= 0 ? '+' : '-' }}</span>{{ formattedAmount }}
  </span>
</template>

<script setup>
const props = defineProps({
  amount: { type: Number, required: true },
  size: { type: String, default: 'md' },
  showSign: { type: Boolean, default: false },
  colorCoded: { type: Boolean, default: false },
  bold: { type: Boolean, default: false }
})

const formattedAmount = computed(() => {
  const absAmount = Math.abs(props.amount)
  return formatCurrency(absAmount)
})

// Responsive size classes based on the amount magnitude
const sizeClasses = computed(() => {
  const baseSize = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  }[props.size]

  const weight = props.bold ? 'font-bold' : 'font-semibold'

  return `${baseSize} ${weight}`
})

// Color classes based on positive/negative
const colorClasses = computed(() => {
  if (!props.colorCoded) {
    return 'text-gray-900 dark:text-white'
  }

  if (props.amount > 0) {
    return 'text-positive-600 dark:text-positive-400'
  } else if (props.amount < 0) {
    return 'text-negative-600 dark:text-negative-400'
  }
  return 'text-gray-600 dark:text-gray-400'
})
</script>
