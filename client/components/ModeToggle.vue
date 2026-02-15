<template>
  <div class="inline-flex bg-ttc-surface border border-ttc-border rounded-xl p-1">
    <button
      @click="$emit('update:activeMode', 'viajes')"
      :class="[
        'flex items-center gap-2 rounded-lg px-4 py-2 font-body text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer',
        activeMode === 'viajes'
          ? 'bg-ttc-primary/15 text-ttc-primary'
          : 'text-ttc-text-dim hover:text-ttc-text-muted'
      ]"
    >
      <Plane :size="14" :stroke-width="1.5" />
      Viajes y Grupos
    </button>
    <button
      @click="$emit('update:activeMode', 'finanzas')"
      :class="[
        'flex items-center gap-2 rounded-lg px-4 py-2 font-body text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer',
        activeMode === 'finanzas'
          ? 'bg-ttc-accent/15 text-ttc-accent'
          : 'text-ttc-text-dim hover:text-ttc-text-muted'
      ]"
    >
      <Wallet :size="14" :stroke-width="1.5" />
      Mis Finanzas
    </button>
  </div>
</template>

<script setup>
import { Plane, Wallet } from 'lucide-vue-next'

defineProps({
  activeMode: {
    type: String,
    required: true,
  },
})

defineEmits(['update:activeMode'])
</script>
