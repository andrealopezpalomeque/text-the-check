<template>
  <div class="inline-flex items-center gap-1 bg-ttc-surface rounded-full p-1">
    <button
      @click="$emit('update:activeMode', 'viajes')"
      :class="[
        'flex items-center gap-2 rounded-full px-5 py-2 font-body text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer',
        activeMode === 'viajes'
          ? 'bg-ttc-toggle-primary text-ttc-primary border border-[#4A90D9]/40'
          : 'text-ttc-text-dim hover:text-ttc-text-muted border border-transparent'
      ]"
    >
      <Plane :size="14" :stroke-width="1.5" />
      Viajes y Grupos
    </button>
    <button
      @click="$emit('update:activeMode', 'finanzas')"
      :class="[
        'flex items-center gap-2 rounded-full px-5 py-2 font-body text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer',
        activeMode === 'finanzas'
          ? 'bg-ttc-toggle-accent text-ttc-accent border border-[#34D399]/40'
          : 'text-ttc-text-dim hover:text-ttc-text-muted border border-transparent'
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
