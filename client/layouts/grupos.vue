<template>
  <div class="min-h-screen bg-ttc-bg">
    <!-- Nav header — shown when inside a group, hidden on group selection screen -->
    <AppHeader v-if="!groupStore.showGroupList" />

    <!-- Page Content -->
    <div :class="{ 'pt-6': !groupStore.showGroupList }">
      <slot />
    </div>

    <!-- Mobile Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
const groupStore = useGroupStore()
</script>
