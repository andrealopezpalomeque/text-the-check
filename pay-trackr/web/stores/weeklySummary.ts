import { defineStore } from 'pinia';
import { getCurrentUser } from '~/utils/firebase';
import { WeeklySummarySchema } from '~/utils/odm/schemas/weeklySummarySchema';

interface WeekStats {
  count: number;
  amount: number;
  paidCount: number;
  unpaidCount: number;
  unpaidAmount: number;
}

interface WeeklySummaryStats {
  pastWeek: WeekStats;
  nextWeek: WeekStats;
  totalUnpaidAmount: number;
  paidThisMonth: number;
  unpaidThisMonth: number;
  totalPaidAmount: number;
  oneTimeCount: number;
  oneTimeAmount: number;
}

interface WeeklySummary {
  id: string;
  userId: string;
  stats: WeeklySummaryStats;
  aiInsight: string | null;
  createdAt: any;
}

interface WeeklySummaryState {
  summary: WeeklySummary | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

// Schema instance
const weeklySummarySchema = new WeeklySummarySchema();

export const useWeeklySummaryStore = defineStore('weeklySummary', {
  state: (): WeeklySummaryState => ({
    summary: null,
    isLoading: false,
    isLoaded: false,
    error: null
  }),

  getters: {
    hasSummary: (state): boolean => {
      return state.summary !== null;
    },

    getStats: (state): WeeklySummaryStats | null => {
      return state.summary?.stats ?? null;
    },

    getAiInsight: (state): string | null => {
      return state.summary?.aiInsight ?? null;
    }
  },

  actions: {
    async fetchSummary() {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      // Don't refetch if already loaded
      if (this.isLoaded) {
        return true;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const result = await weeklySummarySchema.findById(user.uid);

        if (result.success && result.data) {
          this.summary = result.data as WeeklySummary;
          this.isLoaded = true;
          return true;
        }

        // Doc doesn't exist (CRON hasn't run yet) — treat as non-error
        this.summary = null;
        this.isLoaded = true;
        return true;
      } catch (error) {
        console.error('Error fetching weekly summary:', error);
        this.error = 'Error al obtener el resumen semanal';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Clear store state
    clearState() {
      this.summary = null;
      this.isLoading = false;
      this.isLoaded = false;
      this.error = null;
    }
  }
});
