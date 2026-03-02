<template>
  <div class="min-h-screen bg-ttc-bg">
    <!-- Nav header — shown when inside a group, hidden on group selection screen -->
    <div v-if="!groupStore.showGroupList" class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <AppHeader />
    </div>

    <!-- Page Content -->
    <slot />

    <!-- Mobile Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
const groupStore = useGroupStore()
</script>
