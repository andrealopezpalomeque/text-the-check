<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      <IconCashOut class="w-5 h-5 text-negative-500" />
      <h3 class="font-display text-base font-semibold text-gray-900 dark:text-white">
        Tenes que pagar
      </h3>
    </div>

    <div v-if="debts.length === 0" class="p-6 text-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No debes nada
      </p>
    </div>

    <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
      <div
        v-for="debt in debts"
        :key="debt.toUserId"
        class="px-4 py-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-3 min-w-0">
          <UserAvatar
            :name="getUserName(debt.toUserId)"
            :photo-url="null"
            size="sm"
            variant="positive"
          />
          <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ getUserName(debt.toUserId) }}
          </span>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <AmountDisplay
            :amount="debt.amount"
            size="sm"
            bold
          />
          <button
            v-if="hasPaymentInfo(debt.toUserId)"
            @click="$emit('showPaymentInfo', debt.toUserId)"
            class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
          >
            Ver datos
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconCashOut from '~icons/mdi/cash-minus'

defineProps({
  debts: { type: Array, required: true }
})

defineEmits(['showPaymentInfo'])

const userStore = useUserStore()

const getUserName = (userId) => {
  return userStore.getUserById(userId)?.name || 'Usuario'
}

const hasPaymentInfo = (userId) => {
  const user = userStore.getUserById(userId)
  if (!user?.paymentInfo) return false
  const info = user.paymentInfo
  return !!(info.cbu || info.cvu || info.alias || info.bankName)
}
</script>
