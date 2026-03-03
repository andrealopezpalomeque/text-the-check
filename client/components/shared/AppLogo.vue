<template>
  <!-- Horizontal: icon left, wordmark right, vertically centered -->
  <div
    v-if="variant === 'horizontal'"
    class="flex items-center gap-2"
  >
    <TtcSymbol size-class="w-7 h-7" class="text-ttc-primary" />
    <span class="font-outfit font-semibold text-[14px] tracking-[3px] text-ttc-text leading-none">
      text <span class="text-ttc-primary">the</span> check
    </span>
  </div>

  <!-- Stacked: icon above, wordmark below, centered -->
  <div
    v-else-if="variant === 'stacked'"
    class="flex flex-col items-center"
  >
    <TtcSymbol :size-class="stackedIconClass" class="text-ttc-primary" />
    <span :class="['font-outfit font-semibold tracking-[3px] text-ttc-text', stackedTextClass]">
      text <span class="text-ttc-primary">the</span> check
    </span>
  </div>

  <!-- Icon only -->
  <div v-else>
    <TtcSymbol size-class="w-7 h-7" class="text-ttc-primary" />
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'stacked', 'icon-only'].includes(v),
  },
  iconSize: {
    type: String,
    default: null,
  },
  textSize: {
    type: String,
    default: null,
  },
})

const stackedIconClass = computed(() => props.iconSize || 'w-12 h-12 mx-auto mb-4')
const stackedTextClass = computed(() => props.textSize || 'text-2xl')
</script>
