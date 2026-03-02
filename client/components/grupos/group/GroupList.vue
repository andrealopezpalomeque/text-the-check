<template>
  <div class="min-h-screen bg-ttc-bg pb-20 md:pb-0">
    <div class="container mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="font-display text-2xl font-bold text-ttc-text">
            Mis Grupos
          </h1>
          <p class="text-sm text-ttc-text-muted mt-1">
            Seleccioná un grupo para ver sus gastos
          </p>
        </div>
        <!-- Profile link -->
        <NuxtLink
          v-if="user"
          to="/profile"
          class="flex items-center gap-2 hover:bg-ttc-card-hover rounded-lg px-3 py-2 transition-colors"
        >
          <img
            v-if="user.photoURL"
            :src="user.photoURL"
            :alt="user.displayName || 'User'"
            class="w-9 h-9 rounded-full ring-2 ring-ttc-border"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
          >
            <span class="text-white font-medium text-sm">
              {{ getUserInitials(user.displayName) }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-if="groupStore.groups.length === 0" class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-6 bg-ttc-card rounded-full flex items-center justify-center">
          <IconGroup class="w-10 h-10 text-ttc-text-muted" />
        </div>
        <h2 class="text-xl font-semibold text-ttc-text mb-2">
          No tenés grupos todavía
        </h2>
        <p class="text-ttc-text-muted mb-6 max-w-sm mx-auto">
          Creá un grupo para empezar a dividir gastos con tus amigos
        </p>
        <button
          @click="$emit('create')"
          class="inline-flex items-center gap-2 px-6 py-3 bg-ttc-primary hover:bg-ttc-primary-light text-white font-medium rounded-xl transition-colors"
        >
          <IconPlus class="w-5 h-5" />
          Crear grupo
        </button>
      </div>

      <!-- Groups Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Group Cards -->
        <button
          v-for="group in groupStore.groups"
          :key="group.id"
          @click="groupStore.enterGroup(group.id)"
          class="bg-ttc-card rounded-xl border border-ttc-border p-5 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-ttc-text truncate text-lg">
                {{ group.name }}
              </h3>
              <p class="text-sm text-ttc-text-muted mt-1">
                {{ getMemberCount(group) }} {{ getMemberCount(group) === 1 ? 'miembro' : 'miembros' }}
              </p>
            </div>
            <IconChevronRight class="w-5 h-5 text-ttc-text-muted group-hover:text-blue-500 transition-colors flex-shrink-0 ml-3" />
          </div>
        </button>

        <!-- Create Group Card -->
        <button
          @click="$emit('create')"
          class="rounded-xl border-2 border-dashed border-ttc-border p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center justify-center min-h-[88px]"
        >
          <IconPlus class="w-6 h-6 text-ttc-text-muted mb-1" />
          <span class="text-sm font-medium text-ttc-text-muted">Crear grupo</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconGroup from '~icons/mdi/account-group'
import IconPlus from '~icons/mdi/plus'
import IconChevronRight from '~icons/mdi/chevron-right'

defineEmits(['create'])

const { user } = useAuth()
const groupStore = useGroupStore()

const getMemberCount = (group) => {
  const realMembers = group.members?.length || 0
  const ghostMembers = group.ghostMembers?.length || 0
  return realMembers + ghostMembers
}

const getUserInitials = (displayName) => {
  if (!displayName) return 'U'
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'U'
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}
</script>
