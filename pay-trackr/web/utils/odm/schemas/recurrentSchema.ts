import { Schema } from '../schema';
import type { SchemaDefinition, FetchResult } from '../types';

export class RecurrentSchema extends Schema {
  protected collectionName = 'p_t_recurrent';

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
    startDate: {
      type: 'string',
      required: false
    },
    dueDateDay: {
      type: 'string',
      required: true,
      maxLength: 2
    },
    endDate: {
      type: 'string',
      required: false
    },
    timePeriod: {
      type: 'string',
      required: false,
      default: 'monthly'
    },
    categoryId: {
      type: 'string',
      required: false,
      default: ''
    },
    isCreditCard: {
      type: 'boolean',
      required: false,
      default: false
    },
    creditCardId: {
      type: 'string',
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

  // Find all recurrent payments for user
  // Note: Sorting by title is done client-side to avoid composite index requirement
  async findAll(): Promise<FetchResult> {
    return this.find({});
  }

  // Find by category
  async findByCategory(categoryId: string): Promise<FetchResult> {
    return this.find({
      where: [{ field: 'categoryId', operator: '==', value: categoryId }]
    });
  }

  // Find active recurrent payments (without end date or end date in future)
  async findActive(): Promise<FetchResult> {
    // Note: This will need to be filtered client-side for endDate logic
    return this.find({});
  }
}
