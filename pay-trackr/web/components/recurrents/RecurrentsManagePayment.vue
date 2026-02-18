<template>
  <Modal ref="modal">
    <template #header>
      <h2 class="text-xl font-bold">{{ isEdit ? "Editar" : "Agregar" }} Pago Fijo</h2>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex justify-center items-center min-h-[200px]">
        <Loader />
      </div>

      <form v-else @submit.prevent="savePayment" class="space-y-6">
        <!-- Payment Title & Description -->
        <div class="space-y-2">
          <label for="title" class="block text-sm font-medium text-gray-400">Título del Pago*</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            @blur="touched.title = true"
            class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            :class="touched.title && !form.title ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
            placeholder="ej. Suscripción Netflix"
          />
          <span v-if="touched.title && !form.title" class="text-xs text-red-400">Este campo es obligatorio</span>
        </div>

        <div class="space-y-2">
          <label for="description" class="block text-sm font-medium text-gray-400">Descripción (Opcional)</label>
          <textarea
            id="description"
            v-model="form.description"
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Agregá detalles sobre este pago"
            rows="2"
          ></textarea>
        </div>

        <!-- Amount & Category -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="amount" class="block text-sm font-medium text-gray-400">Monto*</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                id="amount"
                v-model="form.amount"
                type="text"
                inputmode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                @input="normalizeAmount"
                @blur="touched.amount = true"
                required
                class="w-full p-2 pl-7 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                :class="touched.amount && !form.amount ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
                placeholder="0,00"
              />
            </div>
            <span v-if="touched.amount && !form.amount" class="text-xs text-red-400">Este campo es obligatorio</span>
          </div>

          <div class="space-y-2">
            <label for="category" class="block text-sm font-medium text-gray-400">Categoría*</label>
            <select
              id="category"
              v-model="form.categoryId"
              @blur="touched.categoryId = true"
              required
              class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              :class="touched.categoryId && !form.categoryId ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
            >
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Due Date & Period -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="dueDateDay" class="block text-sm font-medium text-gray-400">Día de Vencimiento*</label>
            <input
              id="dueDateDay"
              v-model="form.dueDateDay"
              type="number"
              min="1"
              max="31"
              required
              @blur="touched.dueDateDay = true"
              class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              :class="touched.dueDateDay && !form.dueDateDay ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
              placeholder="Día del mes (1-31)"
            />
            <span v-if="touched.dueDateDay && !form.dueDateDay" class="text-xs text-red-400">Este campo es obligatorio</span>
            <p v-if="parseInt(form.dueDateDay) > 28" class="text-xs text-warning">
              Algunos meses tienen menos días. El pago puede vencer el último día de esos meses.
            </p>
          </div>

          <div class="space-y-2">
            <label for="timePeriod" class="block text-sm font-medium text-gray-400">Período de Pago</label>
            <select
              id="timePeriod"
              v-model="form.timePeriod"
              required
              class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="monthly">Mensual</option>
              <option value="biweekly">Quincenal</option>
              <option value="weekly">Semanal</option>
              <option value="yearly">Anual</option>
              <option value="quarterly">Trimestral</option>
            </select>
          </div>
        </div>

        <!-- Start & End Dates -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="startDate" class="block text-sm font-medium text-gray-400">Fecha de Inicio*</label>
            <input
              id="startDate"
              v-model="form.startDate"
              type="date"
              required
              @blur="touched.startDate = true"
              class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              :class="touched.startDate && !form.startDate ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
            />
            <span v-if="touched.startDate && !form.startDate" class="text-xs text-red-400">Este campo es obligatorio</span>
          </div>

          <div class="space-y-2">
            <label for="endDate" class="block text-sm font-medium text-gray-400">Fecha de Fin (Opcional)</label>
            <input
              id="endDate"
              v-model="form.endDate"
              type="date"
              class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <!-- Submit button is in footer -->
      </form>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <button
          @click="closeModal"
          class="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>

        <button
          @click="savePayment"
          class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">
            <span
              class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
            ></span>
            Guardando...
          </span>
          <span v-else>{{ isEdit ? "Actualizar" : "Crear" }} Pago</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { getCurrentUser } from "~/utils/firebase";
import { serverTimestamp, Timestamp } from "firebase/firestore";

