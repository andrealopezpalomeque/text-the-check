<template>
  <div class="flex gap-2 mb-6 px-3">
    <NuxtLink
      to="/settings/categories"
      class="settings-tab"
      :class="{ 'settings-tab-active': route.path === '/settings/categories' }"
    >
      <MdiTag class="text-xl" />
      <span>Categorias</span>
    </NuxtLink>
    <NuxtLink
      to="/settings/whatsapp"
      class="settings-tab"
      :class="{ 'settings-tab-active': route.path === '/settings/whatsapp' }"
    >
      <MdiWhatsapp class="text-xl" />
      <span>WhatsApp</span>
    </NuxtLink>
    <NuxtLink
      to="/settings/notifications"
      class="settings-tab"
      :class="{ 'settings-tab-active': route.path === '/settings/notifications' }"
    >
      <MdiBell class="text-xl" />
      <span>Notificaciones</span>
    </NuxtLink>
  </div>
</template>

<script setup>
import MdiTag from '~icons/mdi/tag';
import MdiWhatsapp from '~icons/mdi/whatsapp';
import MdiBell from '~icons/mdi/bell';

const route = useRoute();
</script>

<style scoped>
.settings-tab {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 text-sm font-medium transition-colors;
}

.settings-tab:hover {
  @apply bg-gray-700/50 text-gray-200;
}

.settings-tab-active {
  @apply bg-primary/20 text-primary;
}
</style>
