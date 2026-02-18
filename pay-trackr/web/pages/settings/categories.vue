<template>
  <div class="categories-page mb-8">
    <!-- Settings Navigation -->
    <SettingsNav />

    <!-- Edit Modal -->
    <Modal ref="editModal" @onClose="resetEditForm">
      <template #header>
        <h2 class="text-xl font-semibold">Editar Categoría</h2>
      </template>

      <template #body>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="edit-name" class="text-sm font-medium text-gray-400">Nombre*</label>
            <input
              id="edit-name"
              v-model="editForm.name"
              type="text"
              @blur="editTouched.name = true"
              class="w-full px-4 py-3 rounded-lg bg-gray-700 border focus:outline-none"
              :class="editTouched.name && !editForm.name ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600 focus:border-primary'"
              placeholder="Nombre de la categoría"
            />
            <span v-if="editTouched.name && !editForm.name" class="text-xs text-red-400">Este campo es obligatorio</span>
          </div>

          <div class="flex flex-col gap-2">
            <label for="edit-color" class="text-sm font-medium text-gray-400">Color</label>
            <div class="flex items-center gap-3">
              <input
                id="edit-color"
                v-model="editForm.color"
                type="color"
                class="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                v-model="editForm.color"
                type="text"
                class="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-primary focus:outline-none uppercase"
                placeholder="#FFFFFF"
                maxlength="7"
              />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <button
          @click="saveEditCategory"
          :disabled="!editForm.name || !editForm.color || isSaving"
          class="btn btn-primary w-full"
        >
          <MdiLoading v-if="isSaving" class="animate-spin mr-2" />
          Guardar Cambios
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialogue
      ref="deleteConfirm"
      message="¿Estás seguro de que querés eliminar esta categoría?"
      textCancelButton="No, cancelar"
      textConfirmButton="Sí, eliminar"
      @confirm="confirmDelete"
    />

    <!-- Page Content -->
    <div class="flex flex-col gap-6 px-3">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-left">Categorías</h1>
          <p class="text-gray-400 text-sm mt-1">Administrá las categorías de tus gastos</p>
        </div>
      </div>

      <!-- Add New Category Form -->
      <div class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-4">
        <h2 class="text-lg font-semibold mb-4">Nueva Categoría</h2>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label for="new-name" class="block text-sm font-medium text-gray-400 mb-2">Nombre*</label>
            <input
              id="new-name"
              v-model="newCategory.name"
              type="text"
              @blur="newTouched.name = true"
              class="w-full px-4 py-3 rounded-lg bg-gray-700 border focus:outline-none"
              :class="newTouched.name && !newCategory.name ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600 focus:border-primary'"
              placeholder="Nombre de la categoría"
            />
            <span v-if="newTouched.name && !newCategory.name" class="text-xs text-red-400">Este campo es obligatorio</span>
          </div>
          <div class="w-full sm:w-auto sm:shrink-0">
            <label for="new-color" class="block text-sm font-medium text-gray-400 mb-2">Color</label>
            <div class="flex items-center gap-2">
              <input
                id="new-color"
                v-model="newCategory.color"
                type="color"
                class="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
              />
              <input
                v-model="newCategory.color"
                type="text"
                class="w-24 px-3 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-primary focus:outline-none uppercase text-sm"
                placeholder="#FFFFFF"
                maxlength="7"
              />
            </div>
          </div>
          <div class="flex flex-col shrink-0">
            <label class="hidden sm:block text-sm font-medium text-gray-400 mb-2 invisible">Acción</label>
            <button
              @click="addCategory"
              :disabled="!newCategory.name || !newCategory.color || isAdding"
              class="btn-primary flex items-center justify-center cursor-pointer !py-0 !h-12 whitespace-nowrap"
            >
              <MdiLoading v-if="isAdding" class="animate-spin mr-2" />
              <MdiPlus v-else class="mr-2" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col gap-4 skeleton-shimmer">
        <div v-for="i in 5" :key="i" class="h-16 w-full bg-gray-700 rounded-lg"></div>
      </div>

      <!-- Categories List -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="category in categories"
          :key="category.id"
          class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-4 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-lg shrink-0 border border-gray-500"
              :style="{ backgroundColor: category.color }"
            ></div>
            <span class="font-medium">{{ category.name }}</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="openEditModal(category)"
              class="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-600/50 transition-colors"
              title="Editar"
            >
              <MdiPencil />
            </button>
            <button
              @click="openDeleteConfirm(category)"
              class="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
              title="Eliminar"
            >
              <MdiDelete />
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="categories.length === 0" class="py-10 text-center text-gray-500">
          <MdiTagOff class="text-5xl mx-auto mb-3 opacity-30" />
          <p>No hay categorías</p>
          <p class="text-sm mt-1">Agregá una categoría usando el formulario de arriba</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import MdiPlus from "~icons/mdi/plus";
