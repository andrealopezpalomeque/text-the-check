import { Schema } from '../schema';
import type { SchemaDefinition, FetchResult, CreateResult } from '../types';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { getCurrentUser } from '~/utils/finanzas/firebase';
import { DEFAULT_CATEGORIES } from '~/types/finanzas/category';

export class CategorySchema extends Schema {
  protected collectionName = 'p_t_expense_category';

  protected schema: SchemaDefinition = {
    userId: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string',
      required: true,
      maxLength: 100,
      minLength: 1
    },
    color: {
      type: 'string',
      required: true,
      maxLength: 20,
      pattern: /^#[0-9A-Fa-f]{6}$/
    },
    deletedAt: {
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
    }
  };

  // Find all active categories (not soft-deleted)
  async findActive(): Promise<FetchResult> {
    const result = await this.find({});

    if (result.success && result.data) {
      // Filter out soft-deleted categories
      result.data = result.data.filter(cat => !cat.deletedAt);
    }

    return result;
  }

  // Soft delete a category
  async softDelete(id: string): Promise<{ success: boolean; error?: string }> {
    return this.update(id, {
      deletedAt: serverTimestamp()
    });
  }

  // Seed default categories for a new user
  async seedDefaults(): Promise<{ success: boolean; categories?: any[]; error?: string }> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const createdCategories: any[] = [];

    try {
      for (const category of DEFAULT_CATEGORIES) {
        const result = await this.create({
          name: category.name,
          color: category.color,
          userId: user.uid,
          deletedAt: null
        });

        if (result.success && result.data) {
          createdCategories.push(result.data);
        }
      }

      return { success: true, categories: createdCategories };
    } catch (error) {
      console.error('Error seeding default categories:', error);
      return { success: false, error: `Error al crear categorías predeterminadas: ${error}` };
    }
  }
}
