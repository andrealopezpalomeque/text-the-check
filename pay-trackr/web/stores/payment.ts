import { defineStore } from 'pinia';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { getCurrentUser } from '~/utils/firebase';
import { PaymentSchema } from '~/utils/odm/schemas/paymentSchema';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface Payment {
  id: string;
  title: string;
  description: string;
  amount: number;
  categoryId: string;
  isPaid: boolean;
  paidDate: any;
  recurrentId: string | null;
  paymentType: 'recurrent' | 'one-time';
  userId: string;
  createdAt: any;
  dueDate: any;
  isWhatsapp?: boolean;
  status?: 'pending' | 'reviewed';
  source?: 'manual' | 'whatsapp-text' | 'whatsapp-audio' | 'whatsapp-image' | 'whatsapp-pdf';
  needsRevision?: boolean;
  recipient?: { name: string; cbu?: string | null; alias?: string | null; bank?: string | null } | null;
  audioTranscription?: string | null;
}

interface PaymentFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  isPaid?: boolean;
  searchTerm?: string;
  paymentType?: 'recurrent' | 'one-time' | 'all';
}

interface PaymentState {
  payments: Payment[];
  totalPayments: number;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  currentPayment: Payment | null;
  lastFilters: PaymentFilters | null;
}

// Schema instance
const paymentSchema = new PaymentSchema();

