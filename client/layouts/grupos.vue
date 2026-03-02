<template>
  <div class="min-h-screen bg-ttc-bg">
    <!-- Nav header — shown when inside a group, hidden on group selection screen -->
    <AppHeader v-if="!groupStore.showGroupList" />

    <!-- Page Content -->
    <slot />

    <!-- Mobile Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
const groupStore = useGroupStore()
</script>
