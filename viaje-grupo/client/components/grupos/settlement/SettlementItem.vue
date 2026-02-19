<template>
  <div class="transition-colors">
    <!-- Settlement row (clickable header) -->
    <button
      @click="toggleExpand"
      class="w-full px-3 py-3 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left overflow-hidden"
      :class="{ 'bg-gray-50 dark:bg-gray-700/30': isExpanded }"
    >
      <!-- Chevron indicator -->
      <IconChevronRight
        class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0"
        :class="{ 'rotate-90': isExpanded }"
      />

      <!-- From user (debtor) -->
      <div class="min-w-0 max-w-[120px] sm:max-w-none">
        <UserAvatar
          :name="debtorName"
          :photo-url="null"
          size="sm"
          variant="negative"
          show-name
          first-name-only
        />
      </div>

      <!-- Arrow -->
      <div class="flex-shrink-0 text-gray-400">
        <IconArrowRight class="w-3 h-3" />
      </div>

      <!-- To user (creditor) -->
      <div class="min-w-0 max-w-[120px] sm:max-w-none">
        <UserAvatar
          :name="creditorName"
          :photo-url="null"
          size="sm"
          variant="positive"
          show-name
          first-name-only
        />
      </div>

      <!-- Amount -->
      <div class="ml-auto flex-shrink-0">
        <AmountDisplay
          :amount="settlement.amount"
          size="sm"
          bold
        />
      </div>
    </button>

    <!-- Expanded breakdown -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[500px]"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-[500px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="isExpanded"
        class="px-4 pt-2 pb-4 overflow-hidden"
      >
        <!-- Constrained width on desktop for better readability -->
        <div class="ml-5 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-4 md:max-w-md">
          <!-- Simplified mode: no expense breakdown available -->
          <div v-if="simplified" class="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <p>Con simplificacion activada, las transferencias se calculan para minimizar la cantidad de pagos.</p>
            <p class="mt-1">Desactiva "Simplificar" para ver el desglose por gasto.</p>
          </div>

          <!-- Normal mode: Expense breakdown with selection -->
          <div v-else>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Selecciona que pagar
              </p>
              <!-- Select all toggle -->
              <button
                v-if="breakdown.length > 1"
                @click="toggleAll"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {{ allSelected ? 'Deseleccionar todo' : 'Seleccionar todo' }}
              </button>
            </div>
            <div class="space-y-1">
              <label
                v-for="(item, idx) in breakdown"
                :key="idx"
                class="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedExpenseIds.has(item.expense.id) }"
              >
                <input
                  type="checkbox"
                  :checked="selectedExpenseIds.has(item.expense.id)"
                  @change="toggleExpenseSelection(item.expense.id)"
                  class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <CategoryIcon :category="item.expense.category" size="sm" />
                <span class="truncate text-gray-700 dark:text-gray-300 flex-1 min-w-0">
                  {{ item.expense.description }}
                </span>
                <AmountDisplay
                  :amount="item.amount"
                  size="sm"
                  class="flex-shrink-0"
                />
              </label>
              <div v-if="breakdown.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                Sin desglose disponible
              </div>
            </div>
            <!-- Payments already made (shows why settlement < expense total) -->
            <div v-if="paymentsMade.length > 0" class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Pagos realizados
              </p>
              <div class="space-y-1">
                <div
                  v-for="payment in paymentsMade"
                  :key="payment.id"
                  class="flex items-center justify-between text-sm py-1"
                >
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ formatDate(payment.createdAt) }}
                  </span>
                  <span class="text-positive-600 dark:text-positive-400 font-medium">
                    -{{ formatAmount(payment.amount) }}
                  </span>
                </div>
              </div>
              <!-- Show the math: expenses - payments = remaining -->
              <div class="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                <div class="flex justify-between">
                  <span>Total gastos:</span>
                  <span>{{ formatAmount(Math.round(totalExpenseDebt)) }}</span>
                </div>
                <div class="flex justify-between text-positive-600 dark:text-positive-400">
                  <span>Ya pagado:</span>
                  <span>-{{ formatAmount(totalPaid) }}</span>
                </div>
                <div class="flex justify-between font-medium text-gray-700 dark:text-gray-300 mt-1">
                  <span>Pendiente:</span>
                  <span>{{ formatAmount(settlement.amount) }}</span>
                </div>
              </div>
            </div>

            <!-- Selected total -->
            <div v-if="breakdown.length > 0" class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Total seleccionado:
              </span>
              <AmountDisplay
                :amount="selectedTotal"
                size="sm"
                bold
                :class="selectedTotal > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'"
              />
            </div>
          </div>

          <!-- Payment info -->
          <div class="pt-3 border-t border-gray-200 dark:border-gray-600">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <IconCreditCard class="w-4 h-4" />
              Datos de pago de {{ creditorFirstName }}
            </p>

            <div v-if="hasPaymentInfo" class="space-y-2">
              <!-- CBU -->
              <PaymentInfoRow
                v-if="creditor?.paymentInfo?.cbu"
                label="CBU"
                :value="creditor.paymentInfo.cbu"
                :field-key="`cbu-${index}`"
              />

              <!-- CVU -->
              <PaymentInfoRow
                v-if="creditor?.paymentInfo?.cvu"
                label="CVU"
                :value="creditor.paymentInfo.cvu"
                :field-key="`cvu-${index}`"
              />

              <!-- Alias -->
              <PaymentInfoRow
                v-if="creditor?.paymentInfo?.alias"
                label="Alias"
                :value="creditor.paymentInfo.alias"
                :field-key="`alias-${index}`"
                :mono="false"
              />

              <!-- Bank name -->
              <div v-if="creditor?.paymentInfo?.bankName" class="px-3 py-2">
                <p class="text-xs text-gray-500 dark:text-gray-400">Banco/Plataforma</p>
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ creditor.paymentInfo.bankName }}
                </p>
              </div>
            </div>

            <!-- No payment info -->
            <div v-else class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              <IconInformation class="w-4 h-4 flex-shrink-0" />
              <span>{{ creditorFirstName }} no agrego datos de pago aun</span>
            </div>
          </div>

          <!-- Record Payment Section -->
          <div class="pt-3 border-t border-gray-200 dark:border-gray-600">
            <!-- Confirmation state -->
            <div v-if="showPaymentConfirm" class="space-y-3">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Registrar pago de <span class="font-semibold">{{ formatAmount(paymentAmount) }}</span>
                de {{ debtorFirstName }} a {{ creditorFirstName }}?
              </p>

              <!-- Amount input -->
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-500 dark:text-gray-400">Monto:</label>
                <input
                  v-model.number="paymentAmount"
                  type="number"
                  min="1"
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div class="flex gap-2">
                <button
                  @click="confirmPayment"
                  :disabled="isSubmitting || paymentAmount <= 0"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-positive-600 hover:bg-positive-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <IconCheck v-if="!isSubmitting" class="w-4 h-4" />
                  <IconLoading v-else class="w-4 h-4 animate-spin" />
                  {{ isSubmitting ? 'Guardando...' : 'Confirmar' }}
                </button>
                <button
                  @click="cancelPayment"
                  :disabled="isSubmitting"
                  class="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <!-- Record payment button - Simplified mode (no expense selection) -->
            <button
              v-else-if="simplified"
              @click="startSimplifiedPayment"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <IconCash class="w-4 h-4" />
              Registrar pago de {{ formatAmount(settlement.amount) }}
            </button>

            <!-- Record payment button - Normal mode (with expense selection) -->
            <button
              v-else
              @click="startPayment"
              :disabled="selectedTotal <= 0"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors"
              :class="selectedTotal > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'"
            >
              <IconCash class="w-4 h-4" />
              <span v-if="selectedTotal > 0 && selectedTotal !== settlement.amount">
                Registrar pago de {{ formatAmount(Math.round(selectedTotal)) }}
              </span>
              <span v-else-if="selectedTotal > 0">
                Registrar pago realizado
              </span>
              <span v-else>
                Selecciona al menos un gasto
              </span>
            </button>

            <!-- Success message -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="showSuccess"
                class="mt-3 flex items-center gap-2 text-sm text-positive-600 dark:text-positive-400 bg-positive-50 dark:bg-positive-900/20 rounded-lg px-3 py-2"
              >
                <IconCheck class="w-4 h-4 flex-shrink-0" />
                <span>Pago registrado correctamente</span>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import IconChevronRight from '~icons/mdi/chevron-right'
