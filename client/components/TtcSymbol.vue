<template>
  <svg
    :class="sizeClass"
    viewBox="0 0 160 200"
    fill="none"
    class="text-current"
    aria-hidden="true"
  >
    <!-- Receipt outline: zigzag top/bottom, pronounced curved sides -->
    <path
      d="M 28,25 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 142,37 124,78 139,115 C 144,148 124,170 132,175 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 19,159 37,127 23,88 C 18,52 37,32 28,25 Z"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Chat lines -->
    <rect x="43" y="72" width="42" height="10" rx="5" fill="currentColor" opacity="0.18"/>
    <rect x="80" y="92" width="44" height="10" rx="5" fill="currentColor" opacity="0.12"/>
    <rect x="45" y="112" width="34" height="10" rx="5" fill="currentColor" opacity="0.18"/>
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
