<template>
  <div>
    <Modal ref="modal">
      <template #header>
        <div class="flex items-center">
          <div v-if="isLoading" class="w-3 h-14 rounded-full mr-3 bg-gray-700 animate-pulse"></div>
          <div
            v-else-if="form.categoryId"
            class="w-3 h-14 rounded-full mr-3"
            :style="{ backgroundColor: getCategoryColor(form.categoryId) }"
          ></div>
          <div>
            <h2 class="text-xl font-bold">
              {{ props.isReview ? "Revisar" : (isEdit ? "Editar" : "Crear") }} Pago {{ isRecurrent ? "Fijo" : "Único" }}
            </h2>
            <p class="text-sm text-gray-500" v-if="isEdit && form.title">{{ form.title }}</p>
            <p class="text-xs text-green-400 flex items-center gap-1 mt-1" v-if="props.isReview">
              <span class="inline-block w-2 h-2 rounded-full bg-green-400"></span>
              Creado via WhatsApp
            </p>
            <p class="text-xs text-green-400 flex items-center gap-1 mt-1" v-else-if="paymentsCreatedCount > 0 && !isEdit">
              <MdiCheck class="text-sm" />
              {{ paymentsCreatedCount }} {{ paymentsCreatedCount === 1 ? 'pago creado' : 'pagos creados' }}
            </p>
          </div>
        </div>
      </template>

      <template #body>
        <div v-if="isLoading" class="flex justify-center items-center min-h-[200px]">
          <Loader />
        </div>

        <form v-else @submit.prevent="savePayment" class="space-y-6">
          <!-- Quick Templates (only for new one-time payments) -->
          <div v-if="!props.isEdit && !props.isRecurrent && templates.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Agregar Rápido</span>
              <button
                v-if="templates.length > 4"
                type="button"
                @click="templatesExpanded = !templatesExpanded"
                class="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                {{ templatesExpanded ? 'Colapsar' : 'Expandir' }}
                <svg
                  class="w-3 h-3 transition-transform duration-300"
                  :class="{ 'rotate-180': templatesExpanded }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Templates Container -->
            <div
              class="overflow-hidden transition-all duration-300 ease-out"
              :style="{ maxHeight: templatesExpanded ? '500px' : '42px' }"
            >
              <div
                class="flex flex-wrap gap-2"
                :class="{ 'flex-nowrap overflow-x-auto scrollbar-hide': !templatesExpanded }"
              >
                <button
                  v-for="template in templates"
                  :key="template.id"
                  type="button"
                  @click="selectTemplate(template)"
                  class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full border-2 transition-all duration-200 hover:scale-105"
                  :style="getTemplateStyle(template.categoryId, currentTemplate?.id === template.id)"
                >
                  {{ template.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Payment Title & Description -->
          <div class="space-y-2">
            <label for="title" class="block text-sm font-medium text-gray-400">Título del Pago*</label>
            <input
              id="title"
              ref="titleInput"
              v-model="form.title"
              type="text"
              :disabled="props.isRecurrent"
              required
              @blur="touched.title = true"
              class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              :class="touched.title && !form.title ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
              placeholder="ej. Suscripción Netflix"
            />
            <span v-if="touched.title && !form.title" class="text-xs text-red-400">Este campo es obligatorio</span>
          </div>

          <div class="space-y-2" v-if="!props.isRecurrent">
            <button
              type="button"
              @click="showDescription = !showDescription"
              class="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
            >
              <span>{{ showDescription ? '− Ocultar' : '+ Agregar' }} Descripción</span>
            </button>
            <textarea
              v-if="showDescription"
              id="description"
              v-model="form.description"
              class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Agregá detalles sobre este pago"
              rows="2"
            ></textarea>
          </div>

          <!-- Recipient Info (from transfer) -->
          <div v-if="form.recipient" class="rounded-lg bg-gray-800/50 border border-gray-700 p-3 space-y-1.5">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Datos del destinatario</span>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div v-if="form.recipient.name">
                <span class="text-gray-500">Nombre:</span>
                <span class="text-gray-300 ml-1">{{ form.recipient.name }}</span>
              </div>
              <div v-if="form.recipient.bank">
                <span class="text-gray-500">Banco:</span>
                <span class="text-gray-300 ml-1">{{ form.recipient.bank }}</span>
              </div>
              <div v-if="form.recipient.alias" class="col-span-2">
                <span class="text-gray-500">Alias:</span>
                <span class="text-gray-300 ml-1">{{ form.recipient.alias }}</span>
              </div>
              <div v-if="form.recipient.cbu" class="col-span-2">
                <span class="text-gray-500">CBU:</span>
                <span class="text-gray-300 ml-1 font-mono text-xs">{{ form.recipient.cbu }}</span>
              </div>
            </div>
          </div>

          <!-- Audio Transcription -->
          <div v-if="form.audioTranscription" class="rounded-lg bg-gray-800/50 border border-gray-700 p-3 space-y-1.5">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Transcripcion del audio</span>
            <p class="text-sm text-gray-300 italic">"{{ form.audioTranscription }}"</p>
          </div>

          <!-- Amount & Category -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="amount" class="block text-sm font-medium text-gray-400">Monto*</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                <input
                  id="amount"
                  ref="amountInput"
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

            <div class="space-y-2" v-if="!props.isRecurrent">
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

          <!-- One-time Payment Fields -->
          <div class="space-y-2" v-if="!props.isRecurrent && !props.isEdit">
            <label for="dueDate" class="block text-sm font-medium text-gray-400">Fecha de Pago*</label>
            <input
              id="dueDate"
              v-model="form.dueDate"
              type="date"
              @blur="touched.dueDate = true"
              required
              class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              :class="touched.dueDate && !form.dueDate ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
            />
            <span v-if="touched.dueDate && !form.dueDate" class="text-xs text-red-400">Este campo es obligatorio</span>
          </div>

          <!-- Save as Template Option (only on creation) -->
          <div v-if="!props.isRecurrent && !props.isEdit" class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="saveAsTemplate"
                class="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span class="text-sm font-medium text-gray-400">Guardar como plantilla</span>
            </label>
          </div>

          <!-- Edit mode: Show all fields -->
          <div v-if="!props.isRecurrent && props.isEdit" class="space-y-4">
            <div class="space-y-2">
              <label for="dueDate" class="block text-sm font-medium text-gray-400">Fecha de Vencimiento*</label>
              <input
                id="dueDate"
                v-model="form.dueDate"
                type="date"
                @blur="touched.dueDate = true"
                required
                class="w-full p-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                :class="touched.dueDate && !form.dueDate ? 'border-red-500 ring-2 ring-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-primary'"
              />
              <span v-if="touched.dueDate && !form.dueDate" class="text-xs text-red-400">Este campo es obligatorio</span>
            </div>

            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="form.isPaid"
                  class="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
                />
                <span class="text-sm font-medium text-gray-400">Marcar como pagado</span>
              </label>

              <div v-if="form.isPaid" class="mt-2">
                <label for="paidDate" class="block text-sm font-medium text-gray-400">Fecha de Pago</label>
                <input
                  id="paidDate"
                  v-model="form.paidDate"
                  type="date"
                  class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <!-- Mark as pending for later review (WhatsApp payments only) -->
            <div v-if="form.isWhatsapp && form.status === 'reviewed' && !isSubmitting" class="space-y-2">
              <label class="block text-sm font-medium text-gray-400">Revisión</label>
              <button
                type="button"
                @click="markAsPending"
                class="w-full p-2 text-sm text-warning bg-warning/20 hover:bg-warning/30 border border-warning/30 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <MdiClockOutline class="text-base text-warning" />
                <span>Revisar después</span>
              </button>
              <p class="text-xs text-gray-500">El pago volverá a aparecer como pendiente de revisión</p>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <!-- Review Mode Footer -->
        <div v-if="props.isReview" class="flex justify-end w-full">
          <button
            @click="markAsReviewed"
            class="px-5 py-2.5 bg-success text-white rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2 font-medium"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <MdiCheck v-else class="text-lg" />
            <span>Todo perfecto</span>
          </button>
        </div>

        <!-- Normal Footer -->
        <div v-else class="flex justify-between w-full">
          <button
            @click="closeModal"
            class="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {{ paymentsCreatedCount > 0 && !isEdit ? 'Listo' : 'Cancelar' }}
          </button>

          <div class="flex space-x-2">
            <button
              v-if="isEdit"
              @click="confirmDelete"
              class="px-4 py-2 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
            >
              Eliminar
            </button>

            <button
              @click="savePayment"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              :class="{ 'bg-green-600 hover:bg-green-700': justSaved }"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <span
                  class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                ></span>
                Guardando...
              </span>
              <span v-else-if="justSaved" class="flex items-center gap-1">
                <MdiCheck class="text-lg" />
                Creado
              </span>
              <span v-else>{{ isEdit ? "Actualizar" : "Crear" }}</span>
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <ConfirmDialogue
      ref="confirmDialog"
      :message="`¿Estás seguro que querés eliminar ${form.title}?`"
      textConfirmButton="Eliminar"
      @confirm="deletePayment"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { getCurrentUser } from "~/utils/firebase";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import MdiClockOutline from "~icons/mdi/clock-outline";
import MdiCheck from "~icons/mdi/check";

const props = defineProps({
  paymentId: {
    type: String,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  isRecurrent: {
    type: Boolean,
    default: false
  },
  isReview: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["onClose", "onCreated"]);

// ----- Define Stores (must be before computed properties that use them) ---------
const recurrentStore = useRecurrentStore();
const paymentStore = usePaymentStore();
const templateStore = useTemplateStore();
const categoryStore = useCategoryStore();
const { getTemplatesSorted: templates } = storeToRefs(templateStore);
const { getCategories: categories } = storeToRefs(categoryStore);

// ----- Define Refs ---------
const modal = ref(null);
const confirmDialog = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Store last used values at component level
const lastUsedCategoryId = ref('');
const lastUsedDueDate = ref('');

// Get default category ID (first category or empty)
const defaultCategoryId = computed(() => {
  if (lastUsedCategoryId.value) return lastUsedCategoryId.value;
  // Find "Otros" category or use first available
  const otrosCategory = categories.value.find(c => c.name === 'Otros');
  return otrosCategory?.id || categories.value[0]?.id || '';
});

// Default form state
const defaultForm = computed(() => {
  const { $dayjs } = useNuxtApp();
  const today = $dayjs().format("YYYY-MM-DD");

  if (props.isRecurrent) {
    return {
      title: "",
      amount: ""
    };
  } else {
    return {
      title: "",
      description: "",
      amount: "",
      categoryId: defaultCategoryId.value,
      dueDate: lastUsedDueDate.value || today,
      isPaid: true, // Always mark as paid on creation
      paidDate: lastUsedDueDate.value || today, // Set paidDate same as dueDate
      paymentType: "one-time",
      isWhatsapp: false,
      status: "reviewed"
    };
  }
});

const form = ref({ ...defaultForm.value });
const touched = ref({ title: false, amount: false, categoryId: false, dueDate: false });
const showDescription = ref(false);
const saveAsTemplate = ref(false);
const amountInput = ref(null);
const titleInput = ref(null);
const currentTemplate = ref(null); // Track if opened from template
const templatesExpanded = ref(false);
const paymentsCreatedCount = ref(0);
const justSaved = ref(false);

// ----- Define Methods ---------
async function showModal(paymentId = null, templateData = null) {
  // Store template for "Add Another" functionality
  currentTemplate.value = templateData;

  // Fetch categories if not already loaded
  categoryStore.fetchCategories();

  // Fetch templates if not already loaded (for quick templates in modal)
  if (!props.isRecurrent && !paymentId) {
    templateStore.fetchTemplates();
  }

  if (paymentId) {
    fetchPaymentDetails(paymentId);
  } else if (templateData) {
    // Pre-fill from template
    applyTemplate(templateData);
  } else {
    // Reset form when creating new payment
    form.value = { ...defaultForm.value };
    showDescription.value = false;
    saveAsTemplate.value = false;
  }

  touched.value = { title: false, amount: false, categoryId: false, dueDate: false };
  templatesExpanded.value = false;
  paymentsCreatedCount.value = 0;
  justSaved.value = false;
  modal.value?.open();
}

function applyTemplate(templateData) {
  const { $dayjs } = useNuxtApp();
  const dueDate = lastUsedDueDate.value || $dayjs().format("YYYY-MM-DD");

  form.value = {
    title: templateData.name,
    description: templateData.description || "",
    amount: "",
    categoryId: templateData.categoryId || defaultCategoryId.value,
    dueDate: dueDate,
    isPaid: true,
    paidDate: dueDate,
    paymentType: "one-time",
    isWhatsapp: false,
    status: "reviewed"
  };

  showDescription.value = !!templateData.description;
  saveAsTemplate.value = false;

  // Focus on amount field after modal opens
  nextTick(() => {
    amountInput.value?.focus();
  });
}

function selectTemplate(template) {
  currentTemplate.value = template;
  applyTemplate(template);
  templateStore.incrementUsage(template.id);
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

// Get category color by ID from store
function getCategoryColor(categoryId) {
  if (!categoryId) return '#808080';
  return categoryStore.getCategoryColor(categoryId);
}

// Get template button style based on categoryId
function getTemplateStyle(categoryId, isActive) {
  const color = getCategoryColor(categoryId);

  if (isActive) {
    return {
      borderColor: color,
      backgroundColor: color,
      color: 'white',
      boxShadow: `0 10px 15px -3px ${color}4D`
    };
  }

  return {
    borderColor: color,
    backgroundColor: `${color}1A`,
    color: color
  };
}

function closeModal() {
  currentTemplate.value = null;
  paymentsCreatedCount.value = 0;
  justSaved.value = false;
  modal.value?.close();
  emit("onClose");
}

// In the fetchPaymentDetails function
async function fetchPaymentDetails(paymentId) {
  isLoading.value = true;

  try {
    if (props.isRecurrent) {
      // Get recurrent payment
      const payment = recurrentStore.getPaymentInstances.find((p) => p.id === paymentId);

      if (payment) {
        form.value = {
          title: payment.title || "",
          amount: formatAmountForInput(payment.amount)
        };
      }
    } else {
      // Get regular payment
      const payment = await paymentStore.getPaymentById(paymentId);

      if (payment) {
        const { $dayjs } = useNuxtApp();

        // Use dueDate if available, otherwise fall back to createdAt
        const dueDate = payment.dueDate
          ? $dayjs(payment.dueDate.toDate()).format("YYYY-MM-DD")
          : payment.createdAt
          ? $dayjs(payment.createdAt.toDate()).format("YYYY-MM-DD")
          : "";

        const paidDate = payment.paidDate
          ? $dayjs(payment.paidDate.toDate()).format("YYYY-MM-DD")
          : $dayjs().format("YYYY-MM-DD");

        form.value = {
          title: payment.title || "",
          description: payment.description || "",
          amount: formatAmountForInput(payment.amount),
          categoryId: payment.categoryId || defaultCategoryId.value,
          dueDate: dueDate,
          isPaid: payment.isPaid || true,
          paidDate: paidDate,
          paymentType: payment.paymentType || "one-time",
          isWhatsapp: payment.isWhatsapp || false,
          status: payment.status || "reviewed",
          needsRevision: payment.needsRevision || false,
          source: payment.source || 'manual',
          recipient: payment.recipient || null,
          audioTranscription: payment.audioTranscription || null
        };

        // Show description if it has content
        showDescription.value = !!payment.description;
      }
    }
  } catch (error) {
    console.error("Error fetching payment details:", error);
    useToast("error", "Error al cargar los detalles del pago");
  } finally {
    isLoading.value = false;
  }
}

async function savePayment() {
  const user = getCurrentUser();
  if (!user) {
    useToast("error", "Debés iniciar sesión para guardar pagos");
    return;
  }

  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    let result;

    // Handle one-time payment save/update
    const { $dayjs } = useNuxtApp();

    // Save last used values to component state (only on creation, not edit)
    if (!props.isEdit && !props.isRecurrent) {
      lastUsedCategoryId.value = form.value.categoryId;
      lastUsedDueDate.value = form.value.dueDate;
    }

    let paymentData = {
      title: form.value.title,
      description: form.value.description,
      amount: parseAmount(form.value.amount),
      categoryId: form.value.categoryId,
      isPaid: form.value.isPaid,
      paidDate: form.value.isPaid ? Timestamp.fromDate($dayjs(form.value.paidDate).toDate()) : null,
      dueDate: Timestamp.fromDate($dayjs(form.value.dueDate).toDate()),
      recurrentId: null,
      paymentType: "one-time",
      isWhatsapp: form.value.isWhatsapp || false,
      status: form.value.status || 'reviewed',
      needsRevision: false
    };

    if (props.isRecurrent) {
      paymentData = {
        title: form.value.title,
        amount: parseAmount(form.value.amount)
      };
    }

    if (props.isRecurrent && !props.isEdit) {
      useToast("error", "Los pagos fijos no se pueden crear desde este formulario");
      isSubmitting.value = false;
      return;
    }

    if (props.isEdit && props.paymentId) {
      // Update existing payment
      result = await paymentStore.updatePayment(props.paymentId, paymentData);

      if (result) {
        useToast("success", props.isReview ? "Pago revisado correctamente" : "Pago actualizado correctamente");
        emit("onCreated");
        closeModal();
      } else {
        useToast("error", paymentStore.error || "Error al actualizar el pago");
      }
    } else {
      // Create new payment
      result = await paymentStore.createPayment({
        ...paymentData,
        userId: user.uid
      });

      if (result && result.success) {
        useToast("success", "Pago creado correctamente");
        emit("onCreated");

        // Save as template if checkbox is checked
        if (saveAsTemplate.value) {
          const templateData = {
            name: form.value.title,
            categoryId: form.value.categoryId,
            ...(form.value.description && { description: form.value.description })
          };

          await templateStore.createTemplate(templateData);
        }

        // Track created count and show brief success state on button
        paymentsCreatedCount.value++;
        justSaved.value = true;
        setTimeout(() => { justSaved.value = false; }, 1500);

        // Auto-clear form for next payment (keep date & category)
        touched.value = { title: false, amount: false, categoryId: false, dueDate: false };
        saveAsTemplate.value = false;
        showDescription.value = false;

        if (currentTemplate.value) {
          applyTemplate(currentTemplate.value);
        } else {
          form.value = { ...defaultForm.value };
          nextTick(() => {
            titleInput.value?.focus();
          });
        }
      } else {
        useToast("error", paymentStore.error || "Error al crear el pago");
      }
    }
  } catch (error) {
    console.error("Error saving payment:", error);
    useToast("error", "Ocurrió un error inesperado");
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDelete() {
  confirmDialog.value.open();
}

async function deletePayment() {
  isSubmitting.value = true;

  try {
    const result = await paymentStore.deletePayment(props.paymentId);

    if (result) {
      useToast("success", "Pago eliminado correctamente");
      emit("onCreated");
      closeModal();
    } else {
      useToast("error", paymentStore.error || "Error al eliminar el pago");
    }
  } catch (error) {
    console.error("Error deleting payment:", error);
    useToast("error", "Ocurrió un error inesperado");
  } finally {
    isSubmitting.value = false;
  }
}

// Mark WhatsApp payment as reviewed without changes - uses same logic as savePayment
async function markAsReviewed() {
  if (isSubmitting.value || !props.paymentId) return;

  // Just call savePayment with status set to reviewed - form data is already loaded
  form.value.status = 'reviewed';
  await savePayment();
}

// Mark WhatsApp payment as pending for later review
async function markAsPending() {
  if (isSubmitting.value || !props.paymentId) return;

  form.value.status = 'pending';
  await savePayment();
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

<style scoped>
.form-checkbox {
  @apply text-primary border-gray-600 rounded;
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
