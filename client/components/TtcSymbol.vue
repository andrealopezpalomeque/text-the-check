<template>
  <svg
    :class="sizeClass"
    viewBox="10 10 80 120"
    fill="none"
    class="text-current"
    aria-hidden="true"
  >
    <!-- Receipt outline: simplified 3-tooth top/bottom, curved sides -->
    <path
      d="M 20 20 l 10 -5 l 10 5 l 10 -5 l 10 5 l 10 -5 l 10 5 C 75 55, 85 85, 80 120 l -10 5 l -10 -5 l -10 5 l -10 -5 l -10 5 l -10 -5 C 25 85, 15 55, 20 20 Z"
      stroke="currentColor"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Receipt lines -->
    <line x1="32" y1="50" x2="68" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
    <line x1="32" y1="70" x2="52" y2="70" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
    <line x1="32" y1="90" x2="60" y2="90" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
  </svg>
</template>

<script setup>
defineProps({
  sizeClass: {
    type: String,
    default: 'w-7 h-7',
  },
})
</script>
