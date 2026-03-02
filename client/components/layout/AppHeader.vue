<template>
  <header class="mb-6">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h1 class="font-display text-2xl font-bold text-ttc-text">
            Text The Check
          </h1>
          <!-- Mode Toggle: Switch to Finanzas -->
          <button
            @click="switchToFinanzas"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ttc-text-muted hover:text-emerald-400 hover:bg-emerald-900/20 rounded-md transition-colors"
          >
            <IconWallet class="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>
        </div>
        <!-- Group Name (clickable back to groups list) -->
        <div class="mt-1 flex items-center gap-2">
          <button
            @click="groupStore.backToGroupList()"
            class="flex items-center gap-1.5 text-ttc-text text-sm font-medium hover:text-ttc-primary transition-colors"
          >
            <IconGrid class="w-4 h-4" />
            <span>{{ groupStore.selectedGroup?.name || 'Cargando...' }}</span>
          </button>

          <!-- Invite Link Button (inline with group name) -->
          <button
            @click="shareInviteLink"
            class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-medium text-ttc-text-muted hover:text-indigo-400 hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Invitar al grupo"
          >
            <IconShare class="w-3.5 h-3.5" />
            <span v-if="inviteCopied" class="text-green-400">Copiado!</span>
          </button>

          <!-- Mobile Report Button (inline with group name, only show with 3+ expenses) -->
          <NuxtLink
            v-if="showReportButton"
            to="/grupos/report"
            class="md:hidden inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-medium text-indigo-400 bg-indigo-900/20 hover:bg-indigo-900/30 rounded-md transition-colors"
          >
            <IconChartBox class="w-3.5 h-3.5" />
            <span>Reporte</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Desktop actions (hidden on mobile since we have bottom nav) -->
      <div class="hidden md:flex items-center gap-4">
        <!-- Desktop Tab Navigation -->
        <nav class="flex items-center bg-ttc-surface rounded-lg p-1">
          <button
            @click="switchTab('inicio')"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'inicio'
                ? 'bg-ttc-card text-ttc-primary shadow-sm'
                : 'text-ttc-text-muted hover:text-ttc-text'
            ]"
          >
            <IconHome class="w-4 h-4" />
            <span>Inicio</span>
          </button>
          <button
            @click="switchTab('grupo')"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'grupo'
                ? 'bg-ttc-card text-ttc-primary shadow-sm'
                : 'text-ttc-text-muted hover:text-ttc-text'
            ]"
          >
            <IconGroup class="w-4 h-4" />
            <span>Grupo</span>
          </button>
        </nav>

        <!-- Report Button (only show with 3+ expenses) -->
        <NuxtLink
          v-if="showReportButton"
          to="/grupos/report"
          class="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
          title="Ver reporte del viaje"
        >
          <IconChartBox class="w-5 h-5" />
          <span>Reporte</span>
        </NuxtLink>
        <!-- Add Expense Button -->
        <button
          @click="handleAddExpense"
          class="flex items-center gap-2 bg-ttc-primary hover:bg-ttc-primary-light active:bg-ttc-primary text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <IconPlus class="w-5 h-5" />
          <span>Agregar Gasto</span>
        </button>

        <!-- Theme Toggle -->
        <ThemeToggle />

        <!-- Profile link -->
        <NuxtLink
          v-if="user"
          to="/profile"
          class="flex items-center gap-3 hover:bg-ttc-card-hover rounded-lg px-3 py-2 transition-colors"
        >
        <img
          v-if="user.photoURL"
          :src="user.photoURL"
          :alt="user.displayName || 'User'"
          class="w-10 h-10 rounded-full ring-2 ring-ttc-border"
        />
        <div
          v-else
          class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
        >
          <span class="text-white font-medium text-sm">
            {{ getUserInitials(user.displayName) }}
          </span>
        </div>
        <div>
          <p class="text-sm font-medium text-ttc-text">
            {{ user.displayName }}
          </p>
          <p class="text-xs text-ttc-text-muted">
            Mi perfil
          </p>
        </div>
      </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import IconGrid from '~icons/mdi/view-grid'
import IconPlus from '~icons/mdi/plus'
import IconHome from '~icons/mdi/home'
import IconGroup from '~icons/mdi/account-group'
import IconChartBox from '~icons/mdi/chart-box'
import IconShare from '~icons/mdi/share-variant'
import IconWallet from '~icons/mdi/wallet'

const { user } = useAuth()
const { setMode } = useAppMode()
const groupStore = useGroupStore()
const expenseStore = useExpenseStore()
const { activeTab, switchTab, openExpenseModal } = useNavigationState()

// Only show report button when there are 3+ expenses (meaningful data for a report)
const showReportButton = computed(() => expenseStore.expenses.length >= 3)

const inviteCopied = ref(false)

const shareInviteLink = async () => {
  const url = `${window.location.origin}/join?group=${groupStore.selectedGroupId}`
  const shareData = {
    title: 'Text The Check',
    text: `Unite a ${groupStore.selectedGroup?.name || 'nuestro grupo'} en Text The Check`,
    url
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    inviteCopied.value = true
    setTimeout(() => { inviteCopied.value = false }, 2000)
  } catch {
    // Clipboard API not available
  }
}

const handleAddExpense = () => {
  openExpenseModal()
}

const switchToFinanzas = () => {
  setMode('finanzas')
  navigateTo('/finanzas')
}

const getUserInitials = (displayName) => {
  if (!displayName) return 'U'
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'U'
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}
</script>
