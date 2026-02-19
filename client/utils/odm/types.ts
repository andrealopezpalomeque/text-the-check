// ODM Types and Interfaces for PayTrackr

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'reference';

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  max?: number;
  min?: number;
  pattern?: RegExp;
  default?: any;
  arrayOf?: FieldType;
  referenceTo?: string; // Collection name for reference validation
}

export interface SchemaDefinition {
  [fieldName: string]: FieldDefinition;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface QueryOptions {
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains';
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
}

export interface DocumentWithId {
  id: string;
  [key: string]: any;
}

export interface CreateResult {
  success: boolean;
  data?: DocumentWithId;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface FetchResult<T = DocumentWithId> {
  success: boolean;
  data?: T[];
  error?: string;
}

export interface FetchSingleResult<T = DocumentWithId> {
  success: boolean;
  data?: T;
  error?: string;
}
