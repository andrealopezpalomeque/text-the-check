<template>
  <div />
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
  ssr: false
})

// Redirect to grupos — the groups list handles empty state + group creation
navigateTo('/grupos', { replace: true })
</script>
