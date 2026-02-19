import { Schema } from '../schema';
import type { SchemaDefinition } from '../types';

export class WeeklySummarySchema extends Schema {
  protected collectionName = 'p_t_weekly_summary';

  protected schema: SchemaDefinition = {
    userId: {
      type: 'string',
      required: true
    },
    stats: {
      type: 'object',
      required: true
    },
    aiInsight: {
      type: 'string',
      required: false
    },
    createdAt: {
      type: 'date',
      required: false
    }
  };
}