const props = defineProps({
  paymentId: {
    type: String,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["onClose"]);

// ----- Define Store (must be before computed properties that use them) ---------
const recurrentStore = useRecurrentStore();
const categoryStore = useCategoryStore();
const { getCategories: categories } = storeToRefs(categoryStore);

// ----- Define Refs ---------
const modal = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Get default category ID
const defaultCategoryId = computed(() => {
  const otrosCategory = categories.value.find(c => c.name === 'Otros');
  return otrosCategory?.id || categories.value[0]?.id || '';
});

// Default form state
const getDefaultForm = () => ({
  title: "",
  description: "",
  amount: "",
  startDate: "",
  dueDateDay: "",
  endDate: "",
  timePeriod: "monthly",
  categoryId: defaultCategoryId.value,
  isCreditCard: false,
  creditCardId: null
});

const form = ref(getDefaultForm());
const touched = ref({ title: false, amount: false, categoryId: false, dueDateDay: false, startDate: false });

// ----- Define Methods ---------
function showModal() {
  // Fetch categories if not loaded
  categoryStore.fetchCategories();

  if (props.isEdit && props.paymentId) {
    fetchPaymentDetails(props.paymentId);
  } else {
    // Set default date to today
    const { $dayjs } = useNuxtApp();
    form.value = getDefaultForm();
    form.value.startDate = $dayjs().format("YYYY-MM-DD");
  }

  touched.value = { title: false, amount: false, categoryId: false, dueDateDay: false, startDate: false };
  modal.value?.open();
}

function closeModal() {
  // Reset form when closing
  if (!props.isEdit) {
    form.value = getDefaultForm();
  }
  modal.value?.close();
  emit("onClose");
}

// AMOUNT CONVERSION: Display uses comma (1234,56), Database uses period (1234.56)

// User input → Display format (comma)
function normalizeAmount(event) {
  let value = event.target.value.replace(/[^0-9.,]/g, '');
  value = value.replace('.', ','); // Period → Comma for display
  const parts = value.split(',');
  if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
  form.value.amount = value;
}

// Display format → Database format (for saving)
function parseAmount(value) {
  if (typeof value === 'string') {
    return parseFloat(value.replace(',', '.')) || 0; // Comma → Period for DB
  }
  return parseFloat(value) || 0;
}

// Database format → Display format (for editing)
function formatAmountForInput(value) {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toString().replace('.', ','); // Period → Comma for display
}

async function fetchPaymentDetails(paymentId) {
  isLoading.value = true;

  // Get payment from store
  const payment = recurrentStore.getRecurrentPayments.find((p) => p.id === paymentId);

  if (payment) {
    // Format dates for form inputs
    const { $dayjs } = useNuxtApp();
    const startDate = payment.startDate ? $dayjs(payment.startDate, { format: "MM/DD/YYYY" }).format("YYYY-MM-DD") : "";

    const endDate = payment.endDate ? $dayjs(payment.endDate, { format: "MM/DD/YYYY" }).format("YYYY-MM-DD") : "";

    form.value = {
      title: payment.title || "",
      description: payment.description || "",
      amount: formatAmountForInput(payment.amount),
      startDate: startDate,
      dueDateDay: payment.dueDateDay || "",
      endDate: endDate,
      timePeriod: payment.timePeriod || "monthly",
      categoryId: payment.categoryId || defaultCategoryId.value,
      isCreditCard: payment.isCreditCard || false,
      creditCardId: payment.creditCardId || null
    };
  }

  isLoading.value = false;
}

async function savePayment() {
  const user = getCurrentUser();
  if (!user) {
    useToast("error", "Debés iniciar sesión para guardar pagos");
    return;
  }

  isSubmitting.value = true;

  // Convert form data to payment object
  const paymentData = {
    title: form.value.title,
    description: form.value.description,
    amount: parseAmount(form.value.amount),
    startDate: form.value.startDate,
    dueDateDay: form.value.dueDateDay.toString(),
    endDate: form.value.endDate || null,
    timePeriod: form.value.timePeriod,
    categoryId: form.value.categoryId,
    isCreditCard: form.value.isCreditCard,
    creditCardId: form.value.creditCardId
  };

  try {
    let result;

    if (props.isEdit && props.paymentId) {
      // Update existing payment
      result = await recurrentStore.updateRecurrentPayment(props.paymentId, paymentData);

      if (result) {
        useToast("success", "Pago actualizado correctamente");
        closeModal();
      } else {
        useToast("error", recurrentStore.error || "Error al actualizar el pago");
      }
    } else {
      // Create new payment
      // This is a placeholder - you'll need to implement the createRecurrentPayment method in your store
      result = await recurrentStore.createRecurrentPayment({
        ...paymentData,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      if (result) {
        useToast("success", "Pago creado correctamente");
        closeModal();
      } else {
        useToast("error", recurrentStore.error || "Error al crear el pago");
      }
    }
  } catch (error) {
    console.error("Error saving payment:", error);
    useToast("error", "Ocurrió un error inesperado");
  } finally {
    isSubmitting.value = false;
  }
}

// ----- Define Watchers ---------
watch(
  () => props.paymentId,
  (newVal) => {
    if (newVal && props.isEdit && modal.value?.isOpen) {
      fetchPaymentDetails(newVal);
    }
  }
);

// Expose methods to parent
defineExpose({
  showModal,
  closeModal
});
</script>
