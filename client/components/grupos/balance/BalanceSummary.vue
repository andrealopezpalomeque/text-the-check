<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
    <h2 class="font-display text-sm font-semibold text-gray-500 dark:text-gray-400 text-center mb-2">
      Tu Balance
    </h2>

    <!-- Big Balance Number -->
    <div class="text-center">
      <p
        :class="[
          'font-bold font-mono tabular-nums',
          balanceSizeClass,
          balanceColorClass
        ]"
      >
        {{ balance >= 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(balance)) }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ balanceLabel }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  balance: { type: Number, required: true }
})

// Responsive font size based on amount magnitude
const balanceSizeClass = computed(() => {
  const abs = Math.abs(props.balance)
  if (abs >= 1000000) return 'text-2xl sm:text-3xl'
  if (abs >= 100000) return 'text-3xl sm:text-4xl'
  return 'text-4xl sm:text-5xl'
})

const balanceColorClass = computed(() => {
  if (props.balance > 0) {
    return 'text-positive-600 dark:text-positive-400'
  } else if (props.balance < 0) {
    return 'text-negative-600 dark:text-negative-400'
  }
  return 'text-gray-600 dark:text-gray-400'
})

const balanceLabel = computed(() => {
  if (props.balance > 0) {
    return 'te deben'
  } else if (props.balance < 0) {
    return 'debes'
  }
  return 'estas al dia'
})
</script>
