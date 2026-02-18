<template>
  <div v-if="templates.length > 0" class="px-3 mb-4">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-medium text-gray-400">Quick Templates</h3>
      <span class="text-xs text-gray-500 opacity-60 hidden sm:inline">Right click to delete</span>
      <span class="text-xs text-gray-500 opacity-60 inline sm:hidden">Swipe left to delete</span>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <div
        v-for="template in sortedTemplates"
        :key="template.id"
        class="flex-shrink-0 relative"
      >
        <!-- Wrapper with border to maintain consistent styling -->
        <div class="relative overflow-hidden rounded-full border-2" :class="getBorderClass(template.category)">
          <!-- Delete button (revealed by swipe) -->
          <div
            class="absolute inset-0 flex items-center justify-end bg-gray-800/95 rounded-full"
            :style="{
              opacity: swipedTemplateId === template.id ? '1' : '0',
              pointerEvents: swipedTemplateId === template.id ? 'auto' : 'none'
            }"
          >
            <button
              v-if="swipedTemplateId === template.id"
              @click.stop="confirmDeleteTemplate(template)"
              class="text-danger pr-6 pl-4 flex items-center"
            >
              <MdiTrashCanOutline class="text-xl" />
            </button>
          </div>

          <!-- Template button -->
          <button
            @click="handleTemplateClick(template)"
            @touchstart="handleTouchStart($event, template)"
            @touchmove="handleTouchMove($event, template)"
            @touchend="handleTouchEnd($event, template)"
            @contextmenu.prevent="confirmDeleteTemplate(template)"
            class="relative px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 w-full border-r-2 border-r-danger/20"
            :class="getCategoryButtonClass(template.category)"
            :style="{
              transform: swipedTemplateId === template.id ? 'translateX(-80px)' : 'translateX(0)',
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }"
          >
            <div class="flex items-center gap-2 justify-center">
              <span>{{ template.name }}</span>
              <span v-if="template.usageCount > 0" class="text-xs opacity-70">
                {{ template.usageCount }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialogue
      ref="confirmDialog"
      :message="`Are you sure you want to delete '${templateToDelete?.name}'?`"
      textConfirmButton="Delete"
      @confirm="deleteTemplate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import MdiTrashCanOutline from "~icons/mdi/trash-can-outline";

const emit = defineEmits(["useTemplate"]);

// ----- Define Stores ---------
const templateStore = useTemplateStore();
const { getTemplatesSorted: templates } = storeToRefs(templateStore);

// ----- Define Refs ---------
const confirmDialog = ref(null);
const templateToDelete = ref(null);
const swipedTemplateId = ref(null);
const touchStartX = ref(0);
const touchCurrentX = ref(0);
const isDragging = ref(false);

// ----- Define Computed ---------
const sortedTemplates = computed(() => templates.value);

// ----- Define Methods ---------
function handleTouchStart(event, template) {
  touchStartX.value = event.touches[0].clientX;
  touchCurrentX.value = event.touches[0].clientX;
  isDragging.value = false;
}

function handleTouchMove(event, template) {
  touchCurrentX.value = event.touches[0].clientX;
  const diff = touchStartX.value - touchCurrentX.value;

  // Only consider it a swipe if moved more than 10px
  if (Math.abs(diff) > 10) {
    isDragging.value = true;
  }
}

function handleTouchEnd(event, template) {
  const swipeDistance = touchStartX.value - touchCurrentX.value;

  // Swipe left (show delete) - threshold of 50px
  if (swipeDistance > 50) {
    swipedTemplateId.value = template.id;
  }
  // Swipe right (hide delete)
  else if (swipeDistance < -30) {
    swipedTemplateId.value = null;
  }
  // Tap (no significant swipe) - close any open swipe
  else if (!isDragging.value) {
    // This is a tap, will be handled by handleTemplateClick
    if (swipedTemplateId.value === template.id) {
      swipedTemplateId.value = null;
    }
  }

  isDragging.value = false;
  touchStartX.value = 0;
  touchCurrentX.value = 0;
}

function handleTemplateClick(template) {
  // If this template is swiped open, close it instead of using it
  if (swipedTemplateId.value === template.id) {
    swipedTemplateId.value = null;
    return;
  }

  // If another template is swiped open, close it
  if (swipedTemplateId.value) {
    swipedTemplateId.value = null;
    return;
  }

  // Normal click - use the template
  useTemplate(template);
}

function useTemplate(template) {
  emit("useTemplate", template);
  templateStore.incrementUsage(template.id);
}

function confirmDeleteTemplate(template) {
  templateToDelete.value = template;
  confirmDialog.value?.open();
}

async function deleteTemplate() {
  if (!templateToDelete.value) return;

  const result = await templateStore.deleteTemplate(templateToDelete.value.id);

  if (result) {
    useToast("success", "Template deleted successfully");
  } else {
    useToast("error", "Failed to delete template");
  }

  templateToDelete.value = null;
}

function getBorderClass(category) {
  switch(category.toLowerCase()) {
    case 'housing':
      return 'border-[#4682B4]';
    case 'utilities':
      return 'border-[#0072DF]';
    case 'food':
      return 'border-[#1D9A38]';
    case 'dining':
      return 'border-[#FF6347]';
    case 'transport':
      return 'border-[#E6AE2C]';
    case 'entertainment':
      return 'border-[#6158FF]';
    case 'health':
      return 'border-[#E84A8A]';
    case 'fitness':
      return 'border-[#FF4500]';
    case 'personal_care':
      return 'border-[#DDA0DD]';
    case 'pet':
      return 'border-[#3CAEA3]';
    case 'clothes':
      return 'border-[#800020]';
    case 'traveling':
      return 'border-[#FF8C00]';
    case 'education':
      return 'border-[#9370DB]';
    case 'subscriptions':
      return 'border-[#20B2AA]';
    case 'gifts':
      return 'border-[#FF1493]';
    case 'taxes':
      return 'border-[#8B4513]';
    case 'other':
    default:
      return 'border-[#808080]';
  }
}

function getCategoryButtonClass(category) {
  switch(category.toLowerCase()) {
    case 'housing':
      return 'bg-[#4682B4]/10 text-[#4682B4] hover:bg-[#4682B4]/20';
    case 'utilities':
      return 'bg-[#0072DF]/10 text-[#0072DF] hover:bg-[#0072DF]/20';
    case 'food':
      return 'bg-[#1D9A38]/10 text-[#1D9A38] hover:bg-[#1D9A38]/20';
    case 'dining':
      return 'bg-[#FF6347]/10 text-[#FF6347] hover:bg-[#FF6347]/20';
    case 'transport':
      return 'bg-[#E6AE2C]/10 text-[#E6AE2C] hover:bg-[#E6AE2C]/20';
    case 'entertainment':
      return 'bg-[#6158FF]/10 text-[#6158FF] hover:bg-[#6158FF]/20';
    case 'health':
      return 'bg-[#E84A8A]/10 text-[#E84A8A] hover:bg-[#E84A8A]/20';
    case 'fitness':
      return 'bg-[#FF4500]/10 text-[#FF4500] hover:bg-[#FF4500]/20';
    case 'personal_care':
      return 'bg-[#DDA0DD]/10 text-[#DDA0DD] hover:bg-[#DDA0DD]/20';
    case 'pet':
      return 'bg-[#3CAEA3]/10 text-[#3CAEA3] hover:bg-[#3CAEA3]/20';
    case 'clothes':
      return 'bg-[#800020]/10 text-[#800020] hover:bg-[#800020]/20';
    case 'traveling':
      return 'bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00]/20';
    case 'education':
      return 'bg-[#9370DB]/10 text-[#9370DB] hover:bg-[#9370DB]/20';
    case 'subscriptions':
      return 'bg-[#20B2AA]/10 text-[#20B2AA] hover:bg-[#20B2AA]/20';
    case 'gifts':
      return 'bg-[#FF1493]/10 text-[#FF1493] hover:bg-[#FF1493]/20';
    case 'taxes':
      return 'bg-[#8B4513]/10 text-[#8B4513] hover:bg-[#8B4513]/20';
    case 'other':
    default:
      return 'bg-[#808080]/10 text-[#808080] hover:bg-[#808080]/20';
  }
}

// ----- Initialize Data ---------
onMounted(async () => {
  await templateStore.fetchTemplates();
});
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
