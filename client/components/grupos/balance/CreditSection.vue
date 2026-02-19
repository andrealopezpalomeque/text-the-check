<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      <IconCashIn class="w-5 h-5 text-positive-500" />
      <h3 class="font-display text-base font-semibold text-gray-900 dark:text-white">
        Te deben
      </h3>
    </div>

    <div v-if="credits.length === 0" class="p-6 text-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Nadie te debe
      </p>
    </div>

    <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
      <div
        v-for="credit in credits"
        :key="credit.fromUserId"
        class="px-4 py-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-3 min-w-0">
          <UserAvatar
            :name="getUserName(credit.fromUserId)"
            :photo-url="null"
            size="sm"
            variant="negative"
          />
          <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ getUserName(credit.fromUserId) }}
          </span>
        </div>

        <AmountDisplay
          :amount="credit.amount"
          size="sm"
          bold
          class="flex-shrink-0"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import IconCashIn from '~icons/mdi/cash-plus'

defineProps({
  credits: { type: Array, required: true }
})

const userStore = useUserStore()

const getUserName = (userId) => {
  return userStore.getUserById(userId)?.name || 'Usuario'
}
</script>
