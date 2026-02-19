<template>
  <div class="mb-4 p-3">
    <div v-if="actionRunning" class="flex justify-center my-2">
      <Loader />
    </div>
    
    <div class="flex flex-col sm:flex-row w-full justify-between items-center gap-3 px-1">
      <!-- Search Bar -->
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IcSharpSearch class="text-gray-400 text-lg" />
          </div>
          <input
            type="text"
            @input="(value) => $emit('onSearch', value.target.value)"
            class="w-full h-10 rounded-md bg-base border border-gray-600 pl-10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Buscar pagos..."
          >
        </div>
        
        <!-- Filter Button -->
        <Tooltip ref="tooltipFilter">
          <button
            class="h-10 w-10 flex items-center justify-center bg-base hover:bg-gray-700 rounded-md border border-gray-600 text-white transition-colors"
            @click="toggleTooltip"
            aria-label="Opciones de filtro"
          >
            <MdiFilterOutline class="text-xl" />
          </button>
          
          <!-- Filter Dropdown Content -->
          <template #content>
            <div class="bg-base border border-gray-600 rounded-lg shadow-lg overflow-hidden">
              <div
                v-for="filter in filters"
                :key="filter.name"
                @click="selectFilter(filter)"
                :class="[
                  'flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700 transition-colors', 
                  selectedFilter.name === filter.name ? 'bg-gray-700' : '',
                  filter.class
                ]"
              >
                <div class="flex items-center gap-2">
                  <component :is="filter.icon" class="text-primary text-lg" /> 
                  <span class="text-white">{{ filter.label }}</span>
                </div>
                <div v-if="selectedFilter.name === filter.name" class="flex items-center gap-1">
                  <span class="text-primary text-xs whitespace-nowrap">{{ getSortLabel(filter.name, selectedFilter.order) }}</span>
                  <MingcuteArrowUpFill
                    class="text-primary text-lg"
                    :class="selectedFilter.order === 'desc' ? 'rotate-180' : ''"
                  />
                </div>
              </div>
            </div>
          </template>
        </Tooltip>
      </div>
      
      <!-- Could add additional elements here if needed -->
    </div>
  </div>
</template>

<script setup>
// Keep existing script code
import TablerCalendarFilled from '~icons/tabler/calendar-filled';
import MaterialSymbolsPaidRounded from '~icons/material-symbols/paid-rounded';
import MdiFilterOutline from '~icons/mdi/filter-outline';
import IcSharpSearch from '~icons/ic/sharp-search';
import MingcuteArrowUpFill from '~icons/mingcute/arrow-up-fill';
import BiAlphabet from '~icons/bi/alphabet';
import MdiSortBoolAscendingVariant from '~icons/mdi/sort-bool-ascending-variant';
import MdiAlertCircleOutline from '~icons/mdi/alert-circle-outline';

const props = defineProps({
  showDates: {
    required: false,
    default: false,
    type: Boolean
  },
  initialSort: {
    required: false,
    default: () => ({ name: '', order: '' }),
    type: Object
  }
});

const emits = defineEmits(['onOrder', 'monthsBack']); 

// ----- Define Useful Properties ---------
const { width } = useWindowSize();

// ----- Define Vars ------
const actionRunning = ref(false);
const selectedFilter = ref({ name: props.initialSort.name || '', order: props.initialSort.order || '' });

// Refs
const tooltipFilter = ref(null);

// ----- Define Methods ------
function toggleTooltip() {
  if (tooltipFilter.value) {
    tooltipFilter.value.toggleTooltip();
  }
}

const filters = [
  { name: 'unpaid_first', label: 'No pagados', icon: MdiSortBoolAscendingVariant, class: 'rounded-t-lg' },
  { name: 'needs_revision', label: 'Por revisar', icon: MdiAlertCircleOutline, class: '' },
  { name: 'date', label: 'Fecha', icon: TablerCalendarFilled, class: '' },
  { name: 'amount', label: 'Monto', icon: MaterialSymbolsPaidRounded, class: '' },
  { name: 'title', label: 'Título', icon: BiAlphabet, class: 'rounded-b-lg' }
];

function getSortLabel(filterName, order) {
  const labels = {
    amount: { asc: 'Menor-Mayor', desc: 'Mayor-Menor' },
    date: { asc: 'Mas antiguo', desc: 'Mas reciente' },
    title: { asc: 'A-Z', desc: 'Z-A' },
    unpaid_first: { asc: 'No pagados', desc: 'Pagados' },
    needs_revision: { asc: 'Por revisar', desc: 'Revisados' }
  };
  return labels[filterName]?.[order] || '';
}

function selectFilter(filter) {
  if (selectedFilter.value.name === filter.name && selectedFilter.value.order === 'asc') {
    selectedFilter.value.order = 'desc';
  } else if (selectedFilter.value.name === filter.name) {
    selectedFilter.value.name = '';
    selectedFilter.value.order = '';
  } else {
    selectedFilter.value.name = filter.name;
    selectedFilter.value.order = 'asc';
  }

  // Emit current filter configuration
  emits("onOrder", selectedFilter.value);
}
</script>