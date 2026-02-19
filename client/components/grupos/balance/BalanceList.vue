<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <!-- Header -->
    <div class="px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      <IconCurrencyUsd class="w-5 h-5 text-gray-500 dark:text-gray-400" />
      <h3 class="font-display text-base font-semibold text-gray-900 dark:text-white">
        Balances del Grupo
      </h3>
    </div>

    <!-- Balance Items -->
    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      <BalanceItem
        v-for="balance in sortedBalances"
        :key="balance.userId"
        :balance="balance"
        :breakdown="getBalanceBreakdown(balance.userId)"
        :is-current-user="balance.userId === currentUserId"
      />
    </div>
  </div>
</template>

<script setup>
import IconCurrencyUsd from '~icons/mdi/currency-usd'

const props = defineProps({
  balances: { type: Array, required: true },
  currentUserId: { type: String, default: '' }
})

const userStore = useUserStore()
const expenseStore = useExpenseStore()

// Sort balances: biggest positive first, then negative
const sortedBalances = computed(() => {
  return [...props.balances].sort((a, b) => b.net - a.net)
})

// Calculate expense breakdown for a user's balance
const getBalanceBreakdown = (userId) => {
  const breakdown = []

  expenseStore.expenses.forEach(expense => {
    // Determine who splits this expense
    let splitUserIds = []
    if (expense.splitAmong && expense.splitAmong.length > 0) {
      splitUserIds = expense.splitAmong.filter(id =>
        userStore.users.some(u => u.id === id)
      )
      if (splitUserIds.length === 0) {
        splitUserIds = userStore.users.map(u => u.id)
      } else if (!splitUserIds.includes(expense.userId)) {
        splitUserIds.push(expense.userId)
      }
    } else {
      splitUserIds = userStore.users.map(u => u.id)
    }

    // Check if this user is involved
    const isInvolved = splitUserIds.includes(userId) || expense.userId === userId
    if (!isInvolved) return

    const shareAmount = expense.amount / splitUserIds.length
    let userEffect = 0

    if (expense.userId === userId) {
      // User paid: they get credit for (amount - their share)
      userEffect = expense.amount - shareAmount
    } else if (splitUserIds.includes(userId)) {
      // User didn't pay but owes a share
      userEffect = -shareAmount
    }

    // Only show if there's an actual effect on this user's balance
    if (Math.abs(userEffect) > 0.01) {
      breakdown.push({
        expense,
        amount: userEffect,
        paidBy: expense.userName,
        date: expense.timestamp
      })
    }
  })

  // Sort by date (newest first)
  return breakdown.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
</script>
