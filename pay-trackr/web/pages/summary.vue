<template>
  <div class="summary-page">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-3 mb-6">
      <h1 class="text-2xl font-bold">Resumen Financiero</h1>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">Rango de fechas:</span>
        <select
          v-model="monthsToDisplay"
          @change="async () => await updateCharts()"
          class="px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
        </select>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-3 skeleton-shimmer">
      <!-- Chart Skeleton 1 -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div class="h-6 w-48 bg-gray-700 rounded mb-2"></div>
        <div class="h-4 w-64 bg-gray-700/50 rounded mb-4"></div>
        <div class="h-[350px] bg-gray-700/30 rounded"></div>
      </div>
      <!-- Chart Skeleton 2 -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div class="h-6 w-48 bg-gray-700 rounded mb-2"></div>
        <div class="h-4 w-64 bg-gray-700/50 rounded mb-4"></div>
        <div class="h-[350px] bg-gray-700/30 rounded"></div>
      </div>
      <!-- Stats Skeleton -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div class="h-6 w-36 bg-gray-700 rounded mb-2"></div>
        <div class="h-4 w-52 bg-gray-700/50 rounded mb-4"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="i in 6" :key="i" class="h-24 bg-gray-700/50 rounded-lg"></div>
        </div>
      </div>
      <!-- Breakdown Skeleton -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div class="h-6 w-44 bg-gray-700 rounded mb-2"></div>
        <div class="h-4 w-56 bg-gray-700/50 rounded mb-4"></div>
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-14 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-3">
      <!-- Monthly Spending Trends -->
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <h2 class="text-lg font-semibold mb-2 flex items-center">
          <MdiChartLine class="mr-2 text-primary" />
          Tendencias de Gastos Mensuales
        </h2>
        <p class="text-sm text-gray-500 mb-4">Compará tus gastos fijos y únicos por mes</p>
        <div class="relative h-[350px]">
          <canvas id="monthlyTrendsChart"></canvas>
        </div>
      </div>

      <!-- Spending Distribution -->
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <h2 class="text-lg font-semibold mb-2 flex items-center">
          <MdiChartPie class="mr-2 text-primary" />
          Distribución de Gastos
        </h2>
        <div class="flex justify-between items-center mb-4">
          <p class="text-sm text-gray-500">Mirá cómo se distribuye tu dinero por categoría</p>
          <select
            v-model="selectedMonth"
            @change="updateCategoryPieChart"
            class="px-2 py-1 text-sm rounded-lg border border-gray-600 bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option v-for="month in availableMonths" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
        <div v-if="!categoryDataExists" class="flex flex-col items-center justify-center h-[350px] text-gray-400">
          <MdiChartDonut class="text-5xl mb-3" />
          <p>No hay datos de pagos para este mes</p>
        </div>
        <div v-else class="relative h-[350px]">
          <canvas id="categoryPieChart"></canvas>
        </div>
      </div>

      <!-- Key Statistics -->
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <h2 class="text-lg font-semibold mb-2 flex items-center">
          <MdiChartMultiple class="mr-2 text-primary" />
          Estadísticas Clave
        </h2>
        <p class="text-sm text-gray-500 mb-4">Tus datos financieros de un vistazo</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Average Monthly Spend -->
          <div class="flex flex-col p-3 bg-gray-700/40 rounded-lg">
            <span class="text-xs text-gray-400">Gasto Mensual Promedio</span>
            <span class="text-xl font-bold text-white">{{ formatPrice(stats.averageMonthlySpend) }}</span>
            <div class="text-sm mt-1">
              <span :class="stats.monthOverMonthChange >= 0 ? 'text-danger' : 'text-success'">
                {{ stats.monthOverMonthChange >= 0 ? "↑" : "↓" }} {{ Math.abs(stats.monthOverMonthChange).toFixed(1) }}%
              </span>
              <span class="text-gray-400 ml-1">vs mes anterior</span>
            </div>
          </div>

          <!-- Peak Spending Month -->
          <div class="flex flex-col p-3 bg-gray-700/40 rounded-lg">
            <span class="text-xs text-gray-400">Mes con Mayor Gasto</span>
            <span class="text-xl font-bold text-white">{{ stats.peakSpendingMonth || "N/A" }}</span>
            <span class="text-sm text-gray-400">{{ formatPrice(stats.peakSpendingAmount) }}</span>
          </div>

          <!-- Recurring vs One-time -->
          <div class="flex flex-col p-3 bg-gray-700/40 rounded-lg">
            <span class="text-xs text-gray-400">Fijos vs Únicos</span>
            <div class="flex items-center gap-2">
              <span class="text-xl font-bold text-white">{{ stats.recurringPercentage }}%</span>
              <span class="text-sm text-gray-400">fijos</span>
            </div>
            <div class="w-full h-2 bg-gray-600 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-primary rounded-full" :style="`width: ${stats.recurringPercentage}%`"></div>
            </div>
          </div>

          <!-- Avg One-time Transaction -->
          <div class="flex flex-col p-3 bg-gray-700/40 rounded-lg">
            <span class="text-xs text-gray-400">Promedio Pago Único</span>
            <span class="text-xl font-bold text-white">{{ formatPrice(stats.avgOneTimeTransaction) }}</span>
            <span class="text-sm text-gray-400">por transacción</span>
          </div>

          <!-- Top Expense Category -->
          <div class="flex flex-col p-3 bg-gray-700/40 rounded-lg">
            <span class="text-xs text-gray-400">Categoría Principal</span>
            <div class="flex items-center gap-2">
              <span class="text-xl font-bold text-white">{{ getCategoryDisplayLabel(stats.topCategory) }}</span>
              <span
                v-if="stats.topCategoryTrend !== 0"
                :class="stats.topCategoryTrend >= 0 ? 'text-danger' : 'text-success'"
                class="text-sm"
              >
                {{ stats.topCategoryTrend >= 0 ? "↑" : "↓" }} {{ Math.abs(stats.topCategoryTrend).toFixed(0) }}%
              </span>
            </div>
            <span class="text-sm text-gray-400">{{ stats.topCategoryPercentage }}% del gasto total</span>
          </div>

          <!-- Payment Completion Rate -->
          <div class="flex flex-col p-3 bg-gray-700/40 rounded-lg">
            <span class="text-xs text-gray-400">Tasa de Pagos Completados</span>
            <span class="text-xl font-bold text-white">{{ stats.paymentCompletionRate }}%</span>
            <div class="w-full h-2 bg-gray-600 rounded-full mt-2 overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="
                  stats.paymentCompletionRate > 80
                    ? 'bg-success'
                    : stats.paymentCompletionRate > 50
                    ? 'bg-warning'
                    : 'bg-danger'
                "
                :style="`width: ${stats.paymentCompletionRate}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Breakdown -->
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <h2 class="text-lg font-semibold mb-2 flex items-center">
          <MdiCreditCardOutline class="mr-2 text-primary" />
          Desglose de Pagos
        </h2>
        <p class="text-sm text-gray-500 mb-4">Mirá tus mayores gastos de {{ selectedMonthName }}</p>

        <div v-if="!topPayments.length" class="flex flex-col items-center justify-center h-[350px] text-gray-400">
          <MdiCreditCardOff class="text-5xl mb-3" />
          <p>No hay datos de pagos para este mes</p>
        </div>
        <div v-else>
          <div class="overflow-hidden">
            <div v-for="(payment, index) in topPayments" :key="payment.id" class="mb-3">
              <div class="flex justify-between items-center mb-1">
                <div class="flex items-center">
                  <div class="w-2 h-10 rounded-full mr-3" :style="{ backgroundColor: getDisplayCategoryColor(payment) }"></div>
                  <div>
                    <p class="font-medium">{{ payment.title }}</p>
                    <p class="text-xs text-gray-500">{{ payment.isRecurring ? "Fijo" : "Único" }}</p>
                  </div>
                </div>
                <p class="font-semibold">{{ formatPrice(payment.amount) }}</p>
              </div>
              <div class="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  :style="`width: ${(payment.amount / topPayments[0].amount) * 100}%`"
                ></div>
              </div>
            </div>
          </div>

          <div class="mt-4 text-center" v-if="hasMorePayments">
            <button @click="showAllPayments = !showAllPayments" class="text-primary text-sm hover:underline">
              {{ showAllPayments ? "Ver menos" : "Ver todos los pagos" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from "~/utils";
import { Chart, registerables } from "chart.js";
import MdiChartLine from "~icons/mdi/chart-line";
import MdiChartPie from "~icons/mdi/chart-pie";
import MdiChartDonut from "~icons/mdi/chart-donut";
import MdiChartMultiple from "~icons/mdi/chart-multiple";
import MdiCreditCardOutline from "~icons/mdi/credit-card-outline";
import MdiCreditCardOff from "~icons/mdi/credit-card-off";

// Register Chart.js components
Chart.register(...registerables);

definePageMeta({
  middleware: ["auth"]
});

// ----- Define Useful Properties ---------
const { $dayjs } = useNuxtApp();

// ----- Define Pinia Vars ----------
const paymentStore = usePaymentStore();
const recurrentStore = useRecurrentStore();
const categoryStore = useCategoryStore();
const { getPayments } = storeToRefs(paymentStore);
const { getPaymentInstances } = storeToRefs(recurrentStore);
const { getCategories: categories } = storeToRefs(categoryStore);

// ----- Category Helpers ---------
function getDisplayCategoryColor(payment) {
  if (!payment?.categoryId) return '#808080';
  return categoryStore.getCategoryColor(payment.categoryId);
}

function getDisplayCategoryName(payment) {
  if (!payment?.categoryId) return 'Otros';
  return categoryStore.getCategoryName(payment.categoryId);
}

function getCategoryDisplayLabel(categoryId) {
  if (!categoryId) return 'Otros';
  return categoryStore.getCategoryName(categoryId);
}

function getCategoryChartColor(categoryId) {
  if (!categoryId) return '#808080';
  return categoryStore.getCategoryColor(categoryId);
}

// ----- Define Refs ---------
const isLoading = ref(true);
const monthsToDisplay = ref(6);
const selectedMonth = ref("");
const selectedMonthName = ref("");
const availableMonths = ref([]);
const categoryDataExists = ref(true);
var monthlyTrendsChart = null;
var categoryPieChart = null;
const showAllPayments = ref(false);
const allMonthlyPayments = ref([]);

// Statistics
const stats = ref({
  averageMonthlySpend: 0,
  monthOverMonthChange: 0,
  recurringPercentage: 0,
  topCategory: "none",
  topCategoryPercentage: 0,
  topCategoryTrend: 0,
  paymentCompletionRate: 0,
  peakSpendingMonth: "",
  peakSpendingAmount: 0,
  avgOneTimeTransaction: 0
});

// ----- Define Computed ---------
const topPayments = computed(() => {
  return showAllPayments.value ? allMonthlyPayments.value : allMonthlyPayments.value.slice(0, 5);
});

const hasMorePayments = computed(() => {
  return allMonthlyPayments.value.length > 5;
});

const combinedPayments = computed(() => {
  // Process one-time payments from payment store
  const oneTimePayments = getPayments.value
    .filter((payment) => payment.paymentType !== "recurrent")
    .map((payment) => ({
      ...payment,
      isRecurring: false
    }));

  // Process recurring payment instances from recurrent store
  const recurringPayments = getPaymentInstances.value.map((payment) => {
    const recurrentPayment = recurrentStore.getRecurrentPayments.find((rec) => rec.id === payment.recurrentId);
    return {
      ...payment,
      isRecurring: true,
      categoryId: recurrentPayment?.categoryId || payment.categoryId
    };
  });

  // Combine and return all payments
  return [...oneTimePayments, ...recurringPayments];
});

// ----- Define Methods ---------

// Get monthly data points for the charts
function getMonthlyData() {
  const months = [];
  const recurringData = [];
  const oneTimeData = [];
  const totalData = [];

  // Generate an array of months for the chart
  for (let i = 0; i < monthsToDisplay.value; i++) {
    const monthDate = $dayjs().subtract(i, "month");
    months.unshift(monthDate.format("MMM YYYY"));

    // Initialize totals for this month
    recurringData.unshift(0);
    oneTimeData.unshift(0);
    totalData.unshift(0);
  }

  // Calculate the start date for our data range
  const startDate = $dayjs()
    .subtract(monthsToDisplay.value - 1, "month")
    .startOf("month");

  // Process all payments
  combinedPayments.value.forEach((payment) => {
    const dateField = payment.dueDate || payment.createdAt;
    if (!dateField) return;

    const paymentDate = $dayjs(dateField.toDate());

    // Only include payments within our date range
    if (paymentDate.isBefore(startDate)) return;

    // Find the index in our months array
    const monthIndex = months.findIndex((month) => {
      return month === paymentDate.format("MMM YYYY");
    });

    if (monthIndex !== -1) {
      if (payment.isRecurring) {
        recurringData[monthIndex] += payment.amount;
      } else {
        oneTimeData[monthIndex] += payment.amount;
      }
      totalData[monthIndex] += payment.amount;
    }
  });

  return { months, recurringData, oneTimeData, totalData };
}

// Generate the monthly trends chart
async function createMonthlyTrendsChart() {
  const { months, recurringData, oneTimeData, totalData } = getMonthlyData();
  const ctx = document.getElementById("monthlyTrendsChart");

  if (!ctx) return;

  // Prepare chart data
  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Total",
        data: totalData,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "rgb(54, 162, 235)",
        pointRadius: 4,
        borderWidth: 3,
        order: 3
      },
      {
        label: "Fijos",
        data: recurringData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "rgb(75, 192, 192)",
        pointRadius: 4,
        borderWidth: 3,
        order: 1
      },
      {
        label: "Únicos",
        data: oneTimeData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "rgb(255, 99, 132)",
        pointRadius: 4,
        borderWidth: 3,
        order: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#d1d5db", // gray-300 for dark theme
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: "circle"
        }
      },
      tooltip: {
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = formatPrice(context.raw);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#9ca3af", // gray-400 for dark theme
          callback: function (value) {
            return formatPrice(value);
          }
        },
        grid: {
          color: "rgba(107, 114, 128, 0.2)" // gray-500 with opacity
        }
      },
      x: {
        ticks: {
          color: "#9ca3af" // gray-400 for dark theme
        },
        grid: {
          display: false
        }
      }
    }
  };

  try {
    // If chart already exists, update the data
    if (monthlyTrendsChart) {
      monthlyTrendsChart.data = chartData;
      monthlyTrendsChart.options = chartOptions;
      monthlyTrendsChart.update();
    } else {
      // Create a new chart
      monthlyTrendsChart = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: chartOptions
      });
    }
  } catch (error) {
    console.error("Error updating monthly trends chart:", error);

    // If we encounter an error, try to fully recreate the chart
    try {
      if (monthlyTrendsChart) {
        monthlyTrendsChart.destroy();
      }

      // Wait for the next tick to ensure the canvas is properly cleared
      await nextTick();

      // Create a new chart instance
      monthlyTrendsChart = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: chartOptions
      });
    } catch (fallbackError) {
      console.error("Failed to recreate chart after error:", fallbackError);
      useToast("error", "Error al renderizar los gráficos");
    }
  }
}

