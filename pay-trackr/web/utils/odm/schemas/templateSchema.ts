import { Schema } from '../schema';
import type { SchemaDefinition, FetchResult, UpdateResult } from '../types';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { getFirestoreInstance, getCurrentUser } from '~/utils/firebase';

export class TemplateSchema extends Schema {
  protected collectionName = 'pt_payment_template';

  protected schema: SchemaDefinition = {
    userId: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string',
      required: true,
      maxLength: 200,
      minLength: 1
    },
    categoryId: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      required: false,
      maxLength: 500,
      default: ''
    },
    usageCount: {
      type: 'number',
      required: false,
      default: 0,
      min: 0
    },
    createdAt: {
      type: 'date',
      required: true
    },
    updatedAt: {
      type: 'date',
      required: false
    }
  };

  // Find all templates sorted by usage
  async findAllSortedByUsage(): Promise<FetchResult> {
    return this.find({
      orderBy: [{ field: 'usageCount', direction: 'desc' }]
    });
  }

  // Find templates by category
  async findByCategory(categoryId: string): Promise<FetchResult> {
    return this.find({
      where: [{ field: 'categoryId', operator: '==', value: categoryId }],
      orderBy: [{ field: 'usageCount', direction: 'desc' }]
    });
  }

  // Increment usage count when template is used
  async incrementUsage(templateId: string): Promise<UpdateResult> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const db = getFirestoreInstance();
      const docRef = doc(db, this.collectionName, templateId);

      await updateDoc(docRef, {
        usageCount: increment(1)
      });

      return { success: true };
    } catch (error) {
      console.error('Error incrementando uso de plantilla:', error);
      return { success: false, error: `Error al incrementar uso: ${error}` };
    }
  }
}
