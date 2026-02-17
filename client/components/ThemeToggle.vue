<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg hover:bg-ttc-card transition-colors"
    :aria-label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
  >
    <Moon v-if="theme === 'dark'" :size="14" :stroke-width="1.5" class="text-ttc-text-muted" />
    <Sun v-else :size="14" :stroke-width="1.5" class="text-ttc-text-muted" />
  </button>
</template>

<script setup>
import { Sun, Moon } from 'lucide-vue-next'

const { theme, toggleTheme } = useTheme()
</script>
