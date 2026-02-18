<template>
  <div class="one-time-page mb-8">
    <PaymentsDetails ref="paymentDetails" :paymentId="activePaymentId" :isRecurrent="false" @openEdit="showEdit" />
    <PaymentsManagePayment
      ref="editPayment"
      :paymentId="activePaymentId"
      :isEdit="true"
      :isRecurrent="false"
      :isReview="isReviewMode"
      @onClose="isReviewMode = false"
    />
    <PaymentsManagePayment
      ref="newPayment"
      :isRecurrent="false"
      @onCreated="fetchData"
    />

    <!-- Floating Add Button -->
    <div v-if="!isLoading" class="fixed bottom-6 right-6 z-10 group">
      <!-- Tooltip -->
      <div class="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
        Agregar Pago
        <span class="text-gray-400 ml-1 text-xs">(N)</span>
      </div>
      <button
        @click="showNewPayment"
        class="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
        aria-label="Agregar nuevo pago"
      >
        <MdiPlus class="text-2xl" />
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="flex flex-col gap-4 skeleton-shimmer">
      <!-- Header Skeleton -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-3">
        <div class="h-8 w-48 bg-gray-700 rounded"></div>
        <div class="flex gap-3">
          <div class="h-16 w-40 bg-gray-700 rounded-lg"></div>
          <div class="h-16 w-40 bg-gray-700 rounded-lg"></div>
          <div class="h-16 w-40 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
      <!-- Cards Skeleton -->
      <div class="px-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="h-44 bg-gray-700 rounded-lg"></div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-4">
      <!-- Page Header -->
      <div class="px-3 pt-2">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Pagos Únicos</h1>
            <p class="text-sm text-gray-500">
              {{ payments.length }} pago{{ payments.length !== 1 ? 's' : '' }} este mes
            </p>
          </div>
        </div>
      </div>

      <!-- Month Navigation & Summary -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-3">
        <!-- Month Navigation -->
        <div class="flex items-center justify-between w-full md:w-auto bg-base rounded-xl p-1 border border-gray-600 shadow-sm shadow-white/5">
          <button
            @click="changeMonth(1)"
            class="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Mes anterior"
          >
            <MdiChevronLeft class="text-xl" />
          </button>
          <span class="px-4 py-1 font-medium min-w-[160px] text-center">
            {{ currentMonth }} {{ currentYear }}
          </span>
          <button
            @click="changeMonth(-1)"
            class="p-2 rounded-lg transition-colors"
            :class="isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700'"
            :disabled="isCurrentMonth"
            aria-label="Mes siguiente"
          >
            <MdiChevronRight class="text-xl" />
          </button>
        </div>

        <!-- Summary Stats -->
        <div class="flex flex-wrap gap-4 md:gap-6">
          <div class="flex items-center gap-3">
            <MdiCashCheck class="text-success text-2xl" />
            <span class="text-lg font-semibold text-white">{{ formatPrice(monthTotals.paid) }}</span>
          </div>

          <div class="flex items-center gap-3">
            <MdiCashRemove class="text-danger text-2xl" />
            <span class="text-lg font-semibold text-white">{{ formatPrice(monthTotals.unpaid) }}</span>
          </div>

          <div class="flex items-center gap-3">
            <MdiCalculator class="text-gray-300 text-2xl" />
            <span class="text-lg font-semibold text-white">{{ formatPrice(monthTotals.paid + monthTotals.unpaid) }}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <Filters @onSearch="searchPayments" @onOrder="orderPayments" :initialSort="{ name: 'date', order: 'desc' }" />

      <!-- Payments List -->
      <div class="px-3">
        <div
          v-if="payments.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <MdiCashOff class="text-4xl text-gray-600" />
          </div>
          <h3 class="text-lg font-medium text-gray-300 mb-1">Aún no hay pagos</h3>
          <p class="text-sm text-gray-500 mb-6 max-w-xs">
            Registrá tus gastos únicos como compras, facturas o servicios de {{ currentMonth }}.
          </p>
          <button
            @click="showNewPayment"
            class="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
          >
            <MdiPlus class="text-lg" />
            Agregar Primer Pago
          </button>
        </div>

        <!-- Payment Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="payment in payments"
            :key="payment.id"
            class="rounded-xl p-4 bg-base cursor-pointer transition-all duration-200 border border-gray-600 shadow-sm shadow-white/5 hover:shadow-md hover:shadow-white/10 group"
            @click="showDetails(payment.id)"
          >
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-100 truncate">{{ payment.title }}</h3>
                  <!-- WhatsApp Indicator -->
                  <span
                    v-if="payment.isWhatsapp"
                    class="flex-shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400"
                    :title="getSourceLabel(payment)"
                  >
                    <component :is="getSourceIcon(payment)" class="text-xs" />
                  </span>
                  <!-- Needs Revision Indicator -->
                  <span v-if="payment.needsRevision"
                        class="flex-shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400"
                        title="Necesita revision">
                    <MdiAlertCircleOutline class="text-xs" />
                    Revisar
                  </span>
                </div>
                <span
                  class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md tracking-wide font-medium"
                  :style="{ backgroundColor: getDisplayCategoryColor(payment) + '20', color: getDisplayCategoryColor(payment) }"
                >
                  {{ getDisplayCategoryName(payment) }}
                </span>
              </div>
              <div
                class="ml-3 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                :class="
                  payment.isPaid
                    ? 'bg-success/15'
                    : isDelayed(payment.dueDate)
                    ? 'bg-danger/15'
                    : 'bg-gray-700'
                "
              >
                <MdiCheck v-if="payment.isPaid" class="text-success text-xl" />
                <MdiClockOutline v-else-if="isDelayed(payment.dueDate)" class="text-danger text-xl" />
                <MdiCircleOutline v-else class="text-gray-500 text-xl" />
              </div>
            </div>

            <!-- Description -->
            <p v-if="payment.description" class="text-xs text-gray-400 line-clamp-1 mb-3">
              {{ payment.description }}
            </p>

            <!-- Amount & Date -->
            <div class="flex justify-between items-end mb-4">
              <div>
                <p class="text-2xl font-bold text-white">{{ formatPrice(payment.amount) }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-400">{{ formatDate(payment.dueDate || payment.createdAt) }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-3 border-t border-gray-600/50">
              <div class="flex items-center gap-2">
                <button
                  @click.stop="togglePaymentStatus(payment.id, !payment.isPaid)"
                  class="text-sm py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium transition-all"
                  :class="payment.isPaid
                    ? 'bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30'
                    : 'bg-success/20 text-success hover:bg-success/30 border border-success/30'"
                  :disabled="togglingPayment === payment.id"
                >
                  <MdiLoading v-if="togglingPayment === payment.id" class="animate-spin text-base text-current" />
                  <MdiCheck v-else-if="!payment.isPaid" class="text-base text-success" />
                  <MdiUndo v-else class="text-base text-warning" />
                  <span class="hidden sm:inline">{{ payment.isPaid ? "No Pagado" : "Pagado" }}</span>
                </button>
                <!-- Review Button for WhatsApp pending payments -->
                <button
                  v-if="payment.isWhatsapp && payment.status === 'pending'"
                  @click.stop="showReview(payment.id)"
                  class="text-sm py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium transition-all bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                >
                  <MdiEye class="text-base text-primary" />
                  <span>Revisar</span>
                </button>
              </div>
              <button
                @click.stop="showEdit(payment.id)"
                class="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-600/50 transition-colors"
                aria-label="Editar pago"
              >
                <MdiPencil class="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from "~/utils";
import MdiCheck from "~icons/mdi/check";
import MdiClockOutline from "~icons/mdi/clock-outline";
import MdiCircleOutline from "~icons/mdi/circle-outline";
import MdiPencil from "~icons/mdi/pencil";
import MdiCashCheck from "~icons/mdi/cash-check";
import MdiCashRemove from "~icons/mdi/cash-remove";
import MdiCashOff from "~icons/mdi/cash-off";
import MdiCalendarMonth from "~icons/mdi/calendar-month";
import MdiChevronLeft from "~icons/mdi/chevron-left";
import MdiChevronRight from "~icons/mdi/chevron-right";
import MdiPlus from "~icons/mdi/plus";
import MdiLoading from "~icons/mdi/loading";
import MdiCalculator from "~icons/mdi/calculator";
import MdiUndo from "~icons/mdi/undo";
import MdiWhatsapp from "~icons/mdi/whatsapp";
import MdiEye from "~icons/mdi/eye";
import MdiAlertCircleOutline from "~icons/mdi/alert-circle-outline";
import MdiMicrophone from "~icons/mdi/microphone";
import MdiImage from "~icons/mdi/image";
import MdiFilePdfBox from "~icons/mdi/file-pdf-box";

definePageMeta({
  middleware: ["auth"]
});

// ----- Define Useful Properties ---------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars ----------
const paymentStore = usePaymentStore();
const categoryStore = useCategoryStore();
const { getPayments, isLoading: storeLoading } = storeToRefs(paymentStore);

// ----- Category Helpers ---------
function getDisplayCategoryName(payment) {
  if (!payment?.categoryId) return 'Otros';
  return categoryStore.getCategoryName(payment.categoryId);
}

function getDisplayCategoryColor(payment) {
  if (!payment?.categoryId) return '#808080';
  return categoryStore.getCategoryColor(payment.categoryId);
}

// ----- Source Icon Helpers ---------
function getSourceIcon(payment) {
  switch (payment.source) {
    case 'whatsapp-audio': return MdiMicrophone;
    case 'whatsapp-image': return MdiImage;
    case 'whatsapp-pdf': return MdiFilePdfBox;
    default: return MdiWhatsapp;
  }
}

function getSourceLabel(payment) {
  switch (payment.source) {
    case 'whatsapp-audio': return 'Audio de WhatsApp';
    case 'whatsapp-image': return 'Imagen de WhatsApp';
    case 'whatsapp-pdf': return 'PDF de WhatsApp';
    default: return 'Creado via WhatsApp';
  }
}

// ----- Define Refs ---------
const isLoading = ref(true);
const activePaymentId = ref(null);
const editPayment = ref(null);
const newPayment = ref(null);
const paymentDetails = ref(null);
const payments = ref([]);
const monthsOffset = ref(0);
const currentSortOrder = ref({ name: "date", order: "desc" });
const currentSearchQuery = ref("");
const togglingPayment = ref(null); // Track which payment is being toggled
const isReviewMode = ref(false); // Track if edit modal is opened for review

// ----- Define Computed ---------
const currentMonth = computed(() => {
  return $dayjs().subtract(monthsOffset.value, "month").format("MMMM");
});

const currentYear = computed(() => {
  return $dayjs().subtract(monthsOffset.value, "month").format("YYYY");
});

// Determine if we're looking at the current month
const isCurrentMonth = computed(() => monthsOffset.value === 0);

// Calculate totals for the current month
const monthTotals = computed(() => {
  const totals = { paid: 0, unpaid: 0 };

  payments.value.forEach((payment) => {
    if (payment.isPaid) {
      totals.paid += payment.amount;
    } else {
      totals.unpaid += payment.amount;
    }
  });

  return totals;
});

// ----- Define Methods ---------

// Format date
function formatDate(timestamp) {
  if (!timestamp) return "";
  return $dayjs(timestamp.toDate()).format("D [de] MMM, YYYY");
}

// Check if a date is in the past
function isDelayed(timestamp) {
  if (!timestamp) return false;
  return $dayjs(timestamp.toDate()).isBefore($dayjs(), "day");
}

// Change month view
function changeMonth(delta) {
  monthsOffset.value += delta;
  fetchData();
}

// Fetch one-time payments for selected month
async function fetchData() {
  isLoading.value = true;

  try {
    // Get start and end of selected month
    const targetMonth = $dayjs().subtract(monthsOffset.value, "month");
    const startOfMonth = targetMonth.startOf("month").toDate();
    const endOfMonth = targetMonth.endOf("month").toDate();

    // Set up filters for one-time payments in selected month
    const filters = {
      startDate: startOfMonth,
      endDate: endOfMonth,
      paymentType: "one-time"
    };

    await paymentStore.fetchPayments(filters);
    payments.value = [...getPayments.value];

    // Apply current sort order
    applySortOrder(currentSortOrder.value);
  } catch (error) {
    console.error("Error fetching payments:", error);
    useToast("error", "Error al cargar los pagos");
  } finally {
    isLoading.value = false;
  }
}

// Show payment details
function showDetails(paymentId) {
  activePaymentId.value = paymentId;
  paymentDetails.value?.showModal(paymentId);
}

// Show edit payment form
function showEdit(paymentId, reviewMode = false) {
  activePaymentId.value = paymentId;
  isReviewMode.value = reviewMode;
  editPayment.value?.showModal(paymentId);
}

// Show review modal for WhatsApp payments
function showReview(paymentId) {
  showEdit(paymentId, true);
}

// Show new payment modal (from floating button)
function showNewPayment() {
  newPayment.value?.showModal();
}

// Use template to create payment
function useTemplate(template) {
  newPayment.value?.showModal(null, template);
}

// Toggle payment status (paid/unpaid)
async function togglePaymentStatus(paymentId, isPaid) {
  if (togglingPayment.value) return; // Prevent multiple toggles

  togglingPayment.value = paymentId;
  try {
    const result = await paymentStore.togglePaymentStatus(paymentId, isPaid);

    if (result) {
      useToast("success", `Pago marcado como ${isPaid ? "pagado" : "no pagado"}`);

      // Update local state
      const index = payments.value.findIndex((p) => p.id === paymentId);
      if (index !== -1) {
        payments.value[index].isPaid = isPaid;
        payments.value[index].paidDate = isPaid ? new Date() : null;
      }

      // Preserve current sort order after status change
      applySortOrder(currentSortOrder.value);
    } else {
      useToast("error", paymentStore.error || "Error al actualizar el estado del pago");
    }
  } catch (error) {
    console.error("Error toggling payment:", error);
    useToast("error", "Ocurrió un error inesperado");
  } finally {
    togglingPayment.value = null;
  }
}

// Search payments
function searchPayments(query) {
  currentSearchQuery.value = query;

  if (!query) {
    payments.value = [...getPayments.value];
    applySortOrder(currentSortOrder.value);
    return;
  }

  const searchTerm = query.toLowerCase();
  payments.value = getPayments.value.filter((payment) => {
    const categoryName = getDisplayCategoryName(payment).toLowerCase();
    return (
      payment.title.toLowerCase().includes(searchTerm) ||
      (payment.description && payment.description.toLowerCase().includes(searchTerm)) ||
      categoryName.includes(searchTerm) ||
      payment.amount.toString().includes(searchTerm)
    );
  });

  // Reapply current sort order after search
  applySortOrder(currentSortOrder.value);
}

// Order payments by various criteria
function orderPayments(orderCriteria) {
  if (!orderCriteria || !orderCriteria.name) {
    // Reset to default sort (date descending)
    currentSortOrder.value = { name: "date", order: "desc" };
    applySortOrder(currentSortOrder.value);
    return;
  }

  currentSortOrder.value = orderCriteria;
  applySortOrder(orderCriteria);
}

// Apply sort order with custom logic
function applySortOrder(orderCriteria) {
  const { name, order } = orderCriteria;
  const direction = order === "asc" ? 1 : -1;

  payments.value.sort((a, b) => {
    let comparison = 0;

    switch (name) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "date":
        const aDate = a.dueDate ? a.dueDate.toDate() : a.createdAt.toDate();
        const bDate = b.dueDate ? b.dueDate.toDate() : b.createdAt.toDate();
        comparison = aDate - bDate;
        break;
      case "isPaid":
      case "unpaid_first":
        // Sort by paid status first, then by due date
        if (a.isPaid !== b.isPaid) {
          comparison = a.isPaid ? 1 : -1; // Unpaid items first
        } else {
          const aDate = a.dueDate ? a.dueDate.toDate() : a.createdAt.toDate();
          const bDate = b.dueDate ? b.dueDate.toDate() : b.createdAt.toDate();
          comparison = aDate - bDate;
        }
        break;
      case "needs_revision":
        // needsRevision first, then by date
        if (a.needsRevision !== b.needsRevision) {
          comparison = a.needsRevision ? -1 : 1;
        } else {
          const aDate = a.dueDate ? a.dueDate.toDate() : a.createdAt.toDate();
          const bDate = b.dueDate ? b.dueDate.toDate() : b.createdAt.toDate();
          comparison = bDate - aDate;
        }
        return comparison; // Don't multiply by direction for this sort
      default:
        comparison = a.createdAt.toDate() - b.createdAt.toDate();
    }

    return comparison * direction;
  });
}

// ----- Initialize Data ---------
onMounted(async () => {
  // Ensure categories are loaded first
  await categoryStore.fetchCategories();

  await fetchData();

  // Keyboard shortcut: Press 'N' to add new payment
  const handleKeydown = (e) => {
    // Ignore if user is typing in an input/textarea or modal is open
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
      showNewPayment();
    }
  };

  window.addEventListener('keydown', handleKeydown);
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
});

watch(getPayments, () => {
  payments.value = [...getPayments.value];

  // Reapply current sort order when data changes
  applySortOrder(currentSortOrder.value);
}, { deep: true });

// ----- Define Hooks --------
useSeo({
  title: 'Pagos Únicos - PayTrackr',
  description: 'Seguí y gestioná tus pagos y gastos únicos',
  path: '/one-time',
  noindex: true,
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
