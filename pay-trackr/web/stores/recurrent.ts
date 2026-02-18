import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { getFirestoreInstance, getCurrentUser } from "~/utils/firebase";
import { RecurrentSchema } from "~/utils/odm/schemas/recurrentSchema";
import { PaymentSchema } from "~/utils/odm/schemas/paymentSchema";
import customParseFormat from "dayjs/plugin/customParseFormat";

interface RecurrentPayment {
  id: string;
  title: string;
  description: string;
  amount: number;
  startDate: string;
  dueDateDay: string;
  endDate: string | null;
  timePeriod: string;
  categoryId: string;
  isCreditCard: boolean;
  creditCardId: string | null;
  userId: string;
  createdAt: any;
}

interface PaymentInstance {
  id: string;
  title: string;
  description: string;
  amount: number;
  categoryId: string;
  isPaid: boolean;
  paidDate: any;
  recurrentId: string;
  paymentType: string;
  userId: string;
  createdAt: any;
}

interface MonthPaymentStatus {
  amount: number;
  dueDate: string;
  paymentId: string;
  isPaid: boolean;
}

interface RecurrentWithMonths {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDateDay: string;
  categoryId: string;
  months: {
    [month: string]: MonthPaymentStatus;
  };
}

interface RecurrentState {
  recurrentPayments: RecurrentPayment[];
  paymentInstances: PaymentInstance[];
  processedRecurrents: RecurrentWithMonths[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetchedMonthsBack: number;
}

// Schema instances
const recurrentSchema = new RecurrentSchema();
const paymentSchema = new PaymentSchema();

export const useRecurrentStore = defineStore("recurrent", {
  state: (): RecurrentState => ({
    recurrentPayments: [],
    paymentInstances: [],
    processedRecurrents: [],
    isLoaded: false,
    isLoading: false,
    error: null,
    lastFetchedMonthsBack: 0
  }),

  getters: {
    getRecurrentPayments: (state) => state.recurrentPayments,
    getPaymentInstances: (state) => state.paymentInstances,
    getProcessedRecurrents: (state) => state.processedRecurrents,
    isDataLoaded: (state) => state.isLoaded,
    getMonthlyTotals: (state) => {
      const totals: { [month: string]: { paid: number; unpaid: number } } = {};

      state.processedRecurrents.forEach((recurrent) => {
        Object.entries(recurrent.months).forEach(([month, data]) => {
          if (!totals[month]) {
            totals[month] = { paid: 0, unpaid: 0 };
          }

          if (data.isPaid) {
            totals[month].paid += data.amount;
          } else {
            totals[month].unpaid += data.amount;
          }
        });
      });

      return totals;
    }
  },

  actions: {
    async fetchRecurrentPayments(forceRefresh = false) {
      const user = getCurrentUser();

      if (!user) {
        this.$state.error = "Usuario no autenticado";
        return false;
      }

      // Skip fetch if already loaded (unless force refresh)
      if (!forceRefresh && this.recurrentPayments.length > 0) {
        return true;
      }

      this.isLoading = true;

      try {
        const result = await recurrentSchema.find({});

        if (result.success && result.data) {
          // Sort by title client-side to avoid composite index requirement
          this.recurrentPayments = (result.data as RecurrentPayment[]).sort((a, b) =>
            (a.title || '').localeCompare(b.title || '')
          );
          return true;
        } else {
          this.$state.error = result.error || "Error al obtener los pagos fijos";
          return false;
        }
      } catch (error) {
        console.error("Error fetching recurrent payments:", error);
        this.$state.error = "Error al obtener los pagos fijos";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPaymentInstances(monthsBack = 6, forceRefresh = false, skipProcess = false) {
      const user = getCurrentUser();
      const { $dayjs } = useNuxtApp();

      if (!user) {
        this.$state.error = "Usuario no autenticado";
        return false;
      }

      // Skip fetch if already loaded with enough months (unless force refresh)
      if (!forceRefresh && this.isLoaded && this.lastFetchedMonthsBack >= monthsBack) {
        if (!skipProcess) {
          this.processData(monthsBack);
        }
        return true;
      }

      this.isLoading = true;

      try {
        // Calculate date range - from X months ago to current date
        const startDate = $dayjs().subtract(monthsBack, "month").startOf("month").toDate();
        const endDate = $dayjs().endOf("month").toDate();

        // Fetch all payment instances within date range
        const result = await paymentSchema.findRecurrentInstances(startDate, endDate);

        if (result.success && result.data) {
          this.paymentInstances = result.data as PaymentInstance[];
          if (!skipProcess) {
            this.processData(monthsBack);
          }
          this.isLoaded = true;
          this.lastFetchedMonthsBack = monthsBack;
          return true;
        } else {
          this.$state.error = result.error || "Error al obtener las instancias de pago";
          return false;
        }
      } catch (error) {
        console.error("Error fetching payment instances:", error);
        this.$state.error = "Error al obtener las instancias de pago";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async createRecurrentPayment(payment: Omit<RecurrentPayment, "id">) {
      this.isLoading = true;

      try {
        const result = await recurrentSchema.create(payment);

        if (result.success && result.data) {
          // Add to local state
          this.recurrentPayments.push(result.data as RecurrentPayment);

          // Reprocess data
          this.processData();
          return true;
        } else {
          this.$state.error = result.error || "Error al crear el pago fijo";
          return false;
        }
      } catch (error) {
        console.error("Error creating recurrent payment:", error);
        this.$state.error = "Error al crear el pago fijo";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    processData(monthsBack = 6) {
      const { $dayjs } = useNuxtApp();
      const processedData: RecurrentWithMonths[] = [];

      // Create months array with year context
      const monthsWithYear = Array.from({ length: monthsBack }, (_, i) => {
        const date = $dayjs().subtract(i, "month");
        return {
          key: date.format("MMM"),
          display: date.format("MMM"),
          year: date.format("YYYY"),
          fullDate: date
        };
      }).reverse();

      // Index payment instances by recurrentId for O(1) lookup
      const instancesByRecurrentId = new Map<string, PaymentInstance[]>();
      this.paymentInstances.forEach((payment) => {
        const list = instancesByRecurrentId.get(payment.recurrentId) || [];
        list.push(payment);
        instancesByRecurrentId.set(payment.recurrentId, list);
      });

      // Group by recurrent payment ID
      this.recurrentPayments.forEach((recurrent) => {
        const recurrentWithMonths: RecurrentWithMonths = {
          id: recurrent.id,
          title: recurrent.title,
          description: recurrent.description,
          amount: recurrent.amount,
          dueDateDay: recurrent.dueDateDay,
          categoryId: recurrent.categoryId,
          months: {}
        };

        // Parse recurrent payment's startDate and endDate
        const recurrentStartDate = recurrent.startDate ? $dayjs(recurrent.startDate) : null;
        const recurrentEndDate = recurrent.endDate ? $dayjs(recurrent.endDate) : null;

        // Initialize months with empty data - only for months within the valid date range
        monthsWithYear.forEach((month) => {
          // Check if this month is within the recurrent payment's valid range
          const monthStart = month.fullDate.startOf("month");
          const monthEnd = month.fullDate.endOf("month");

          // Skip months before the startDate
          if (recurrentStartDate && monthEnd.isBefore(recurrentStartDate, "month")) {
            return; // Don't create entry for months before subscription started
          }

          // Skip months after the endDate (if set)
          if (recurrentEndDate && monthStart.isAfter(recurrentEndDate, "month")) {
            return; // Don't create entry for months after subscription ended
          }

          recurrentWithMonths.months[month.key] = {
            amount: recurrent.amount,
            dueDate: this.generateDueDate(recurrent.dueDateDay, month.fullDate),
            paymentId: "",
            isPaid: false
          };
        });

        // Fill in actual payment data from indexed map
        const instances = instancesByRecurrentId.get(recurrent.id) || [];
        instances.forEach((payment) => {
          const paymentDate = $dayjs(payment.createdAt.toDate ? payment.createdAt.toDate() : payment.createdAt);
          const paymentMonth = paymentDate.format("MMM");

          // Match payment to the correct month and year
          const matchingMonth = monthsWithYear.find(
            (m) => m.key === paymentMonth && m.year === paymentDate.format("YYYY")
          );

          if (matchingMonth && recurrentWithMonths.months[matchingMonth.key] !== undefined) {
            recurrentWithMonths.months[matchingMonth.key] = {
              amount: payment.amount,
              dueDate: paymentDate.format("MM/DD/YYYY"),
              paymentId: payment.id,
              isPaid: payment.isPaid
            };
          }
        });

        processedData.push(recurrentWithMonths);
      });

      this.processedRecurrents = processedData;
    },

    generateDueDate(day: string, date: any) {
      return date.date(parseInt(day)).format("MM/DD/YYYY");
    },

    async togglePaymentStatus(paymentId: string, isPaid: boolean) {
      const db = getFirestoreInstance();
      this.isLoading = true;

      try {
        await updateDoc(doc(db, "p_t_payment", paymentId), {
          isPaid: isPaid,
          paidDate: isPaid ? serverTimestamp() : null
        });

        // Update local state
        const paymentIndex = this.paymentInstances.findIndex((p) => p.id === paymentId);
        if (paymentIndex !== -1) {
          this.paymentInstances[paymentIndex].isPaid = isPaid;
        }

        // Reprocess data to reflect changes
        this.processData();
        return true;
      } catch (error) {
        console.error("Error toggling payment status:", error);
        this.$state.error = "Error al actualizar el estado del pago";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async addNewPaymentInstance(recurrentId: string, month: string, isPaid = false, year?: string) {
      const user = getCurrentUser();
      const db = getFirestoreInstance();
      const { $dayjs } = useNuxtApp();
      $dayjs.extend(customParseFormat);

      if (!user) {
        this.$state.error = "Usuario no autenticado";
        return false;
      }

      this.isLoading = true;

      try {
        // Find the recurrent payment
        const recurrent = this.recurrentPayments.find((r) => r.id === recurrentId);
        if (!recurrent) {
          this.$state.error = "Pago fijo no encontrado";
          return false;
        }

        // Create payment date based on the month, day, and year
        const monthIndex = $dayjs(month, "MMM").month();

        // Determine the correct year
        let paymentYear: number;
        if (year) {
          paymentYear = parseInt(year);
        } else {
          // If no year provided, infer based on month
          const currentMonth = $dayjs().month();
          const currentYear = $dayjs().year();

          if (monthIndex > currentMonth) {
            paymentYear = currentYear - 1;
          } else {
            paymentYear = currentYear;
          }
        }

        const paymentDate = $dayjs()
          .year(paymentYear)
          .month(monthIndex)
          .date(parseInt(recurrent.dueDateDay))
          .toDate();

        // Create the new payment instance
        const newPayment = {
          title: recurrent.title,
          description: recurrent.description,
          amount: recurrent.amount,
          categoryId: recurrent.categoryId,
          isPaid: isPaid,
          paidDate: isPaid ? serverTimestamp() : null,
          recurrentId: recurrentId,
          paymentType: "recurrent",
          userId: user.uid,
          createdAt: Timestamp.fromDate(paymentDate)
        };

        const docRef = await addDoc(collection(db, "p_t_payment"), newPayment);

        // Add to local state
        this.paymentInstances.push({
          id: docRef.id,
          ...newPayment
        } as PaymentInstance);

        // Reprocess data
        this.processData();
        return true;
      } catch (error) {
        console.error("Error creating payment instance:", error);
        this.$state.error = "Error al crear la instancia de pago";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async updateRecurrentPayment(recurrentId: string, updates: Partial<RecurrentPayment>) {
      this.isLoading = true;

      try {
        const result = await recurrentSchema.update(recurrentId, updates);

        if (result.success) {
          // Update local state
          const index = this.recurrentPayments.findIndex((r) => r.id === recurrentId);
          if (index !== -1) {
            this.recurrentPayments[index] = {
              ...this.recurrentPayments[index],
              ...updates
            };
          }

          // Reprocess data
          this.processData();
          return true;
        } else {
          this.$state.error = result.error || "Error al actualizar el pago fijo";
          return false;
        }
      } catch (error) {
        console.error("Error updating recurrent payment:", error);
        this.$state.error = "Error al actualizar el pago fijo";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRecurrentPayment(recurrentId: string) {
      const db = getFirestoreInstance();
      this.isLoading = true;
      let deletedInstances = 0;

      try {
        // Step 1: Find all payment instances associated with this recurrent payment
        const user = getCurrentUser();
        if (!user) {
          this.$state.error = "Usuario no autenticado";
          return false;
        }

        const paymentInstancesQuery = query(
          collection(db, "p_t_payment"),
          where("recurrentId", "==", recurrentId),
          where("userId", "==", user.uid)
        );

        const instancesSnapshot = await getDocs(paymentInstancesQuery);

        // Step 2: Delete all payment instances in a batch
        const deletePromises = instancesSnapshot.docs.map(async (doc) => {
          await deleteDoc(doc.ref);
          deletedInstances++;
        });

        // Execute all delete operations
        await Promise.all(deletePromises);

        // Step 3: Delete the recurrent payment itself
        const result = await recurrentSchema.delete(recurrentId);

        if (!result.success) {
          this.$state.error = result.error || "Error al eliminar el pago fijo";
          return false;
        }

        // Step 4: Update local state
        this.paymentInstances = this.paymentInstances.filter((p) => p.recurrentId !== recurrentId);
        this.recurrentPayments = this.recurrentPayments.filter((r) => r.id !== recurrentId);
        this.processedRecurrents = this.processedRecurrents.filter((r) => r.id !== recurrentId);

        return true;
      } catch (error: any) {
        console.error("Error deleting recurrent payment:", error);
        this.$state.error = `Error al eliminar el pago: ${error.message || "Error desconocido"}`;
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Additional utility methods as needed
    sortRecurrents(orderBy: string, direction: "asc" | "desc") {
      this.processedRecurrents.sort((a, b) => {
        let comparison = 0;

        switch (orderBy) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "amount":
            comparison = a.amount - b.amount;
            break;
          case "date":
            comparison = parseInt(a.dueDateDay) - parseInt(b.dueDateDay);
            break;
          default:
            comparison = a.title.localeCompare(b.title);
        }

        return direction === "asc" ? comparison : -comparison;
      });
    },

    searchRecurrents(query: string) {
      if (!query) {
        this.processData();
        return;
      }

      const searchTerm = query.toLowerCase();
      const filteredData = this.processedRecurrents.filter(
        (recurrent) =>
          recurrent.title.toLowerCase().includes(searchTerm) ||
          recurrent.description.toLowerCase().includes(searchTerm) ||
          recurrent.amount.toString().includes(searchTerm)
      );

      this.processedRecurrents = filteredData;
    },

    // Force refresh data
    async refetchAll(monthsBack = 6) {
      this.isLoaded = false;
      this.lastFetchedMonthsBack = 0;
      await this.fetchRecurrentPayments(true);
      await this.fetchPaymentInstances(monthsBack, true);
    },

    // Clear store state
    clearState() {
      this.recurrentPayments = [];
      this.paymentInstances = [];
      this.processedRecurrents = [];
      this.isLoaded = false;
      this.isLoading = false;
      this.error = null;
      this.lastFetchedMonthsBack = 0;
    }
  }
});
