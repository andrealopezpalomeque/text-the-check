import { db } from '../config/firebase.js'
import type { Expense } from '../types/index.js'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Create a new expense in Firestore
 */
export const createExpense = async (expense: Expense): Promise<string> => {
  try {
    const expensesRef = db.collection('ttc_expense')

    const payload: Record<string, unknown> = {
      userId: expense.userId,
      userName: expense.userName,
      amount: expense.amount,
      originalInput: expense.originalInput,
      description: expense.description,
      category: expense.category,
      splitAmong: expense.splitAmong || [],
      timestamp: FieldValue.serverTimestamp()
    }

    if (expense.originalAmount !== undefined) {
      payload.originalAmount = expense.originalAmount
    }

    if (expense.originalCurrency !== undefined) {
      payload.originalCurrency = expense.originalCurrency
    }

    if (expense.groupId !== undefined) {
      payload.groupId = expense.groupId
    }

    const docRef = await expensesRef.add(payload)

    return docRef.id
  } catch (error) {
    console.error('Error creating expense:', error)
    throw error
  }
}

/**
 * Get all expenses for a user
 */
export const getExpensesByUser = async (userId: string): Promise<Expense[]> => {
  try {
    const expensesRef = db.collection('ttc_expense')
    const snapshot = await expensesRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[]
  } catch (error) {
    console.error('Error getting expenses:', error)
    return []
  }
}

/**
 * Delete an expense
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    await db.collection('ttc_expense').doc(expenseId).delete()
  } catch (error) {
    console.error('Error deleting expense:', error)
    throw error
  }
}

/**
 * Get recent expenses for a group
 */
export const getExpensesByGroup = async (groupId: string, limit = 10): Promise<Expense[]> => {
  try {
    const expensesRef = db.collection('ttc_expense')
    const snapshot = await expensesRef
      .where('groupId', '==', groupId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date()
      }
    }) as Expense[]
  } catch (error) {
    console.error('Error getting expenses by group:', error)
    return []
  }
}

/**
 * Get all expenses for a group (no limit, for balance calculation)
 */
export const getAllExpensesByGroup = async (groupId: string): Promise<Expense[]> => {
  try {
    const expensesRef = db.collection('ttc_expense')
    const snapshot = await expensesRef
      .where('groupId', '==', groupId)
      .orderBy('timestamp', 'desc')
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date()
      }
    }) as Expense[]
  } catch (error) {
    console.error('Error getting all expenses by group:', error)
    return []
  }
}

/**
 * Get an expense by ID
 */
export const getExpenseById = async (expenseId: string): Promise<Expense | null> => {
  try {
    const doc = await db.collection('ttc_expense').doc(expenseId).get()
    if (!doc.exists) {
      return null
    }
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate?.() || new Date()
    } as Expense
  } catch (error) {
    console.error('Error getting expense by ID:', error)
    return null
  }
}
