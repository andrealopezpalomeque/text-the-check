<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="compact ? 'py-8' : 'py-16'"
  >
    <div class="w-20 h-20 rounded-full bg-ttc-card flex items-center justify-center mb-4">
      <slot name="icon">
        <component :is="icon" class="text-4xl text-ttc-text-dim" />
      </slot>
    </div>
    <h3 class="text-lg font-nunito font-bold text-ttc-text mb-1">{{ title }}</h3>
    <p class="text-sm text-ttc-text-muted mb-6 max-w-sm mx-auto">{{ description }}</p>
    <button
      v-if="actionLabel"
      @click="$emit('action')"
      class="px-4 py-2.5 bg-ttc-primary hover:bg-ttc-primary/90 text-white font-medium rounded-btn transition-colors flex items-center gap-2"
    >
      <slot name="action-icon" />
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: [Object, Function], default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  actionLabel: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})

defineEmits(['action'])
</script>
