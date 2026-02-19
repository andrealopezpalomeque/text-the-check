<template>
  <header class="mb-6">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h1 class="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Text The Check
          </h1>
          <!-- Mode Toggle: Switch to Finanzas -->
          <button
            @click="switchToFinanzas"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
          >
            <IconWallet class="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>
        </div>
        <!-- Group Selector with Report Button -->
        <div class="mt-1 flex items-center gap-2">
          <IconLocation class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            v-if="groupStore.hasMultipleGroups"
            :value="groupStore.selectedGroupId"
            @change="handleGroupChange"
            class="bg-transparent border-none text-gray-600 dark:text-gray-300 text-sm font-medium focus:ring-0 focus:outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0"
          >
            <option
              v-for="group in groupStore.groups"
              :key="group.id"
              :value="group.id"
              class="bg-white dark:bg-gray-800"
            >
              {{ group.name }}
            </option>
          </select>
          <span
            v-else
            class="text-gray-600 dark:text-gray-300 text-sm font-medium"
          >
            {{ groupStore.selectedGroup?.name || 'Cargando...' }}
          </span>

          <!-- Invite Link Button (inline with group name) -->
          <button
            @click="shareInviteLink"
            class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Invitar al grupo"
          >
            <IconShare class="w-3.5 h-3.5" />
            <span v-if="inviteCopied" class="text-green-600 dark:text-green-400">Copiado!</span>
          </button>

          <!-- Mobile Report Button (inline with group name, only show with 3+ expenses) -->
          <NuxtLink
            v-if="showReportButton"
            to="/grupos/report"
            class="md:hidden inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
          >
            <IconChartBox class="w-3.5 h-3.5" />
            <span>Reporte</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Desktop actions (hidden on mobile since we have bottom nav) -->
      <div class="hidden md:flex items-center gap-4">
        <!-- Desktop Tab Navigation -->
        <nav class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            @click="switchTab('inicio')"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'inicio'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
          class="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          title="Ver reporte del viaje"
        >
          <IconChartBox class="w-5 h-5" />
          <span>Reporte</span>
        </NuxtLink>
        <!-- Add Expense Button -->
        <button
          @click="handleAddExpense"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <IconPlus class="w-5 h-5" />
          <span>Agregar Gasto</span>
        </button>

        <!-- Profile link -->
        <NuxtLink
          v-if="user"
          to="/profile"
          class="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
        >
        <img
          v-if="user.photoURL"
          :src="user.photoURL"
          :alt="user.displayName || 'User'"
          class="w-10 h-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
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
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ user.displayName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Mi perfil
          </p>
        </div>
      </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import IconLocation from '~icons/mdi/map-marker'
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

const handleGroupChange = (event) => {
  groupStore.selectGroup(event.target.value)
}

const getUserInitials = (displayName) => {
  if (!displayName) return 'U'
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'U'
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}
</script>
