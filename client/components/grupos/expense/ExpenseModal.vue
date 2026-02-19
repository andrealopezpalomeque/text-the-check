<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="handleClose"
        />

        <!-- Modal (bottom sheet on mobile, centered on desktop) -->
        <div class="fixed inset-0 flex items-end md:items-center justify-center">
          <Transition name="slide-up">
            <div
              v-if="isOpen"
              class="relative bg-white dark:bg-gray-800 w-full md:max-w-md md:rounded-xl rounded-t-2xl shadow-xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
              :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
            >
              <!-- Handle bar (mobile only) -->
              <div class="flex justify-center pt-3 pb-2 md:hidden">
                <div class="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ isEditMode ? 'Editar gasto' : 'Agregar gasto' }}
                </h3>
                <button
                  @click="handleClose"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <IconClose class="w-6 h-6" />
                </button>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="p-6">
                <!-- Currency -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Moneda
                  </label>
                  <select
                    v-model="form.currency"
                    class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ARS">Pesos argentinos (ARS)</option>
                    <option value="USD">Dolares (USD)</option>
                    <option value="EUR">Euros (EUR)</option>
                    <option value="BRL">Reales brasileros (BRL)</option>
                  </select>
                </div>

                <!-- Amount -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monto *
                  </label>
                  <input
                    v-model.number="form.amount"
                    type="number"
                    inputmode="decimal"
                    min="0.01"
                    step="0.01"
                    required
                    :placeholder="currencyPlaceholder"
                    class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                  />
                  <p v-if="form.currency !== 'ARS' && form.amount" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Aprox. {{ formatCurrency(convertToARS(form.amount, form.currency)) }}
                  </p>
                </div>

                <!-- Description -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripcion *
                  </label>
                  <input
                    v-model="form.description"
                    type="text"
                    required
                    maxlength="200"
                    placeholder="Almuerzo en el centro"
                    class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- Category -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    v-model="form.category"
                    class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="food">Comida</option>
                    <option value="transport">Transporte</option>
                    <option value="accommodation">Alojamiento</option>
                    <option value="entertainment">Entretenimiento</option>
                    <option value="shopping">Compras</option>
                    <option value="general">Otro</option>
                  </select>
                </div>

                <!-- Participants -->
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quienes participan en este gasto?
                  </label>
                  <div class="space-y-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    <label
                      v-for="user in users"
                      :key="user.id"
                      class="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                    >
                      <input
                        v-model="form.participants"
                        type="checkbox"
                        :value="user.id"
                        class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span class="text-gray-700 dark:text-gray-300 text-sm">{{ user.name }}</span>
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selecciona las personas que compartiran este gasto
                  </p>
                </div>

                <!-- Error message -->
                <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                  <button
                    type="button"
                    @click="handleClose"
                    class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="loading"
                    class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors"
                  >
                    <span v-if="loading">Guardando...</span>
                    <span v-else>{{ isEditMode ? 'Guardar cambios' : 'Agregar' }}</span>
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import IconClose from '~icons/mdi/close'
import { deleteField } from 'firebase/firestore'

const { isExpenseModalOpen, closeExpenseModal, expenseModalMode, expenseToEdit } = useNavigationState()
const { user, firestoreUser } = useAuth()
const expenseStore = useExpenseStore()
const userStore = useUserStore()
const groupStore = useGroupStore()

const isOpen = computed(() => isExpenseModalOpen.value)
const isEditMode = computed(() => expenseModalMode.value === 'edit')
const users = computed(() => userStore.users)

const loading = ref(false)
const error = ref(null)

const form = reactive({
  amount: null,
  description: '',
  category: 'general',
  currency: 'ARS',
  participants: []
})

// Watch for modal open in edit mode to populate form
watch(isOpen, (newVal) => {
  if (newVal && isEditMode.value && expenseToEdit.value) {
    const expense = expenseToEdit.value
    // If expense has original currency, use that
    form.currency = expense.originalCurrency || 'ARS'
    form.amount = expense.originalAmount || expense.amount
    form.description = expense.description
    form.category = expense.category
    form.participants = expense.splitAmong?.length ? [...expense.splitAmong] : []
  }
})

// Exchange rates (approximate, for UI preview)
const exchangeRates = {
  USD: 1300,
  EUR: 1400,
  BRL: 260
}

const convertToARS = (amount, currency) => {
  if (currency === 'ARS') return amount
  const rate = exchangeRates[currency]
  return rate ? Math.round(amount * rate) : amount
}

const currencyPlaceholder = computed(() => {
  const placeholders = {
    ARS: '1000',
    USD: '10',
    EUR: '10',
    BRL: '50'
  }
  return placeholders[form.currency] || '100'
})

const resetForm = () => {
  form.amount = null
  form.description = ''
  form.category = 'general'
  form.currency = 'ARS'
  form.participants = []
  error.value = null
}

const handleClose = () => {
  resetForm()
  closeExpenseModal()
}

// Note: We no longer pre-select anyone when the modal opens.
// Users must explicitly select participants for the expense.
// This matches the WhatsApp behavior where mentions are explicit.

const handleSubmit = async () => {
  // Validate
  if (!form.amount || form.amount <= 0) {
    error.value = 'El monto debe ser mayor a 0'
    return
  }
  if (!form.description.trim()) {
    error.value = 'La descripcion es requerida'
    return
  }
  if (!firestoreUser.value || !user.value) {
    error.value = 'No estas autenticado'
    return
  }
  if (!groupStore.selectedGroupId) {
    error.value = 'No hay grupo seleccionado'
    return
  }
  if (form.participants.length === 0) {
    error.value = 'Debes seleccionar al menos un participante'
    return
  }

  loading.value = true
  error.value = null

  try {
    const amountInARS = convertToARS(form.amount, form.currency)

    if (isEditMode.value && expenseToEdit.value?.id) {
      // Update existing expense - build update object without undefined values
      const updateData = {
        amount: Math.round(amountInARS),
        description: form.description.trim(),
        category: form.category,
        splitAmong: form.participants
      }

      // Only include original currency fields if not ARS
      if (form.currency !== 'ARS') {
        updateData.originalAmount = form.amount
        updateData.originalCurrency = form.currency
      } else {
        // If switching back to ARS, remove original currency fields
        updateData.originalAmount = deleteField()
        updateData.originalCurrency = deleteField()
      }

      await expenseStore.updateExpense(expenseToEdit.value.id, updateData)
    } else {
      // For create, prepare the values
      const originalAmount = form.currency !== 'ARS' ? form.amount : undefined
      const originalCurrency = form.currency !== 'ARS' ? form.currency : undefined
      // Create new expense
      await expenseStore.addExpense(
        firestoreUser.value.id,
        firestoreUser.value.name,
        user.value.uid,
        Math.round(amountInARS),
        form.description.trim(),
        form.category,
        `${form.amount} ${form.currency} ${form.description}`,
        groupStore.selectedGroupId,
        form.participants,
        originalAmount,
        originalCurrency
      )
    }
    handleClose()
  } catch (err) {
    console.error('Error saving expense:', err)
    error.value = 'Error al guardar el gasto. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: scale(0.95);
  }
}
</style>
