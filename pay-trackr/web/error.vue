<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-base">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-primary mb-4">{{ error?.statusCode || 'Error' }}</h1>
      <p class="text-xl text-gray-400 mb-8">{{ error?.message || 'Ha ocurrido un error' }}</p>
      <button
        @click="handleError"
        class="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
});

const handleError = () => clearError({ redirect: '/' });
</script>
