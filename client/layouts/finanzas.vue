<template>
  <div class="min-h-screen bg-ttc-bg">
    <!-- Finanzas Navigation -->
    <FinanzasNav />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 pb-20 md:pb-0">
      <main>
        <slot />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <FinanzasBottomNav />
  </div>
</template>