import IconArrowRight from '~icons/mdi/arrow-right'
import IconCreditCard from '~icons/mdi/credit-card'
import IconInformation from '~icons/mdi/information-outline'
import IconCash from '~icons/mdi/cash'
import IconCheck from '~icons/mdi/check'
import IconLoading from '~icons/mdi/loading'

const props = defineProps({
  settlement: { type: Object, required: true },
  index: { type: Number, required: true },
  simplified: { type: Boolean, default: false }
})

const userStore = useUserStore()
const expenseStore = useExpenseStore()
const paymentStore = usePaymentStore()
const { firestoreUser, user: firebaseUser } = useAuth()
const groupStore = useGroupStore()

const isExpanded = ref(false)
const showPaymentConfirm = ref(false)
const paymentAmount = ref(0)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const selectedExpenseIds = ref(new Set())

const debtor = computed(() => userStore.getUserById(props.settlement.fromUserId))
const creditor = computed(() => userStore.getUserById(props.settlement.toUserId))

const debtorName = computed(() => debtor.value?.name || 'Usuario')
const creditorName = computed(() => creditor.value?.name || 'Usuario')
const debtorFirstName = computed(() => debtorName.value.split(' ')[0])
const creditorFirstName = computed(() => creditorName.value.split(' ')[0])

