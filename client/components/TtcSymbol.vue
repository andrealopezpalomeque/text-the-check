<template>
  <img
    :src="theme === 'dark' ? '/img/ttc_symbol_white.png' : '/img/ttc_symbol_primary.png'"
    alt="Text the Check"
    :class="sizeClass"
  />
</template>

<script setup>
const { theme } = useTheme()

defineProps({
  sizeClass: {
    type: String,
    default: 'w-7 h-7',
  },
})
</script>
