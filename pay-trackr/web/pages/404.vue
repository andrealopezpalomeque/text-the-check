<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-primary mb-4">404</h1>
      <p class="text-xl text-gray-400 mb-8">Página no encontrada</p>
      <NuxtLink
        to="/"
        class="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Volver al inicio
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
useSeo({
  title: '404 - PayTrackr',
  description: 'Página no encontrada.',
  path: '/404',
  noindex: true,
});
</script>
