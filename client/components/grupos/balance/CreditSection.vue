<template>
  <div class="bg-ttc-card rounded-xl shadow-sm border border-ttc-border">
    <div class="px-4 py-3 border-b border-ttc-border flex items-center gap-2">
      <IconCashIn class="w-5 h-5 text-positive-500" />
      <h3 class="font-display text-base font-semibold text-ttc-text">
        Te deben
      </h3>
    </div>

    <div v-if="credits.length === 0" class="p-6 text-center">
      <p class="text-ttc-text-muted text-sm">
        Nadie te debe
      </p>
    </div>

    <div v-else class="divide-y divide-ttc-border">
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
          <span class="text-sm font-medium text-ttc-text truncate">
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
