import { Schema } from '../schema';
import type { SchemaDefinition, FetchResult } from '../types';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { getFirestoreInstance, getCurrentUser } from '~/utils/finanzas/firebase';

export class PaymentSchema extends Schema {
  protected collectionName = 'p_t_payment';

  protected schema: SchemaDefinition = {
    userId: {
      type: 'string',
      required: true
    },
    title: {
      type: 'string',
      required: true,
      maxLength: 200,
      minLength: 1
    },
    description: {
      type: 'string',
      required: false,
      maxLength: 500,
      default: ''
    },
    amount: {
      type: 'number',
      required: true,
      min: 0
    },
    categoryId: {
      type: 'string',
      required: false,
      default: ''
    },
    isPaid: {
      type: 'boolean',
      required: false,
      default: false
    },
    paidDate: {
      type: 'date',
      required: false
    },
    recurrentId: {
      type: 'string',
      required: false
    },
    paymentType: {
      type: 'string',
      required: true,
      default: 'one-time'
    },
    dueDate: {
      type: 'date',
      required: false
    },
    createdAt: {
      type: 'date',
      required: true
    },
    updatedAt: {
      type: 'date',
      required: false
    },
    isWhatsapp: {
      type: 'boolean',
      required: false,
      default: false
    },
    status: {
      type: 'string',
      required: false,
      default: 'reviewed'
    },
    source: {
      type: 'string',
      required: false,
      default: 'manual'
    },
    needsRevision: {
      type: 'boolean',
      required: false,
      default: false
    },
    recipient: {
      type: 'object',
      required: false,
      default: null
    },
    audioTranscription: {
      type: 'string',
      required: false,
      default: null
    }
  };

  // Find payments by date range
  async findByDateRange(startDate: Date, endDate: Date, paymentType?: string): Promise<FetchResult> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const db = getFirestoreInstance();
      const constraints: any[] = [
        where('userId', '==', user.uid),
        where('dueDate', '>=', Timestamp.fromDate(startDate)),
        where('dueDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('dueDate', 'desc')
      ];

      if (paymentType && paymentType !== 'all') {
        constraints.push(where('paymentType', '==', paymentType));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const snapshot = await getDocs(q);

      const documents = snapshot.docs.map(doc => this.convertFirestoreDoc(doc));
      return { success: true, data: documents };
    } catch (error) {
      console.error('Error buscando pagos por rango de fechas:', error);
      return { success: false, error: `Error al buscar pagos: ${error}` };
    }
  }

  // Find payments by recurrent ID
  async findByRecurrentId(recurrentId: string): Promise<FetchResult> {
    return this.find({
      where: [{ field: 'recurrentId', operator: '==', value: recurrentId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  // Find recurrent payment instances within date range
  async findRecurrentInstances(startDate: Date, endDate: Date): Promise<FetchResult> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const db = getFirestoreInstance();
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid),
        where('paymentType', '==', 'recurrent'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => this.convertFirestoreDoc(doc));
      return { success: true, data: documents };
    } catch (error) {
      console.error('Error buscando instancias de pagos fijos:', error);
      return { success: false, error: `Error al buscar instancias: ${error}` };
    }
  }

  // Find one-time payments for current month
  async findOneTimePayments(startDate: Date, endDate: Date): Promise<FetchResult> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const db = getFirestoreInstance();
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid),
        where('paymentType', '==', 'one-time'),
        where('dueDate', '>=', Timestamp.fromDate(startDate)),
        where('dueDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('dueDate', 'desc')
      );

      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => this.convertFirestoreDoc(doc));
      return { success: true, data: documents };
    } catch (error) {
      console.error('Error buscando pagos únicos:', error);
      return { success: false, error: `Error al buscar pagos: ${error}` };
    }
  }
}