import MdiPencil from "~icons/mdi/pencil";
import MdiDelete from "~icons/mdi/delete";
import MdiLoading from "~icons/mdi/loading";
import MdiTagOff from "~icons/mdi/tag-off";

definePageMeta({
  middleware: ["auth"]
});

// ----- Stores ---------
const categoryStore = useCategoryStore();
const { getCategories, isLoading: storeLoading } = storeToRefs(categoryStore);

// ----- Refs ---------
const editModal = ref(null);
const deleteConfirm = ref(null);
const isLoading = ref(true);
const isAdding = ref(false);
const isSaving = ref(false);
const categoryToDelete = ref(null);

const newCategory = ref({
  name: '',
  color: '#808080'
});
const newTouched = ref({ name: false });

const editForm = ref({
  id: '',
  name: '',
  color: ''
});
const editTouched = ref({ name: false });

// ----- Computed ---------
const categories = computed(() => getCategories.value);

// ----- Methods ---------
async function addCategory() {
  if (!newCategory.value.name || !newCategory.value.color) return;

  isAdding.value = true;

  const result = await categoryStore.createCategory(
    newCategory.value.name,
    newCategory.value.color
  );

  isAdding.value = false;

  if (result) {
    useToast("success", "Categoría creada correctamente");
    // Reset form
    newCategory.value = {
      name: '',
      color: '#808080'
    };
    newTouched.value = { name: false };
  } else {
    useToast("error", categoryStore.error || "Error al crear la categoría");
  }
}

function openEditModal(category) {
  editForm.value = {
    id: category.id,
    name: category.name,
    color: category.color
  };
  editTouched.value = { name: false };
  editModal.value.showModal();
}

function resetEditForm() {
  editForm.value = {
    id: '',
    name: '',
    color: ''
  };
}

async function saveEditCategory() {
  if (!editForm.value.name || !editForm.value.color) return;

  isSaving.value = true;

  const result = await categoryStore.updateCategory(editForm.value.id, {
    name: editForm.value.name,
    color: editForm.value.color
  });

  isSaving.value = false;

  if (result) {
    useToast("success", "Categoría actualizada correctamente");
    editModal.value.closeModal();
  } else {
    useToast("error", categoryStore.error || "Error al actualizar la categoría");
  }
}

function openDeleteConfirm(category) {
  categoryToDelete.value = category;
  deleteConfirm.value.open();
}

async function confirmDelete() {
  if (!categoryToDelete.value) return;

  const result = await categoryStore.deleteCategory(categoryToDelete.value.id);

  if (result) {
    useToast("success", "Categoría eliminada correctamente");
  } else {
    useToast("error", categoryStore.error || "Error al eliminar la categoría");
  }

  categoryToDelete.value = null;
}

// ----- Initial Data Load ---------
onMounted(async () => {
  await categoryStore.fetchCategories();
  isLoading.value = false;
});

// ----- Meta ---------
useSeo({
  title: 'Categorías - PayTrackr',
  description: 'Administrá las categorías de tus gastos',
  path: '/settings/categories',
  noindex: true,
});
</script>

<style scoped>
/* Fix color input browser defaults */
input[type="color"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 0;
  border: none;
  background: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
}

input[type="color"]::-moz-color-swatch {
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
}
</style>
