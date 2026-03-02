<template>
  <header class="bg-ttc-card border-b border-ttc-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Top bar -->
      <div class="flex items-center justify-between h-14">
        <!-- Left: wordmark + mode toggle -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <TtcSymbol size-class="w-6 h-6" class="text-ttc-primary" />
            <span class="font-outfit font-semibold text-sm tracking-[3px] text-ttc-text">
              text <span class="text-ttc-primary">the</span> check
            </span>
          </div>
          <!-- Mode Toggle: Switch to Finanzas -->
          <button
            @click="switchToFinanzas"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ttc-text-muted hover:text-ttc-primary hover:bg-ttc-primary/10 rounded-md transition-colors"
          >
            <IconWallet class="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>
        </div>

        <!-- Right: actions + theme toggle + profile -->
        <div class="flex items-center gap-2">
          <!-- Report Button (desktop only, 3+ expenses) -->
          <NuxtLink
            v-if="showReportButton"
            to="/grupos/report"
            class="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-ttc-text-muted hover:text-ttc-primary hover:bg-ttc-primary/10 rounded-lg transition-colors"
            title="Ver reporte del viaje"
          >
            <IconChartBox class="w-5 h-5" />
            <span>Reporte</span>
          </NuxtLink>

          <!-- Add Expense Button (desktop only) -->
          <button
            @click="handleAddExpense"
            class="hidden md:flex items-center gap-2 bg-ttc-primary hover:bg-ttc-primary-light active:bg-ttc-primary text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <IconPlus class="w-5 h-5" />
            <span>Agregar Gasto</span>
          </button>

          <!-- Theme Toggle (always visible) -->
          <ThemeToggle />

          <!-- Profile link -->
          <NuxtLink
            v-if="user"
            to="/profile"
            class="hidden md:flex items-center gap-2 text-ttc-text hover:text-ttc-text transition-colors"
          >
            <img
              v-if="user.photoURL"
              :src="user.photoURL"
              :alt="user.displayName || 'User'"
              referrerpolicy="no-referrer"
              class="w-6 h-6 rounded-full ring-1 ring-ttc-border"
            />
            <div
              v-else
              class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
            >
              <span class="text-white font-medium text-[9px]">{{ getUserInitials(user.displayName) }}</span>
            </div>
            <span class="text-sm">{{ user.displayName }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Group context strip (below top bar) -->
      <div class="flex items-center gap-2 pb-1.5 text-sm">
        <button
          @click="groupStore.backToGroupList()"
          class="flex items-center gap-1.5 text-ttc-text font-medium hover:text-ttc-primary transition-colors"
        >
          <IconGrid class="w-4 h-4" />
          <span>{{ groupStore.selectedGroup?.name || 'Cargando...' }}</span>
        </button>

        <button
          @click="shareInviteLink"
          class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-medium text-ttc-text-muted hover:text-ttc-text hover:bg-ttc-card-hover rounded-md transition-colors"
          title="Invitar al grupo"
        >
          <IconShare class="w-3.5 h-3.5" />
          <span v-if="inviteCopied" class="text-green-400">Copiado!</span>
        </button>

        <NuxtLink
          v-if="showReportButton"
          to="/grupos/report"
          class="md:hidden inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-medium text-ttc-primary bg-ttc-primary/10 hover:bg-ttc-primary/15 rounded-md transition-colors"
        >
          <IconChartBox class="w-3.5 h-3.5" />
          <span>Reporte</span>
        </NuxtLink>
      </div>

      <!-- Desktop Tab Navigation -->
      <nav class="hidden md:flex items-center -mb-px">
        <button
          @click="switchTab('inicio')"
          class="nav-tab"
          :class="{ 'nav-tab-active': activeTab === 'inicio' }"
        >
          <IconHome class="w-4 h-4" />
          <span>Inicio</span>
        </button>
        <button
          @click="switchTab('grupo')"
          class="nav-tab"
          :class="{ 'nav-tab-active': activeTab === 'grupo' }"
        >
          <IconGroup class="w-4 h-4" />
          <span>Grupo</span>
        </button>
      </nav>
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

<style scoped>
.nav-tab {
  @apply flex items-center gap-2 py-3 px-4 text-ttc-text-muted border-b-2 border-transparent font-medium text-sm whitespace-nowrap transition-colors;
}
.nav-tab:hover {
  @apply text-ttc-text border-ttc-border;
}
.nav-tab-active {
  @apply text-ttc-primary border-ttc-primary font-semibold;
}
</style>
