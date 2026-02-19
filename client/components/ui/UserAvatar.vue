<template>
  <div class="flex items-center" :class="{ 'gap-2': showName && name }">
    <!-- Avatar -->
    <div
      :class="[
        'rounded-full flex items-center justify-center flex-shrink-0',
        sizeClasses,
        bgClasses
      ]"
    >
      <img
        v-if="photoUrl"
        :src="photoUrl"
        :alt="name || 'User'"
        class="w-full h-full rounded-full object-cover"
      />
      <span
        v-else
        :class="['font-medium', textSizeClasses, textColorClasses]"
      >
        {{ initials }}
      </span>
    </div>

    <!-- Name (optional) -->
    <span
      v-if="showName && name"
      :class="[
        'font-medium text-gray-900 dark:text-white break-words',
        nameSizeClasses
      ]"
    >
      {{ displayName }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  name: { type: String, default: null },
  photoUrl: { type: String, default: null },
  size: { type: String, default: 'md' },
  variant: { type: String, default: 'default' },
  showName: { type: Boolean, default: false },
  firstNameOnly: { type: Boolean, default: false }
})

const initials = computed(() => {
  if (!props.name) return 'U'
  const parts = String(props.name).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'U'
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
})

const displayName = computed(() => {
  if (!props.name) return ''
  if (props.firstNameOnly) {
    return props.name.split(' ')[0]
  }
  return props.name
})

const sizeClasses = computed(() => {
  return {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[props.size]
})

const textSizeClasses = computed(() => {
  return {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[props.size]
})

const nameSizeClasses = computed(() => {
  return {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  }[props.size]
})

const bgClasses = computed(() => {
  if (props.photoUrl) return ''

  if (props.variant === 'positive') {
    return 'bg-positive-100 dark:bg-positive-900/30'
  } else if (props.variant === 'negative') {
    return 'bg-negative-100 dark:bg-negative-900/30'
  }
  return 'bg-gradient-to-br from-blue-500 to-indigo-600'
})

const textColorClasses = computed(() => {
  if (props.variant === 'positive') {
    return 'text-positive-700 dark:text-positive-400'
  } else if (props.variant === 'negative') {
    return 'text-negative-700 dark:text-negative-400'
  }
  return 'text-white'
})
</script>
