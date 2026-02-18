import { db } from '../config/firebase.js'
import type { Payment } from '../types/index.js'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Create a new payment in Firestore
 */
export const createPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const paymentsRef = db.collection('ttc_payment')

    const payload: Record<string, unknown> = {
      groupId: payment.groupId,
      fromUserId: payment.fromUserId,
      toUserId: payment.toUserId,
      amount: payment.amount,
      recordedBy: payment.recordedBy,
      createdAt: FieldValue.serverTimestamp()
    }

    if (payment.note) {
      payload.note = payment.note
    }

    const docRef = await paymentsRef.add(payload)

    return docRef.id
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}

/**
 * Get all payments for a group
 */
export const getPaymentsByGroup = async (groupId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = db.collection('ttc_payment')
    const snapshot = await paymentsRef
      .where('groupId', '==', groupId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      }
    }) as Payment[]
  } catch (error) {
    console.error('Error getting payments by group:', error)
    return []
  }
}

/**
 * Get payments between two specific users in a group
 */
export const getPaymentsBetweenUsers = async (
  groupId: string,
  userAId: string,
  userBId: string
): Promise<Payment[]> => {
  try {
    const allPayments = await getPaymentsByGroup(groupId)

    return allPayments.filter(payment =>
      (payment.fromUserId === userAId && payment.toUserId === userBId) ||
      (payment.fromUserId === userBId && payment.toUserId === userAId)
    )
  } catch (error) {
    console.error('Error getting payments between users:', error)
    return []
  }
}

/**
 * Get a payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  try {
    const doc = await db.collection('ttc_payment').doc(paymentId).get()
    if (!doc.exists) {
      return null
    }
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date()
    } as Payment
  } catch (error) {
    console.error('Error getting payment by ID:', error)
    return null
  }
}

/**
 * Delete a payment
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
  try {
    await db.collection('ttc_payment').doc(paymentId).delete()
  } catch (error) {
    console.error('Error deleting payment:', error)
    throw error
  }
}
