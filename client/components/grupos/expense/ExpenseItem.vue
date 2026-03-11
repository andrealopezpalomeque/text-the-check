<template>
  <div class="relative flex items-start gap-2 py-3 pr-3 pl-4 hover:bg-ttc-card-hover transition-colors overflow-hidden">
    <!-- Left color bar -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
      :style="{ backgroundColor: categoryColor }"
    />

    <!-- Main content -->
    <div class="flex-1 min-w-0">
      <!-- Description and amount row -->
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <!-- Wrap description + pill in a flex row -->
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-medium text-ttc-text truncate">{{ expense.description }}</p>
            <span
              class="text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0"
              :style="{ backgroundColor: categoryColor + '26', color: categoryColor }"
            >{{ categoryName }}</span>
          </div>
          <p class="text-xs text-ttc-text-muted mt-0.5">
            Pago: <span class="font-medium">{{ expense.userName }}</span>
            <span class="mx-1">-</span>
            <span>{{ formatRelativeTime(expense.timestamp) }}</span>
          </p>
        </div>

        <!-- Amount and actions -->
        <div class="flex items-start gap-2">
          <!-- Edit/Delete buttons (always visible, subtle) -->
          <div class="flex items-center gap-0.5">
            <button
              @click.stop="$emit('edit', expense)"
              class="p-1.5 text-ttc-text-dim hover:text-ttc-primary active:text-ttc-primary hover:bg-blue-900/20 active:bg-blue-900/30 rounded-lg transition-colors"
              title="Editar gasto"
            >
              <IconPencil class="w-4 h-4" />
            </button>
            <button
              @click.stop="$emit('delete', expense)"
              class="p-1.5 text-ttc-text-dim hover:text-red-400 active:text-red-400 hover:bg-red-900/20 active:bg-red-900/30 rounded-lg transition-colors"
              title="Eliminar gasto"
            >
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <!-- Amount (never truncates) -->
          <div class="text-right flex-shrink-0">
            <!-- Show user's share prominently if in personal view -->
            <template v-if="showUserShare && userShare > 0">
              <p class="text-sm font-semibold text-ttc-text font-mono tabular-nums whitespace-nowrap">
                {{ formatCurrency(userShare) }}
              </p>
              <p class="text-xs text-ttc-text-muted whitespace-nowrap">
                tu parte
              </p>
            </template>
            <template v-else>
              <AmountDisplay
                :amount="expense.amount"
                size="sm"
                bold
              />
              <p
                v-if="expense.originalCurrency && expense.originalCurrency !== 'ARS'"
                class="text-xs text-ttc-text-muted whitespace-nowrap"
              >
                {{ formatCurrencyByCode(expense.originalAmount ?? 0, expense.originalCurrency) }}
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- Participants info -->
      <div class="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
        <span class="text-ttc-text-muted">
          Dividido entre:
          <span class="text-ttc-text">{{ participantsDisplay }}</span>
        </span>
        <span class="text-ttc-text-muted bg-ttc-input px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          {{ formatCurrency(perPersonAmount) }} c/u
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconPencil from '~icons/mdi/pencil-outline'
import IconTrash from '~icons/mdi/delete-outline'

const props = defineProps({
  expense: { type: Object, required: true },
  currentUserId: { type: String, default: '' },
  showUserShare: { type: Boolean, default: false }
})

defineEmits(['edit', 'delete'])

const userStore = useUserStore()

const participantCount = computed(() => {
  if (props.expense.splitAmong && props.expense.splitAmong.length > 0) {
    return props.expense.splitAmong.length
  }
  return userStore.users.length
})

const perPersonAmount = computed(() => {
  return props.expense.amount / participantCount.value
})

const userShare = computed(() => {
  if (!props.currentUserId) return 0

  // Check if user is involved in this expense
  const splitAmong = props.expense.splitAmong || []
  const isInvolved = splitAmong.length === 0 ||
    splitAmong.includes(props.currentUserId) ||
    props.expense.userId === props.currentUserId

  if (!isInvolved) return 0
  return perPersonAmount.value
})

const participantsDisplay = computed(() => {
  if (!props.expense.splitAmong || props.expense.splitAmong.length === 0) {
    return 'Todos'
  }

  const names = props.expense.splitAmong
    .map(id => {
      const user = userStore.getUserById(id)
      return user?.name?.split(' ')[0] || '?'
    })
    .filter(Boolean)

  if (names.length <= 3) {
    return names.join(', ')
  }
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
})

const categoryColors = {
  food: '#F97316',
  transport: '#3B82F6',
  accommodation: '#A855F7',
  entertainment: '#EC4899',
  shopping: '#10B981',
  general: '#6B7280'
}
const categoryNames = {
  food: 'Comida',
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  entertainment: 'Entretenimiento',
  shopping: 'Compras',
  general: 'Otro'
}
const categoryColor = computed(() => categoryColors[props.expense.category] ?? categoryColors.general)
const categoryName = computed(() => categoryNames[props.expense.category] ?? 'Otro')
</script>
