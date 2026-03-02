<template>
  <div class="bg-ttc-card rounded-xl shadow-sm border border-ttc-border">
    <!-- Header -->
    <div class="px-3 py-3 border-b border-ttc-border flex items-center gap-2">
      <IconClipboardList class="w-5 h-5 text-ttc-text-muted" />
      <h3 class="font-display text-base font-semibold text-ttc-text">
        {{ title }}
      </h3>
      <span
        v-if="showCount"
        class="text-xs text-ttc-text-muted ml-auto"
      >
        {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="p-8 text-center">
      <div class="w-14 h-14 mx-auto mb-3 bg-ttc-input rounded-full flex items-center justify-center">
        <IconReceipt class="w-7 h-7 text-gray-400" />
      </div>
      <p class="text-ttc-text-muted text-sm">
        {{ emptyMessage }}
      </p>
      <button
        v-if="showAddButton"
        @click="$emit('addExpense')"
        class="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
      >
        Agregar el primero
      </button>
    </div>

    <!-- Items List -->
    <div v-else class="divide-y divide-ttc-border">
      <template v-for="item in displayedItems" :key="getKey(item)">
        <ExpenseItem
          v-if="isExpense(item)"
          :expense="item"
          :current-user-id="currentUserId"
          :show-user-share="showUserShare"
          @edit="$emit('editExpense', $event)"
          @delete="$emit('deleteExpense', $event)"
        />
        <PaymentItem
          v-else
          :payment="item"
        />
      </template>
    </div>

    <!-- Show More Button -->
    <div
      v-if="hasMore"
      class="px-3 py-3 border-t border-ttc-border"
    >
      <button
        @click="showAll = !showAll"
        class="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
      >
        {{ showAll ? 'Ver menos' : `Ver todos (${items.length})` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import IconClipboardList from '~icons/mdi/clipboard-text-clock'
import IconReceipt from '~icons/mdi/receipt-text-outline'

const props = defineProps({
  items: { type: Array, required: true },
  title: { type: String, default: 'Actividad' },
  currentUserId: { type: String, default: '' },
  showUserShare: { type: Boolean, default: false },
  showCount: { type: Boolean, default: false },
  showAddButton: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'No hay actividad' },
  limit: { type: Number, default: 5 }
})

defineEmits(['addExpense', 'editExpense', 'deleteExpense'])

const showAll = ref(false)

const hasMore = computed(() => {
  return props.items.length > props.limit
})

const displayedItems = computed(() => {
  if (showAll.value || !hasMore.value) {
    return props.items
  }
  return props.items.slice(0, props.limit)
})

// Type guard
const isExpense = (item) => {
  return 'category' in item
}

const getKey = (item) => {
  return isExpense(item) ? `exp-${item.id}` : `pay-${item.id}`
}
</script>