// Generate the category distribution pie chart
async function updateCategoryPieChart() {
  const selectedMonthDate = $dayjs(selectedMonth.value, "YYYY-MM");
  selectedMonthName.value = selectedMonthDate.format("MMMM YYYY");

  // Filter payments for the selected month
  const monthPayments = combinedPayments.value.filter((payment) => {
    const dateField = payment.dueDate || payment.createdAt;
    if (!dateField) return false;
    const paymentDate = $dayjs(dateField.toDate());
    return paymentDate.month() === selectedMonthDate.month() && paymentDate.year() === selectedMonthDate.year();
  });

  allMonthlyPayments.value = [...monthPayments].sort((a, b) => b.amount - a.amount);

  // Check if we have data
  if (monthPayments.length === 0) {
    categoryDataExists.value = false;
    return;
  }

  categoryDataExists.value = true;

  // Group payments by categoryId
  const categorySums = {};

  monthPayments.forEach((payment) => {
    const categoryId = payment.categoryId || "other";
    if (!categorySums[categoryId]) {
      categorySums[categoryId] = 0;
    }
    categorySums[categoryId] += payment.amount;
  });

  // Convert to arrays for the chart
  const categoryKeys = Object.keys(categorySums);
  const amounts = Object.values(categorySums);

  // Get colors dynamically from the store or fallback to legacy colors
  const backgroundColors = categoryKeys.map((categoryKey) => getCategoryChartColor(categoryKey));

  const ctx = document.getElementById("categoryPieChart");
  if (!ctx) return;

  // Prepare chart data
  const chartData = {
    labels: categoryKeys.map((key) => getCategoryDisplayLabel(key)),
    datasets: [
      {
        data: amounts,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#d1d5db", // gray-300 for dark theme
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: "circle"
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = formatPrice(context.raw);
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  try {
    // If chart already exists, update the data
    if (categoryPieChart) {
      categoryPieChart.data = chartData;
      categoryPieChart.options = chartOptions;
      categoryPieChart.update();
    } else {
      // Create a new chart
      categoryPieChart = new Chart(ctx, {
        type: "doughnut",
        data: chartData,
        options: chartOptions
      });
    }
  } catch (error) {
    console.error("Error updating category pie chart:", error);

    // If we encounter an error, try to fully recreate the chart
    try {
      if (categoryPieChart) {
        categoryPieChart.destroy();
      }

      // Wait for the next tick to ensure the canvas is properly cleared
      await nextTick();

      // Create a new chart instance
      categoryPieChart = new Chart(ctx, {
        type: "doughnut",
        data: chartData,
        options: chartOptions
      });
    } catch (fallbackError) {
      console.error("Failed to recreate chart after error:", fallbackError);
      useToast("error", "Error al renderizar el gráfico de categorías");
    }
  }
}

// Get payments filtered by the selected date range
function getFilteredPayments() {
  const startDate = $dayjs()
    .subtract(monthsToDisplay.value - 1, "month")
    .startOf("month");

  return combinedPayments.value.filter((payment) => {
    const dateField = payment.dueDate || payment.createdAt;
    if (!dateField) return false;
    const paymentDate = $dayjs(dateField.toDate());
    return !paymentDate.isBefore(startDate);
  });
}

// Calculate statistics
function calculateStatistics() {
  const { months, recurringData, oneTimeData, totalData } = getMonthlyData();
  const filteredPayments = getFilteredPayments();

  // Calculate average monthly spend
  const totalSpend = totalData.reduce((sum, amount) => sum + amount, 0);
  stats.value.averageMonthlySpend = totalSpend / totalData.length;

  // Month-over-month change (current month vs previous month)
  const currentMonthTotal = totalData[totalData.length - 1] || 0;
  const previousMonthTotal = totalData[totalData.length - 2] || 0;
  if (previousMonthTotal > 0) {
    stats.value.monthOverMonthChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
  } else {
    stats.value.monthOverMonthChange = 0;
  }

  // Peak spending month
  let peakIndex = 0;
  let peakAmount = 0;
  totalData.forEach((amount, index) => {
    if (amount > peakAmount) {
      peakAmount = amount;
      peakIndex = index;
    }
  });
  stats.value.peakSpendingMonth = months[peakIndex] || "";
  stats.value.peakSpendingAmount = peakAmount;

  // Calculate recurring percentage
  const totalRecurring = recurringData.reduce((sum, amount) => sum + amount, 0);
  const grandTotal = totalRecurring + oneTimeData.reduce((sum, amount) => sum + amount, 0);

  if (grandTotal > 0) {
    stats.value.recurringPercentage = Math.round((totalRecurring / grandTotal) * 100);
  } else {
    stats.value.recurringPercentage = 0;
  }

  // Average one-time transaction amount
  const oneTimePayments = filteredPayments.filter((p) => !p.isRecurring);
  if (oneTimePayments.length > 0) {
    const oneTimeTotal = oneTimePayments.reduce((sum, p) => sum + p.amount, 0);
    stats.value.avgOneTimeTransaction = oneTimeTotal / oneTimePayments.length;
  } else {
    stats.value.avgOneTimeTransaction = 0;
  }

  // Find top category (using filtered payments)
  const categorySums = {};
  filteredPayments.forEach((payment) => {
    const categoryId = payment.categoryId || "other";
    if (!categorySums[categoryId]) {
      categorySums[categoryId] = 0;
    }
    categorySums[categoryId] += payment.amount;
  });

  let topCategoryId = "other";
  let topCategoryAmount = 0;
  Object.entries(categorySums).forEach(([categoryId, amount]) => {
    if (amount > topCategoryAmount) {
      topCategoryId = categoryId;
      topCategoryAmount = amount;
    }
  });

  stats.value.topCategory = topCategoryId;
  if (grandTotal > 0) {
    stats.value.topCategoryPercentage = Math.round((topCategoryAmount / grandTotal) * 100);
  } else {
    stats.value.topCategoryPercentage = 0;
  }

  // Category trend (compare first half vs second half of period)
  if (topCategoryId !== "other" && totalData.length >= 2) {
    const midPoint = Math.floor(totalData.length / 2);
    let firstHalfCategoryTotal = 0;
    let secondHalfCategoryTotal = 0;

    filteredPayments.forEach((payment) => {
      if ((payment.categoryId || "other") !== topCategoryId) return;
      const dateField = payment.dueDate || payment.createdAt;
      if (!dateField) return;
      const paymentDate = $dayjs(dateField.toDate());
      const monthLabel = paymentDate.format("MMM YYYY");
      const monthIdx = months.indexOf(monthLabel);
      if (monthIdx < midPoint) {
        firstHalfCategoryTotal += payment.amount;
      } else {
        secondHalfCategoryTotal += payment.amount;
      }
    });

    if (firstHalfCategoryTotal > 0) {
      stats.value.topCategoryTrend = ((secondHalfCategoryTotal - firstHalfCategoryTotal) / firstHalfCategoryTotal) * 100;
    } else {
      stats.value.topCategoryTrend = secondHalfCategoryTotal > 0 ? 100 : 0;
    }
  } else {
    stats.value.topCategoryTrend = 0;
  }

  // Calculate payment completion rate (using filtered payments)
  const totalPaymentsCount = filteredPayments.length;
  const completedPayments = filteredPayments.filter((payment) => payment.isPaid).length;

  if (totalPaymentsCount > 0) {
    stats.value.paymentCompletionRate = Math.round((completedPayments / totalPaymentsCount) * 100);
  } else {
    stats.value.paymentCompletionRate = 0;
  }
}

// Prepare available months for selection (based on fetched data)
function prepareAvailableMonths() {
  const months = [];

  for (let i = 0; i < 6; i++) {
    const monthDate = $dayjs().subtract(i, "month");
    months.push({
      label: monthDate.format("MMMM YYYY"),
      value: monthDate.format("YYYY-MM")
    });
  }

  availableMonths.value = months;

  // Set default selected month to current month
  selectedMonth.value = $dayjs().format("YYYY-MM");
}

// Update all charts
async function updateCharts() {
  await nextTick();
  updateCategoryPieChart();
  calculateStatistics();
  await createMonthlyTrendsChart();
}

// ----- Fetch Data ---------
async function fetchData() {
  isLoading.value = true;
  try {
    // Fetch last 6 months of data in parallel
    const startDate = $dayjs().subtract(5, 'month').startOf('month').toDate();
    const endDate = $dayjs().endOf('month').toDate();

    await Promise.all([
      paymentStore.fetchPayments({ startDate, endDate }),
      (async () => {
        await recurrentStore.fetchRecurrentPayments();
        await recurrentStore.fetchPaymentInstances(6);
      })()
    ]);

    // Prepare months dropdown
    prepareAvailableMonths();
  } catch (error) {
    console.error("Error fetching data:", error);
    useToast("error", "Error al cargar los datos del resumen");
  } finally {
    isLoading.value = false;
    // Wait for DOM to render canvas elements, then initialize charts
    await nextTick();
    await updateCharts();
  }
}

// ----- Initialize Data ---------
onMounted(async () => {
  // Ensure categories are loaded first
  await categoryStore.fetchCategories();

  await fetchData();
});

// ----- Define Watchers ---------
watch(monthsToDisplay, async () => {
  await updateCharts();
});

// ----- Set Page Meta ---------
useSeo({
  title: 'Resumen Financiero - PayTrackr',
  description: 'Obtené una visión completa de tus finanzas con el resumen detallado y análisis de PayTrackr.',
  path: '/summary',
  noindex: true,
});
</script>
