import { defineStore } from 'pinia'
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import type { Payment } from '~/types'

interface PaymentState {
  payments: Payment[]
  loading: boolean
  initialized: boolean
  error: string | null
  unsubscribe: Unsubscribe | null
}

export const usePaymentStore = defineStore('payment', {
  state: (): PaymentState => ({
    payments: [],
    loading: false,
    initialized: false,
    error: null,
    unsubscribe: null
  }),

  getters: {
    /**
     * Get payments sorted by date (newest first)
     */
    sortedPayments: (state): Payment[] => {
      return [...state.payments].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    },

    /**
     * Get total payments amount
     */
    totalPayments: (state): number => {
      return state.payments.reduce((sum, payment) => sum + payment.amount, 0)
    }
  },

  actions: {
    /**
     * Initialize Firebase realtime listener for payments
     * @param groupId - Group ID to filter payments
     */
    initializeListeners(groupId: string) {
      const { db } = useFirebase()
      this.loading = true
      this.error = null

      // Stop existing listener before creating new one
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }

      try {
        const paymentsRef = collection(db, 'ttc_payment')
        const q = query(
          paymentsRef,
          where('groupId', '==', groupId),
          orderBy('createdAt', 'desc')
        )

        // Subscribe to realtime updates
        this.unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const payments = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                groupId: data.groupId,
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                amount: data.amount,
                recordedBy: data.recordedBy,
                note: data.note,
                createdAt: data.createdAt?.toDate() || new Date()
              } as Payment
            })
            this.payments = payments
            this.loading = false
            this.initialized = true
          },
          (error) => {
            console.error('Error listening to payments:', error)
            this.error = error.message
            this.loading = false
          }
        )
      } catch (error) {
        console.error('Error initializing payment listeners:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      }
    },

    /**
     * Stop listening to Firebase updates
     */
    stopListeners() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
      this.payments = []
      this.initialized = false
    },

    /**
     * Get payments between two specific users
     */
    getPaymentsBetweenUsers(userAId: string, userBId: string): Payment[] {
      return this.payments.filter(
        (payment) =>
          (payment.fromUserId === userAId && payment.toUserId === userBId) ||
          (payment.fromUserId === userBId && payment.toUserId === userAId)
      )
    },

    /**
     * Get payments by a specific user (either from or to)
     */
    getPaymentsByUser(userId: string): Payment[] {
      return this.payments.filter(
        (payment) =>
          payment.fromUserId === userId || payment.toUserId === userId
      )
    },

    /**
     * Add a new payment
     */
    async addPayment(
      groupId: string,
      fromUserId: string,
      toUserId: string,
      amount: number,
      recordedBy: string,
      authUid: string,
      note?: string
    ): Promise<string> {
      const { db } = useFirebase()

      try {
        const paymentsRef = collection(db, 'ttc_payment')
        const paymentData: Record<string, unknown> = {
          groupId,
          fromUserId,
          toUserId,
          amount,
          recordedBy,
          authUid,
          createdAt: Timestamp.now()
        }

        if (note) {
          paymentData.note = note
        }

        const docRef = await addDoc(paymentsRef, paymentData)
        return docRef.id
      } catch (error) {
        console.error('Error adding payment:', error)
        throw error
      }
    }
  }
})