export const usePaymentStore = defineStore('payment', {
  state: (): PaymentState => ({
    payments: [],
    totalPayments: 0,
    isLoading: false,
    isLoaded: false,
    error: null,
    currentPayment: null,
    lastFilters: null
  }),

  getters: {
    getPayments: (state) => state.payments,
    getTotalPayments: (state) => state.totalPayments,
    getCurrentPayment: (state) => state.currentPayment,
    getMonthlyTotals: (state) => {
      const totals = {
        paid: 0,
        unpaid: 0
      };

      // Calculate only for current month
      const currentMonth = dayjs().format('MM');
      const currentYear = dayjs().format('YYYY');

      state.payments.forEach(payment => {
        const paymentDate = payment.createdAt
          ? dayjs(payment.createdAt.toDate ? payment.createdAt.toDate() : payment.createdAt)
          : null;

        if (paymentDate &&
            paymentDate.format('MM') === currentMonth &&
            paymentDate.format('YYYY') === currentYear) {
          if (payment.isPaid) {
            totals.paid += payment.amount;
          } else {
            totals.unpaid += payment.amount;
          }
        }
      });

      return totals;
    }
  },

  actions: {
    // Fetch payments with pagination and filtering
    async fetchPayments(filters: PaymentFilters = {}, forceRefresh = false) {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      // Check if we can use cached data (same filters and already loaded)
      const filtersMatch = this.lastFilters &&
        JSON.stringify(this.lastFilters) === JSON.stringify(filters);

      if (!forceRefresh && this.isLoaded && filtersMatch) {
        return true;
      }

      this.isLoading = true;

      try {
        // Build query options
        const queryOptions: any = {
          where: [],
          orderBy: [{ field: 'dueDate', direction: 'desc' as const }]
        };

        // Add payment type filter
        if (filters.paymentType && filters.paymentType !== 'all') {
          queryOptions.where.push({
            field: 'paymentType',
            operator: '==',
            value: filters.paymentType
          });
        }

        // Add paid/unpaid filter
        if (filters.isPaid !== undefined) {
          queryOptions.where.push({
            field: 'isPaid',
            operator: '==',
            value: filters.isPaid
          });
        }

        // Add category filter
        if (filters.category) {
          queryOptions.where.push({
            field: 'category',
            operator: '==',
            value: filters.category
          });
        }

        // Use date range if provided
        if (filters.startDate && filters.endDate) {
          const result = await paymentSchema.findByDateRange(
            filters.startDate,
            filters.endDate,
            filters.paymentType
          );

          if (result.success && result.data) {
            this.payments = result.data as Payment[];
          } else {
            this.error = result.error || 'Error al obtener los pagos';
            return false;
          }
        } else {
          // Standard query
          const result = await paymentSchema.find(queryOptions);

          if (result.success && result.data) {
            this.payments = result.data as Payment[];
          } else {
            this.error = result.error || 'Error al obtener los pagos';
            return false;
          }
        }

        this.isLoaded = true;
        this.lastFilters = { ...filters };

        return true;
      } catch (error) {
        console.error('Error fetching payments:', error);
        this.error = 'Error al obtener los pagos';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Get payment by ID
    async getPaymentById(paymentId: string) {
      this.isLoading = true;

      try {
        const result = await paymentSchema.findById(paymentId);

        if (result.success && result.data) {
          this.currentPayment = result.data as Payment;
          return this.currentPayment;
        } else {
          this.error = result.error || 'Pago no encontrado';
          return null;
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
        this.error = 'Error al obtener los detalles del pago';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    // Create a new payment
    async createPayment(paymentData: Omit<Payment, 'id'>) {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      this.isLoading = true;

      try {
        // Ensure payment has required fields
        const newPayment = {
          ...paymentData,
          userId: user.uid
        };

        const result = await paymentSchema.create(newPayment);

        if (result.success && result.data) {
          // Add to local state
          this.payments = [result.data as Payment, ...this.payments];
          this.totalPayments++;

          return {
            success: true,
            paymentId: result.data.id
          };
        } else {
          this.error = result.error || 'Error al crear el pago';
          return false;
        }
      } catch (error) {
        console.error('Error creating payment:', error);
        this.error = 'Error al crear el pago';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Update an existing payment
    async updatePayment(paymentId: string, updates: Partial<Payment>) {
      this.isLoading = true;

      try {
        const result = await paymentSchema.update(paymentId, updates);

        if (result.success) {
          // Update local state
          const index = this.payments.findIndex(p => p.id === paymentId);
          if (index !== -1) {
            this.payments[index] = {
              ...this.payments[index],
              ...updates
            };
          }

          // Update current payment if it's the same one
          if (this.currentPayment && this.currentPayment.id === paymentId) {
            this.currentPayment = {
              ...this.currentPayment,
              ...updates
            };
          }

          return true;
        } else {
          this.error = result.error || 'Error al actualizar el pago';
          return false;
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        this.error = 'Error al actualizar el pago';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Delete a payment
    async deletePayment(paymentId: string) {
      this.isLoading = true;

      try {
        const result = await paymentSchema.delete(paymentId);

        if (result.success) {
          // Update local state
          this.payments = this.payments.filter(p => p.id !== paymentId);
          this.totalPayments--;

          // Clear current payment if it's the same one
          if (this.currentPayment && this.currentPayment.id === paymentId) {
            this.currentPayment = null;
          }

          return true;
        } else {
          this.error = result.error || 'Error al eliminar el pago';
          return false;
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        this.error = 'Error al eliminar el pago';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Toggle payment status (paid/unpaid)
    async togglePaymentStatus(paymentId: string, isPaid: boolean) {
      this.isLoading = true;

      try {
        const result = await paymentSchema.update(paymentId, {
          isPaid: isPaid,
          paidDate: isPaid ? serverTimestamp() : null
        });

        if (result.success) {
          // Update local state
          const index = this.payments.findIndex(p => p.id === paymentId);
          if (index !== -1) {
            this.payments[index].isPaid = isPaid;
            this.payments[index].paidDate = isPaid ? new Date() : null;
          }

          // Update current payment if it's the same one
          if (this.currentPayment && this.currentPayment.id === paymentId) {
            this.currentPayment.isPaid = isPaid;
            this.currentPayment.paidDate = isPaid ? new Date() : null;
          }

          return true;
        } else {
          this.error = result.error || 'Error al actualizar el estado del pago';
          return false;
        }
      } catch (error) {
        console.error('Error toggling payment status:', error);
        this.error = 'Error al actualizar el estado del pago';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Clear store state
    clearState() {
      this.payments = [];
      this.totalPayments = 0;
      this.isLoaded = false;
      this.error = null;
      this.currentPayment = null;
      this.lastFilters = null;
    },

    // Force refresh data
    async refetchPayments(filters: PaymentFilters = {}) {
      return this.fetchPayments(filters, true);
    },

    // Mark a WhatsApp payment as reviewed
    async markAsReviewed(paymentId: string) {
      try {
        const result = await paymentSchema.update(paymentId, {
          status: 'reviewed',
          needsRevision: false
        });

        if (result.success) {
          // Update local state
          const index = this.payments.findIndex(p => p.id === paymentId);
          if (index !== -1) {
            this.payments[index].status = 'reviewed';
            this.payments[index].needsRevision = false;
          }

          // Update current payment if it's the same one
          if (this.currentPayment && this.currentPayment.id === paymentId) {
            this.currentPayment.status = 'reviewed';
            this.currentPayment.needsRevision = false;
          }

          return true;
        } else {
          this.error = result.error || 'Error al marcar como revisado';
          return false;
        }
      } catch (error) {
        console.error('Error marking payment as reviewed:', error);
        this.error = 'Error al marcar como revisado';
        return false;
      }
    }
  }
});
