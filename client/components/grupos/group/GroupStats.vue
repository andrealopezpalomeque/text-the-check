<template>
  <div class="grid grid-cols-3 gap-2">
    <!-- Members -->
    <div class="bg-ttc-card rounded-xl shadow-sm border border-ttc-border p-3 overflow-hidden">
      <div class="flex items-center gap-1 mb-1">
        <IconUsers class="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span class="text-xs text-ttc-text-muted truncate">Personas</span>
      </div>
      <p class="text-lg font-bold text-ttc-text font-mono tabular-nums">
        {{ memberCount }}
      </p>
    </div>

    <!-- Expenses Count -->
    <div class="bg-ttc-card rounded-xl shadow-sm border border-ttc-border p-3 overflow-hidden">
      <div class="flex items-center gap-1 mb-1">
        <IconReceipt class="w-4 h-4 text-purple-500 flex-shrink-0" />
        <span class="text-xs text-ttc-text-muted truncate">Gastos</span>
      </div>
      <p class="text-lg font-bold text-ttc-text font-mono tabular-nums">
        {{ expenseCount }}
      </p>
    </div>

    <!-- Total Spent -->
    <div class="bg-ttc-card rounded-xl shadow-sm border border-ttc-border p-3 overflow-hidden">
      <div class="flex items-center gap-1 mb-1">
        <IconCurrency class="w-4 h-4 text-green-500 flex-shrink-0" />
        <span class="text-xs text-ttc-text-muted truncate">Total</span>
      </div>
      <p
        :class="[
          'font-bold font-mono tabular-nums text-ttc-text',
          totalSizeClass
        ]"
      >
        {{ formatCurrency(Math.round(totalSpent)) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import IconUsers from '~icons/mdi/account-group'
import IconReceipt from '~icons/mdi/receipt-text-outline'
import IconCurrency from '~icons/mdi/currency-usd'

const props = defineProps({
  memberCount: { type: Number, required: true },
  expenseCount: { type: Number, required: true },
  totalSpent: { type: Number, required: true }
})

const totalSizeClass = computed(() => {
  if (props.totalSpent >= 1000000) return 'text-sm md:text-lg'
  if (props.totalSpent >= 100000) return 'text-base md:text-lg'
  return 'text-lg'
})
</script>
