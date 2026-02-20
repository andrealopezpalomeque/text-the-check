import { defineStore } from 'pinia'
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  documentId,
  doc,
  updateDoc
} from 'firebase/firestore'
import type { User, Balance, Settlement, PaymentInfo } from '~/types'

interface UserState {
  users: User[]
  allUsers: User[] // All users (unfiltered)
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    users: [],
    allUsers: [],
    loading: false,
    error: null
  }),

  getters: {
    getUserById: (state) => (userId: string) => state.users.find((u) => u.id === userId),
    getUserByPhone: (state) => (phoneNumber: string) => state.users.find((u) =>
      u.phone === phoneNumber || u.phoneNumber === phoneNumber
    ),
    getUserInitials: (state) => (userId: string, fallbackName?: string): string => {
      const user = state.users.find((u) => u.id === userId)
      const name = user ? user.name : fallbackName

      if (!name) return '??'

      const names = name.split(' ').filter(n => n.length > 0)
      if (names.length >= 2 && names[0] && names[1]) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
  },

  actions: {
    /**
     * Fetch all users or users by member IDs
     * @param memberIds - Optional array of user IDs to filter by (for group members)
     */
    async fetchUsers(memberIds?: string[]) {
      const { db } = useFirebase()
      this.loading = true
      this.error = null
      try {
        const usersRef = collection(db, 'ttc_user')

        // If memberIds provided and not empty, filter by those IDs
        if (memberIds && memberIds.length > 0) {
          // Firestore 'in' queries limited to 30 items, batch if needed
          const batches: User[][] = []
          for (let i = 0; i < memberIds.length; i += 30) {
            const batch = memberIds.slice(i, i + 30)
            const q = query(usersRef, where(documentId(), 'in', batch))
            const snapshot = await getDocs(q)
            batches.push(snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
            })) as User[])
          }
          const users = batches.flat().sort((a, b) => a.name.localeCompare(b.name))
          this.users = users
          this.allUsers = users
        } else {
          // Fetch all users
          const q = query(usersRef, orderBy('name'))
          const snapshot = await getDocs(q)
          const users = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          })) as User[]
          this.users = users
          this.allUsers = users
        }
      } catch (err: any) {
        console.error('Error fetching users:', err)
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    calculateBalances(): Balance[] {
      const expenseStore = useExpenseStore()
      const paymentStore = usePaymentStore()
      // Guard: if no users (or still loading), return empty
      if (this.users.length === 0) return []

      // Initialize balances map
      const balances = new Map<string, { paid: number; share: number; paymentAdjustment: number }>()
      this.users.forEach(u => balances.set(u.id, { paid: 0, share: 0, paymentAdjustment: 0 }))

      // Process each expense
      expenseStore.expenses.forEach(expense => {
        // 1. Add to payer's 'paid' amount
        const payer = balances.get(expense.userId)
        if (payer) {
          payer.paid += expense.amount
        }

        // 2. Determine who splits this expense
        let splitUserIds: string[] = []

        if (expense.splitAmong && expense.splitAmong.length > 0) {
          // splitAmong contains user IDs directly - use ONLY those specified
          // The payer is NOT auto-included; they must be explicitly listed
          // This allows logging expenses on behalf of others
          splitUserIds = expense.splitAmong.filter(id =>
            this.users.some(u => u.id === id)
          )

          // If no valid users found, fallback to everyone
          if (splitUserIds.length === 0) {
            splitUserIds = this.users.map(u => u.id)
          }
        } else {
          // Default: Everyone (when no specific mentions)
          splitUserIds = this.users.map(u => u.id)
        }

        // 3. Add to 'share' amount for each splitter
        const shareAmount = expense.amount / splitUserIds.length
        splitUserIds.forEach(uid => {
          const person = balances.get(uid)
          if (person) {
            person.share += shareAmount
          }
        })
      })

      // Process payments
      // When A pays B: A's net goes up (they're settling debt), B's net goes down
      paymentStore.payments.forEach(payment => {
        const fromUser = balances.get(payment.fromUserId)
        const toUser = balances.get(payment.toUserId)

        if (fromUser) {
          // Person who paid has their net balance increase (less debt)
          fromUser.paymentAdjustment += payment.amount
        }
        if (toUser) {
          // Person who received has their net balance decrease (received settlement)
          toUser.paymentAdjustment -= payment.amount
        }
      })

      // Convert map to array with rounded values for consistency
      return this.users.map(user => {
        const data = balances.get(user.id) || { paid: 0, share: 0, paymentAdjustment: 0 }
        const rawNet = data.paid - data.share + data.paymentAdjustment
        return {
          userId: user.id,
          paid: Math.round(data.paid),
          share: Math.round(data.share),
          net: Math.round(rawNet)
        }
      })
    },

    getSortedBalances(): Balance[] {
      return this.calculateBalances().sort((a, b) => b.net - a.net)
    },

    getDebtors(): Balance[] {
      return this.calculateBalances()
        .filter((balance) => balance.net < 0)
        .sort((a, b) => a.net - b.net)
    },

    getCreditors(): Balance[] {
      return this.calculateBalances()
        .filter((balance) => balance.net > 0)
        .sort((a, b) => b.net - a.net)
    },

    getUserTotalPaid(userId: string): number {
      const expenseStore = useExpenseStore()
      const userExpenses = expenseStore.getExpensesByUser(userId)
      return userExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    },

    /**
     * Calculate settlement recommendations (who should pay whom)
     * Uses direct-only algorithm: only creates settlements between people who shared expenses
     * Now includes payments to reduce outstanding debts
     */
    calculateSettlements(): Settlement[] {
      const expenseStore = useExpenseStore()
      const paymentStore = usePaymentStore()
      const settlements: Settlement[] = []

      // Build a debt graph: track how much each person owes each other person
      // debtGraph[debtor][creditor] = amount debtor owes creditor
      const debtGraph = new Map<string, Map<string, number>>()

      // Initialize debt graph
      this.users.forEach(user => {
        debtGraph.set(user.id, new Map<string, number>())
      })

      // Process each expense to build direct debt relationships
      expenseStore.expenses.forEach(expense => {
        const payerId = expense.userId

        // Determine who splits this expense
        let splitUserIds: string[] = []

        if (expense.splitAmong && expense.splitAmong.length > 0) {
          // Use ONLY the specified users - payer is NOT auto-included
          splitUserIds = expense.splitAmong.filter(id =>
            this.users.some(u => u.id === id)
          )

          if (splitUserIds.length === 0) {
            splitUserIds = this.users.map(u => u.id)
          }
        } else {
          splitUserIds = this.users.map(u => u.id)
        }

        // Calculate share per person
        const shareAmount = expense.amount / splitUserIds.length

        // Each participant (except payer) owes the payer their share
        splitUserIds.forEach(participantId => {
          if (participantId !== payerId) {
            const debtorDebts = debtGraph.get(participantId)
            if (debtorDebts) {
              const currentDebt = debtorDebts.get(payerId) || 0
              debtorDebts.set(payerId, currentDebt + shareAmount)
            }
          }
        })
      })

      // Process payments: reduce debts when payments are made
      // If A pays B, A's debt to B decreases (or B's debt to A increases)
      paymentStore.payments.forEach(payment => {
        const fromId = payment.fromUserId
        const toId = payment.toUserId

        // Get current debts in both directions
        const fromOwesTo = debtGraph.get(fromId)?.get(toId) || 0
        const toOwesFrom = debtGraph.get(toId)?.get(fromId) || 0

        // Payment from A to B reduces A's debt to B
        if (fromOwesTo >= payment.amount) {
          // Simple case: A owes enough to B, just reduce the debt
          debtGraph.get(fromId)?.set(toId, fromOwesTo - payment.amount)
        } else {
          // A paid more than they owed, or they were settling a debt in the other direction
          // First, clear A's debt to B
          debtGraph.get(fromId)?.set(toId, 0)
          // Then increase B's debt to A by the excess
          const excess = payment.amount - fromOwesTo
          debtGraph.get(toId)?.set(fromId, toOwesFrom + excess)
        }
      })

      // Now simplify the debt graph by netting out mutual debts
      // If A owes B $100 and B owes A $60, simplify to A owes B $40
      this.users.forEach(userA => {
        this.users.forEach(userB => {
          if (userA.id >= userB.id) return // Only process each pair once

          const aOwesB = debtGraph.get(userA.id)?.get(userB.id) || 0
          const bOwesA = debtGraph.get(userB.id)?.get(userA.id) || 0

          if (aOwesB > bOwesA) {
            // A owes B the net amount
            debtGraph.get(userA.id)?.set(userB.id, aOwesB - bOwesA)
            debtGraph.get(userB.id)?.set(userA.id, 0)
          } else if (bOwesA > aOwesB) {
            // B owes A the net amount
            debtGraph.get(userB.id)?.set(userA.id, bOwesA - aOwesB)
            debtGraph.get(userA.id)?.set(userB.id, 0)
          } else {
            // They're even
            debtGraph.get(userA.id)?.set(userB.id, 0)
            debtGraph.get(userB.id)?.set(userA.id, 0)
          }
        })
      })

      // Convert debt graph to settlement list
      // Only include settlements > $1 to filter out tiny amounts
      debtGraph.forEach((creditors, debtorId) => {
        creditors.forEach((amount, creditorId) => {
          if (amount > 1) {
            settlements.push({
              fromUserId: debtorId,
              toUserId: creditorId,
              amount: Math.round(amount)
            })
          }
        })
      })

      // Sort settlements for consistent display (largest amounts first)
      return settlements.sort((a, b) => b.amount - a.amount)
    },

    /**
     * Calculate simplified settlements (minimum transfers algorithm)
     * Uses net balances instead of tracking individual debts
     * This minimizes the number of transfers needed to settle all debts
     */
    calculateSimplifiedSettlements(): Settlement[] {
      const balances = this.calculateBalances()
      const settlements: Settlement[] = []

      // Separate into debtors (negative net) and creditors (positive net)
      // Use threshold of 1 to filter out tiny amounts (< $1)
      const debtors = balances
        .filter(b => b.net < -1)
        .map(b => ({ id: b.userId, amount: Math.abs(b.net) }))
        .sort((a, b) => b.amount - a.amount)

      const creditors = balances
        .filter(b => b.net > 1)
        .map(b => ({ id: b.userId, amount: b.net }))
        .sort((a, b) => b.amount - a.amount)

      // Make copies to avoid mutating during iteration
      const debtorsCopy = debtors.map(d => ({ ...d }))
      const creditorsCopy = creditors.map(c => ({ ...c }))

      // Greedy algorithm: match debtors to creditors
      let i = 0 // debtor index
      let j = 0 // creditor index

      while (i < debtorsCopy.length && j < creditorsCopy.length) {
        const debtor = debtorsCopy[i]
        const creditor = creditorsCopy[j]

        // Safety check (should never happen due to while condition)
        if (!debtor || !creditor) break

        // Settlement amount is the minimum of what debtor owes and creditor is owed
        const amount = Math.min(debtor.amount, creditor.amount)

        // Only include settlements > $1 to filter out tiny amounts
        if (amount > 1) {
          settlements.push({
            fromUserId: debtor.id,
            toUserId: creditor.id,
            amount: Math.round(amount)
          })
        }

        // Reduce amounts
        debtor.amount -= amount
        creditor.amount -= amount

        // Move to next debtor/creditor if fully settled
        if (debtor.amount < 1) i++
        if (creditor.amount < 1) j++
      }

      return settlements.sort((a, b) => b.amount - a.amount)
    },

    /**
     * Update user's aliases (for @mention matching)
     */
    async updateUserAliases(userId: string, aliases: string[]) {
      const { db } = useFirebase()

      try {
        const userRef = doc(db, 'ttc_user', userId)
        await updateDoc(userRef, { aliases })

        // Update local state
        const user = this.users.find(u => u.id === userId)
        if (user) {
          user.aliases = aliases
        }
        const allUser = this.allUsers.find(u => u.id === userId)
        if (allUser) {
          allUser.aliases = aliases
        }
      } catch (err: any) {
        console.error('Error updating aliases:', err)
        throw err
      }
    },

    /**
     * Update user's payment info
     */
    async updateUserPaymentInfo(userId: string, paymentInfo: PaymentInfo) {
      const { db } = useFirebase()

      try {
        const userRef = doc(db, 'ttc_user', userId)
        await updateDoc(userRef, { paymentInfo })

        // Update local state
        const user = this.users.find(u => u.id === userId)
        if (user) {
          user.paymentInfo = paymentInfo
        }
        const allUser = this.allUsers.find(u => u.id === userId)
        if (allUser) {
          allUser.paymentInfo = paymentInfo
        }
      } catch (err: any) {
        console.error('Error updating payment info:', err)
        throw err
      }
    }
  }
})