const hasPaymentInfo = computed(() => {
  const info = creditor.value?.paymentInfo
  if (!info) return false
  return !!(info.cbu || info.cvu || info.alias || info.bankName)
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  // Select all expenses by default when expanding
  if (isExpanded.value) {
    selectedExpenseIds.value = new Set(breakdown.value.map(item => item.expense.id))
  }
}

// Toggle an individual expense selection
const toggleExpenseSelection = (expenseId) => {
  const newSet = new Set(selectedExpenseIds.value)
  if (newSet.has(expenseId)) {
    newSet.delete(expenseId)
  } else {
    newSet.add(expenseId)
  }
  selectedExpenseIds.value = newSet
}

// Calculate total from selected expenses only
const selectedTotal = computed(() => {
  return breakdown.value
    .filter(item => selectedExpenseIds.value.has(item.expense.id))
    .reduce((sum, item) => sum + item.amount, 0)
})

// Check if all expenses are selected
const allSelected = computed(() => {
  return breakdown.value.length > 0 &&
    breakdown.value.every(item => selectedExpenseIds.value.has(item.expense.id))
})

// Toggle all expenses
const toggleAll = () => {
  if (allSelected.value) {
    selectedExpenseIds.value = new Set()
  } else {
    selectedExpenseIds.value = new Set(breakdown.value.map(item => item.expense.id))
  }
}

const formatAmount = (amount) => {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const startPayment = () => {
  // Use selected total if there are selected items, otherwise full amount
  paymentAmount.value = selectedTotal.value > 0 ? Math.round(selectedTotal.value) : props.settlement.amount
  showPaymentConfirm.value = true
}

const startSimplifiedPayment = () => {
  // In simplified mode, always use the full settlement amount
  paymentAmount.value = props.settlement.amount
  showPaymentConfirm.value = true
}

const cancelPayment = () => {
  showPaymentConfirm.value = false
  paymentAmount.value = 0
}

const confirmPayment = async () => {
  if (isSubmitting.value || paymentAmount.value <= 0) return

  isSubmitting.value = true

  try {
    const groupId = groupStore.selectedGroupId
    if (!groupId) {
      console.error('No group selected')
      return
    }

    // Get the current user's ID (the one recording the payment)
    const recordedBy = firestoreUser.value?.id
    const authUid = firebaseUser.value?.uid
    if (!recordedBy || !authUid) {
      console.error('No linked user found')
      return
    }

    await paymentStore.addPayment(
      groupId,
      props.settlement.fromUserId,
      props.settlement.toUserId,
      paymentAmount.value,
      recordedBy,
      authUid
    )

    // Show success message
    showPaymentConfirm.value = false
    showSuccess.value = true

    // Hide success message after 3 seconds
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Error recording payment:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Calculate expense breakdown for a settlement
const breakdown = computed(() => {
  const result = []

  expenseStore.expenses.forEach(expense => {
    // Only consider expenses paid by the creditor (toUserId)
    if (expense.userId !== props.settlement.toUserId) return

    // Determine who splits this expense
    // The payer is NOT auto-included - they must be explicitly listed
    let splitUserIds = []
    if (expense.splitAmong && expense.splitAmong.length > 0) {
      splitUserIds = expense.splitAmong.filter(id =>
        userStore.users.some(u => u.id === id)
      )
      // If no valid users found, fallback to everyone
      if (splitUserIds.length === 0) {
        splitUserIds = userStore.users.map(u => u.id)
      }
    } else {
      // Default: Everyone (when no specific mentions)
      splitUserIds = userStore.users.map(u => u.id)
    }

    // Check if debtor is in the split
    if (!splitUserIds.includes(props.settlement.fromUserId)) return

    const shareAmount = expense.amount / splitUserIds.length
    result.push({
      expense,
      amount: shareAmount
    })
  })

  return result.sort((a, b) =>
    new Date(b.expense.timestamp).getTime() - new Date(a.expense.timestamp).getTime()
  )
})

// Get payments already made from debtor to creditor
const paymentsMade = computed(() => {
  return paymentStore.payments
    .filter(p =>
      p.fromUserId === props.settlement.fromUserId &&
      p.toUserId === props.settlement.toUserId
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// Total amount already paid
const totalPaid = computed(() => {
  return paymentsMade.value.reduce((sum, p) => sum + p.amount, 0)
})

// Total debt from expenses (before payments)
const totalExpenseDebt = computed(() => {
  return breakdown.value.reduce((sum, item) => sum + item.amount, 0)
})

// Format date for payment display
const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
</script>
