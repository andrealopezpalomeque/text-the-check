<template>
    <div class="relative">
        <slot></slot>
        <div v-if="isOpen" ref="tooltipBody" class="absolute z-[25] right-0 sm:left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg shadow-black/30 min-w-[18rem] max-w-[30rem] max-h-[13rem]">
            <slot name="content"></slot>
        </div>
    </div>
</template>

<script setup>

// ----- Define Useful Properties ---------

// ----- Define Vars ------
const isOpen = ref(false);

// Refs
const tooltipBody = ref(null);

onClickOutside(tooltipBody, () => {
    isOpen.value = false;
});

// ----- Define Methods ------
function toggleTooltip() {
    isOpen.value = !isOpen.value;
}


// ----- Define Expose ------
defineExpose({
    toggleTooltip
});


</script>