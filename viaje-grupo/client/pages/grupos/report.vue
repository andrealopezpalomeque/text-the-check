<template>
  <!-- Loading state -->
  <div v-if="loading" class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">Cargando reporte...</p>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else-if="expenses.length === 0" class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div class="text-center px-4">
      <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <IconBarChart3 class="w-8 h-8 text-gray-400" />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mb-4">No hay gastos registrados todavia</p>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Volver al inicio
      </NuxtLink>
    </div>
  </div>

  <!-- Report content -->
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
    <div class="container mx-auto px-4 py-6 max-w-2xl">

      <!-- Header with back and export buttons -->
      <div class="no-print flex items-center justify-between mb-6">
        <NuxtLink
          to="/?tab=grupo"
          class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <IconChevronLeft class="w-4 h-4" />
          Volver
        </NuxtLink>

        <!-- Export button -->
        <button
          @click="exportPDF"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          <IconFileText class="w-4 h-4" />
          <span class="hidden sm:inline">PDF</span>
        </button>
      </div>

      <!-- Printable Report Content -->
      <div id="trip-report">

        <!-- Section 1: Trip Header -->
        <div class="report-section text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
            <IconPlane class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 class="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">
            {{ groupName }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-2">
            {{ formatDateRange(firstExpenseDate, lastExpenseDate) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            {{ tripDays }} dias · {{ memberCount }} personas · {{ expenseCount }} gastos
          </p>
        </div>

        <!-- Section 2: General Summary Card -->
        <div class="report-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <IconWallet class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 class="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Resumen General
            </h2>
          </div>

          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Total gastado</span>
              <span class="font-mono font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalSpent) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Promedio por persona</span>
              <span class="font-mono text-gray-900 dark:text-white">{{ formatCurrency(avgPerPerson) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Promedio por dia</span>
              <span class="font-mono text-gray-900 dark:text-white">{{ formatCurrency(avgPerDay) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Gasto promedio</span>
              <span class="font-mono text-gray-900 dark:text-white">{{ formatCurrency(avgPerExpense) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Total de gastos</span>
              <span class="font-mono text-gray-900 dark:text-white">{{ expenseCount }}</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-gray-600 dark:text-gray-400">Total de pagos registrados</span>
              <span class="font-mono text-gray-900 dark:text-white">{{ paymentCount }}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Category Breakdown Card -->
        <div class="report-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <IconPieChart class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 class="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Gastos por Categoria
            </h2>
          </div>

          <div class="space-y-4">
            <div v-for="cat in categoryStats" :key="cat.category" class="space-y-1">
              <div class="flex items-center gap-2">
                <CategoryIcon :category="cat.category" size="sm" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {{ getCategoryLabel(cat.category) }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="getCategoryBarColor(cat.category)"
                    :style="{ width: cat.percentage + '%' }"
                  />
                </div>
                <span class="font-mono text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {{ formatCurrency(cat.total) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                  {{ Math.round(cat.percentage) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Spending Per Person Card -->
        <div class="report-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <IconUsers class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 class="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Quien Pago Mas
            </h2>
          </div>

          <div class="space-y-4">
            <div v-for="(person, index) in personSpending" :key="person.userId" class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400 w-5">{{ index + 1 }}.</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ person.userName }}
                </span>
              </div>
              <div class="flex items-center gap-3 pl-7">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-500"
                    :style="{ width: person.percentage + '%' }"
                  />
                </div>
                <span class="font-mono text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {{ formatCurrency(person.totalPaid) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                  {{ Math.round(person.percentage) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 5: Daily Spending Chart -->
        <div class="report-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-4">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <IconCalendarDays class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 class="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Gasto por Dia
            </h2>
          </div>

          <!-- Chart Container with fixed height for print -->
          <div class="relative print-chart-container">
            <!-- Y-axis labels -->
            <div class="absolute left-0 top-0 h-[180px] flex flex-col justify-between text-[10px] text-gray-400 font-mono pr-2 w-14">
              <span>{{ formatCompactAmount(maxDailySpend) }}</span>
              <span>{{ formatCompactAmount(maxDailySpend / 2) }}</span>
              <span>$0</span>
            </div>

            <!-- Chart area -->
            <div class="ml-14">
              <!-- Horizontal grid lines -->
              <div class="relative h-[180px] border-b border-gray-200 dark:border-gray-700">
                <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div class="border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                  <div class="border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                  <div></div>
                </div>

                <!-- Bars container -->
                <div class="relative h-full flex items-end gap-1 sm:gap-2 overflow-x-auto">
                  <div
                    v-for="day in dailySpending"
                    :key="day.dateKey"
                    class="flex-1 min-w-[28px] sm:min-w-[40px] flex flex-col items-center justify-end h-full group"
                  >
                    <!-- Amount tooltip on hover (screen only) -->
                    <div class="no-print opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-gray-600 dark:text-gray-300 mb-1 whitespace-nowrap">
                      {{ formatAmount(day.total) }}
                    </div>
                    <!-- Bar with fixed pixel height for print compatibility -->
                    <div
                      class="chart-bar w-full max-w-[36px] bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-md transition-all duration-700 ease-out hover:from-blue-700 hover:to-blue-500"
                      :style="{ height: getBarPixelHeight(day.total) + 'px' }"
                    />
                  </div>
                </div>
              </div>

              <!-- X-axis date labels -->
              <div class="flex gap-1 sm:gap-2 mt-2 overflow-x-auto">
                <div
                  v-for="day in dailySpending"
                  :key="'label-' + day.dateKey"
                  class="flex-1 min-w-[28px] sm:min-w-[40px] text-center"
                >
                  <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {{ formatChartDate(day.dateKey) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary row -->
          <div class="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <span>Max: <span class="font-mono font-medium">{{ formatCurrency(maxDailySpend) }}</span></span>
            <span>Promedio: <span class="font-mono font-medium">{{ formatCurrency(avgDailySpend) }}</span></span>
          </div>
        </div>

        <!-- Section 6: Highlights Card -->
        <div class="report-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <IconTrophy class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 class="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Highlights
            </h2>
          </div>

          <div class="space-y-4">
            <!-- Biggest expense -->
            <div v-if="biggestExpense" class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <IconTrendingUp class="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Gasto mas grande</p>
                <p class="font-mono text-gray-900 dark:text-white">
                  {{ formatCurrency(biggestExpense.amount) }} - {{ biggestExpense.description }}
                  <span class="text-gray-500 dark:text-gray-400">({{ biggestExpense.userName }})</span>
                </p>
              </div>
            </div>

            <!-- Most expensive day -->
            <div v-if="mostExpensiveDay" class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <IconCalendarX class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Dia mas caro</p>
                <p class="font-mono text-gray-900 dark:text-white">
                  {{ formatFullDate(mostExpensiveDay.dateKey) }} - {{ formatCurrency(mostExpensiveDay.total) }}
                </p>
              </div>
            </div>

            <!-- Cheapest day -->
            <div v-if="cheapestDay" class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <IconPiggyBank class="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Dia mas barato</p>
                <p class="font-mono text-gray-900 dark:text-white">
                  {{ formatFullDate(cheapestDay.dateKey) }} - {{ formatCurrency(cheapestDay.total) }}
                </p>
              </div>
            </div>

            <!-- Top category -->
            <div v-if="topCategory" class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <IconTag class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Categoria favorita</p>
                <p class="flex items-center gap-2 text-gray-900 dark:text-white">
                  <CategoryIcon :category="topCategory.category" size="sm" />
                  <span class="capitalize">{{ getCategoryLabel(topCategory.category) }}</span>
                  <span class="text-gray-500 dark:text-gray-400">({{ Math.round(topCategory.percentage) }}% del total)</span>
                </p>
              </div>
            </div>

            <!-- Most active user -->
            <div v-if="mostActiveUser" class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <IconReceipt class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Mas gastos registrados</p>
                <p class="text-gray-900 dark:text-white">
                  {{ mostActiveUser.userName }} <span class="text-gray-500 dark:text-gray-400">({{ mostActiveUser.expenseCount }} gastos)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 7: Debt Status Card -->
        <div class="report-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl" :class="allSettled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'">
              <div class="w-full h-full flex items-center justify-center">
                <IconCheckCircle v-if="allSettled" class="w-5 h-5 text-green-600 dark:text-green-400" />
                <IconClipboardList v-else class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <h2 class="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Estado de Deudas
            </h2>
          </div>

          <!-- All settled -->
          <div v-if="allSettled" class="text-center py-4">
            <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
              <IconPartyPopper class="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p class="text-green-600 dark:text-green-400 font-medium">
              ¡Todas las deudas estan saldadas!
            </p>
          </div>

          <!-- Pending settlements -->
          <div v-else class="space-y-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Pendientes: {{ settlements.length }}
            </p>

            <div class="space-y-2">
              <div
                v-for="settlement in settlements.slice(0, 5)"
                :key="`${settlement.fromUserId}-${settlement.toUserId}`"
                class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-gray-700 dark:text-gray-300">{{ getUserName(settlement.fromUserId) }}</span>
                  <IconArrowRight class="w-4 h-4 text-gray-400" />
                  <span class="text-gray-700 dark:text-gray-300">{{ getUserName(settlement.toUserId) }}</span>
                </div>
                <span class="font-mono text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(settlement.amount) }}
                </span>
              </div>
            </div>

            <div v-if="settlements.length > 5" class="text-sm text-gray-500 dark:text-gray-400 text-center">
              y {{ settlements.length - 5 }} mas...
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total pendiente</span>
              <span class="font-mono font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(totalPending) }}
              </span>
            </div>

            <NuxtLink
              to="/?tab=grupo"
              class="no-print w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Ver en Grupo
            </NuxtLink>
          </div>
        </div>

      </div><!-- end #trip-report -->

    </div>
  </div>
</template>

<script setup lang="ts">
// Lucide icons for report page (differentiated from MDI used elsewhere)
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconBarChart3 from '~icons/lucide/bar-chart-3'
import IconPlane from '~icons/lucide/plane'
import IconWallet from '~icons/lucide/wallet'
import IconPieChart from '~icons/lucide/pie-chart'
import IconUsers from '~icons/lucide/users'
import IconCalendarDays from '~icons/lucide/calendar-days'
import IconTrophy from '~icons/lucide/trophy'
import IconCheckCircle from '~icons/lucide/check-circle'
import IconClipboardList from '~icons/lucide/clipboard-list'
import IconTrendingUp from '~icons/lucide/trending-up'
import IconCalendarX from '~icons/lucide/calendar-x'
import IconPiggyBank from '~icons/lucide/piggy-bank'
import IconTag from '~icons/lucide/tag'
import IconReceipt from '~icons/lucide/receipt'
import IconPartyPopper from '~icons/lucide/party-popper'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconFileText from '~icons/lucide/file-text'
import type { Settlement } from '~/types'

definePageMeta({
  middleware: ['auth'],
  ssr: false
})

const expenseStore = useExpenseStore()
const paymentStore = usePaymentStore()
const userStore = useUserStore()
const groupStore = useGroupStore()

// Chart height constant (in pixels)
const CHART_HEIGHT = 160

// Loading state
const loading = computed(() => {
  return expenseStore.loading || !expenseStore.initialized || !groupStore.selectedGroupId
})

// Basic data
const expenses = computed(() => expenseStore.expenses)
const groupName = computed(() => groupStore.selectedGroup?.name || 'Viaje')
const memberCount = computed(() => userStore.users.length)
const expenseCount = computed(() => expenses.value.length)
const paymentCount = computed(() => paymentStore.payments.length)

// Trip dates (auto-detected from expenses)
const firstExpenseDate = computed(() => {
  if (expenses.value.length === 0) return new Date()
  const dates = expenses.value.map(e => new Date(e.timestamp).getTime())
  return new Date(Math.min(...dates))
})

const lastExpenseDate = computed(() => {
  if (expenses.value.length === 0) return new Date()
  const dates = expenses.value.map(e => new Date(e.timestamp).getTime())
  return new Date(Math.max(...dates))
})

const tripDays = computed(() => {
  const diffTime = Math.abs(lastExpenseDate.value.getTime() - firstExpenseDate.value.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays + 1, 1) // inclusive, minimum 1 day
})

// General stats
const totalSpent = computed(() => expenseStore.totalSpent)

const avgPerPerson = computed(() => {
  if (memberCount.value === 0) return 0
  return totalSpent.value / memberCount.value
})

const avgPerDay = computed(() => {
  if (tripDays.value === 0) return 0
  return totalSpent.value / tripDays.value
})

const avgPerExpense = computed(() => {
  if (expenseCount.value === 0) return 0
  return totalSpent.value / expenseCount.value
})

// Category breakdown
const categoryStats = computed(() => {
  const breakdown = expenseStore.categoryBreakdown
  return breakdown.map(cat => ({
    ...cat,
    percentage: totalSpent.value > 0 ? (cat.total / totalSpent.value) * 100 : 0
  }))
})

const topCategory = computed(() => {
  return categoryStats.value[0] || null
})

// Per-person spending (who PAID)
const personSpending = computed(() => {
  const byUser = new Map<string, { userId: string; userName: string; totalPaid: number; expenseCount: number }>()

  expenses.value.forEach(expense => {
    const existing = byUser.get(expense.userId)
    if (existing) {
      existing.totalPaid += expense.amount
      existing.expenseCount += 1
    } else {
      byUser.set(expense.userId, {
        userId: expense.userId,
        userName: expense.userName,
        totalPaid: expense.amount,
        expenseCount: 1
      })
    }
  })

  const sorted = Array.from(byUser.values()).sort((a, b) => b.totalPaid - a.totalPaid)
  return sorted.map(person => ({
    ...person,
    percentage: totalSpent.value > 0 ? (person.totalPaid / totalSpent.value) * 100 : 0
  }))
})

const mostActiveUser = computed(() => {
  if (personSpending.value.length === 0) return null
  return [...personSpending.value].sort((a, b) => b.expenseCount - a.expenseCount)[0]
})

// Daily spending
const dailySpending = computed(() => {
  const byDate = new Map<string, { dateKey: string; date: Date; total: number; count: number }>()

  expenses.value.forEach(expense => {
    const date = new Date(expense.timestamp)
    const dateKey = date.toISOString().split('T')[0] ?? ''

    const existing = byDate.get(dateKey)
    if (existing) {
      existing.total += expense.amount
      existing.count += 1
    } else {
      byDate.set(dateKey, {
        dateKey,
        date,
        total: expense.amount,
        count: 1
      })
    }
  })

  return Array.from(byDate.values()).sort((a, b) =>
    new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
  )
})

const maxDailySpend = computed(() => {
  if (dailySpending.value.length === 0) return 0
  return Math.max(...dailySpending.value.map(d => d.total))
})

const avgDailySpend = computed(() => {
  if (dailySpending.value.length === 0) return 0
  const total = dailySpending.value.reduce((sum, d) => sum + d.total, 0)
  return total / dailySpending.value.length
})

// Get bar height in pixels (works reliably in print)
const getBarPixelHeight = (total: number): number => {
  if (maxDailySpend.value === 0) return 4 // minimum visible height
  const percentage = total / maxDailySpend.value
  return Math.max(percentage * CHART_HEIGHT, 4) // minimum 4px
}

// Highlights
const biggestExpense = computed(() => {
  if (expenses.value.length === 0) return null
  return [...expenses.value].sort((a, b) => b.amount - a.amount)[0]
})

const mostExpensiveDay = computed(() => {
  if (dailySpending.value.length === 0) return null
  return [...dailySpending.value].sort((a, b) => b.total - a.total)[0]
})

const cheapestDay = computed(() => {
  if (dailySpending.value.length === 0) return null
  return [...dailySpending.value].sort((a, b) => a.total - b.total)[0]
})

// Debt status
const settlements = computed((): Settlement[] => {
  // Touch reactive arrays for dependency
  void paymentStore.payments.length
  void expenseStore.expenses.length

  return groupStore.simplifySettlements
    ? userStore.calculateSimplifiedSettlements()
    : userStore.calculateSettlements()
})

const allSettled = computed(() => settlements.value.length === 0)

const totalPending = computed(() => {
  return settlements.value.reduce((sum, s) => sum + s.amount, 0)
})

const getUserName = (userId: string): string => {
  const user = userStore.getUserById(userId)
  return user?.name?.split(' ')[0] || 'Usuario'
}

// Category helpers
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    food: 'Comida',
    transport: 'Transporte',
    accommodation: 'Alojamiento',
    entertainment: 'Entretenimiento',
    shopping: 'Compras',
    general: 'General'
  }
  return labels[category] || category
}

const getCategoryBarColor = (category: string): string => {
  const colors: Record<string, string> = {
    food: 'bg-orange-500',
    transport: 'bg-blue-500',
    accommodation: 'bg-purple-500',
    entertainment: 'bg-pink-500',
    shopping: 'bg-emerald-500',
    general: 'bg-gray-500'
  }
  return colors[category] || 'bg-gray-500'
}

// Date formatting
const formatDateRange = (start: Date, end: Date): string => {
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  const startStr = start.toLocaleDateString('es-AR', formatOptions)
  const endStr = end.toLocaleDateString('es-AR', formatOptions)

  if (startStr === endStr) return startStr
  return `${startStr} – ${endStr}`
}

const formatChartDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00') // Avoid timezone issues
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const formatFullDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const formatCompactAmount = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${Math.round(amount / 1000)}k`
  return `$${Math.round(amount)}`
}

// Export PDF
const exportPDF = () => {
  window.print()
}
</script>

<style>
@media print {
  /* Hide everything except the report */
  body * {
    visibility: hidden;
  }

  /* Show the report content */
  #trip-report,
  #trip-report * {
    visibility: visible;
  }

  #trip-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  /* Hide navigation, export buttons, back link */
  .no-print {
    display: none !important;
  }

  /* Force light mode for printing */
  .dark\:bg-gray-800 { background-color: white !important; }
  .dark\:bg-gray-900 { background-color: white !important; }
  .dark\:text-white { color: #111827 !important; }
  .dark\:text-gray-300 { color: #374151 !important; }
  .dark\:text-gray-400 { color: #6b7280 !important; }

  /* Page breaks between sections */
  .report-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Remove shadows for cleaner print */
  .shadow-sm {
    box-shadow: none !important;
  }

  /* Ensure chart bars are visible in print */
  .chart-bar {
    background: #3b82f6 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Ensure chart container has proper height */
  .print-chart-container {
    height: auto !important;
    overflow: visible !important;
  }
}
</style>
