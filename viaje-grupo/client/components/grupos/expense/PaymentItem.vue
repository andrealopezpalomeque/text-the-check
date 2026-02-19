<template>
  <div class="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors overflow-hidden">
    <div class="flex items-start gap-2">
      <!-- Icon -->
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-positive-100 dark:bg-positive-900/30 flex items-center justify-center">
        <IconCash class="w-5 h-5 text-positive-600 dark:text-positive-400" />
      </div>

      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <!-- Description and amount row -->
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Pago realizado
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ fromUserName }}</span>
              <span class="mx-1">→</span>
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ toUserName }}</span>
            </p>
          </div>

          <!-- Amount -->
          <div class="text-right flex-shrink-0">
            <AmountDisplay
              :amount="payment.amount"
              size="sm"
              bold
              variant="positive"
            />
          </div>
        </div>

        <!-- Time -->
        <div class="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <IconCheckCircle class="w-3 h-3 text-positive-500" />
          <span>{{ formatRelativeTime(payment.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconCash from '~icons/mdi/cash'
import IconCheckCircle from '~icons/mdi/check-circle'

const props = defineProps({
  payment: { type: Object, required: true }
})

const userStore = useUserStore()

const fromUserName = computed(() => {
  return userStore.getUserById(props.payment.fromUserId)?.name || 'Usuario'
})

const toUserName = computed(() => {
  return userStore.getUserById(props.payment.toUserId)?.name || 'Usuario'
})
</script>
