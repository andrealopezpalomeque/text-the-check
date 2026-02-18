import { Validator } from './validator';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type QueryConstraint,
  type QuerySnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import { getFirestoreInstance, getCurrentUser } from '~/utils/firebase'
import type {
  SchemaDefinition,
  ValidationResult,
  QueryOptions,
  DocumentWithId,
  CreateResult,
  UpdateResult,
  DeleteResult,
  FetchResult,
  FetchSingleResult
} from './types';

export abstract class Schema {
  protected abstract collectionName: string;
  protected abstract schema: SchemaDefinition;

  // Firestore instance (lazy initialized)
  private _db: ReturnType<typeof getFirestoreInstance> | null = null;

  private get db() {
    if (!this._db) {
      this._db = getFirestoreInstance();
    }
    return this._db;
  }

  constructor() {}

  // Get current user ID from Firebase Auth
  protected getCurrentUserId(): string | null {
    const user = getCurrentUser();
    return user ? user.uid : null;
  }

  // Format date for display using dayjs
  protected formatDate(timestamp: any): string {
    try {
      const { $dayjs } = useNuxtApp();

      // Handle dayjs objects
      if (timestamp && typeof timestamp.format === 'function') {
        return timestamp.format('DD/MM/YYYY');
      }
      // Handle Date objects
      if (timestamp instanceof Date) {
        return $dayjs(timestamp).format('DD/MM/YYYY');
      }
      // Handle Firestore Timestamps
      if (timestamp && typeof timestamp.toDate === 'function') {
        return $dayjs(timestamp.toDate()).format('DD/MM/YYYY');
      }
      return '';
    } catch {
      return '';
    }
  }

  // Validate document against schema
  validate(data: any): ValidationResult {
    return Validator.validateDocument(data, this.schema);
  }

  // Apply default values to document
  applyDefaults(data: any): any {
    return Validator.applyDefaults(data, this.schema);
  }

  // Validate references exist in Firestore
  async validateReferences(data: any): Promise<ValidationResult> {
    const errors: any[] = [];
    const userId = this.getCurrentUserId();

    if (!userId) {
      errors.push({
        field: 'userId',
        message: 'Usuario debe estar autenticado para validar referencias'
      });
      return { valid: false, errors };
    }

    // Validate each reference field
    for (const [fieldName, definition] of Object.entries(this.schema)) {
      if (definition.type === 'reference' && definition.referenceTo && data[fieldName]) {
        try {
          const refCollection = collection(this.db, definition.referenceTo);
          const refDoc = doc(refCollection, data[fieldName]);
          const refSnapshot = await getDoc(refDoc);

          if (!refSnapshot.exists()) {
            errors.push({
              field: fieldName,
              message: `El documento referenciado ${data[fieldName]} no existe en ${definition.referenceTo}`
            });
          } else {
            // Verify reference belongs to same user
            const refData = refSnapshot.data();
            if (refData.userId !== userId) {
              errors.push({
                field: fieldName,
                message: `El documento referenciado ${data[fieldName]} no pertenece al usuario actual`
              });
            }
          }
        } catch (error) {
          errors.push({
            field: fieldName,
            message: `Error validando referencia ${data[fieldName]}: ${error}`
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Prepare document for saving (add timestamps, userId, etc.)
  protected prepareForSave(data: any, isUpdate = false): any {
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error('Usuario debe estar autenticado para guardar documentos');
    }

    let prepared = { ...data };

    // Apply defaults
    prepared = this.applyDefaults(prepared);

    // Add userId if not present (required for all documents)
    if (!prepared.userId && this.schema.userId) {
      prepared.userId = userId;
    }

    if (!isUpdate) {
      // For new documents
      prepared.createdAt = serverTimestamp();
    }

    // Always update timestamp
    prepared.updatedAt = serverTimestamp();

    // Ensure date fields are properly handled for Firestore
    for (const [fieldName, definition] of Object.entries(this.schema)) {
      if (definition.type === 'date' && prepared[fieldName] !== undefined) {
        const dateValue = prepared[fieldName];

        // Skip if already a serverTimestamp or null
        if (dateValue === null || (dateValue && typeof dateValue === 'object' && dateValue.constructor.name === 'ServerTimestampTransform')) {
          continue;
        }

        // Convert dayjs objects, Date objects, or invalid dates to proper Firestore timestamps
        if (dateValue && typeof dateValue === 'object') {
          if (typeof dateValue.toDate === 'function') {
            // Already a Firestore timestamp, keep as is
            continue;
          } else if (dateValue._isAMomentObject || (dateValue.constructor && dateValue.constructor.name === 'Dayjs')) {
            // Convert dayjs to JavaScript Date
            prepared[fieldName] = dateValue.toDate ? dateValue.toDate() : new Date(dateValue.valueOf());
          } else if (dateValue instanceof Date) {
            // Keep Date objects as is - Firestore will convert them
            continue;
          }
        } else if (typeof dateValue === 'string') {
          // Convert string dates to Date objects
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            prepared[fieldName] = parsedDate;
          } else {
            console.warn(`Fecha inválida para el campo ${fieldName}:`, dateValue);
            prepared[fieldName] = null;
          }
        }
      }
    }

    return prepared;
  }

  // Convert Firestore document to DocumentWithId
  protected convertFirestoreDoc(docSnapshot: any): DocumentWithId {
    const data = docSnapshot.data();
    const id = docSnapshot.id;

    // Convert Firestore timestamps to formatted strings for display
    const convertedData: DocumentWithId = {
      id,
      ...data,
    };

    // Format common timestamp fields for display
    if (data.createdAt) {
      convertedData.createdAtFormatted = this.formatDate(data.createdAt);
    }
    if (data.updatedAt) {
      convertedData.updatedAtFormatted = this.formatDate(data.updatedAt);
    }

    return convertedData;
  }

  // Get Firestore collection reference
  protected getCollectionRef() {
    return collection(this.db, this.collectionName);
  }

  // Build user-scoped query
  protected buildUserQuery(additionalConstraints: QueryConstraint[] = []): any {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario debe estar autenticado para consultar documentos');
    }

    const baseConstraints = [where('userId', '==', userId)];
    return query(this.getCollectionRef(), ...baseConstraints, ...additionalConstraints);
  }

  // Add system fields and create document
  protected addSystemFields(data: any): any {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario debe estar autenticado para crear documentos');
    }

    let updatedData = { ...data };
    const schemaFields = this.schema;

    // If userId is part of schema, ensure it's set
    if (schemaFields.userId?.required) {
      updatedData.userId = userId;
    }

    // These fields will always be required
    updatedData.createdAt = serverTimestamp();
    updatedData.updatedAt = serverTimestamp();

    return updatedData;
  }

  // Create a new document
  async create(data: any, validateRefs = false): Promise<CreateResult> {
    try {
      // Add system fields
      data = this.addSystemFields(data);

      // Validate schema
      const validation = this.validate(data);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      // Validate references if requested
      if (validateRefs) {
        const refValidation = await this.validateReferences(data);
        if (!refValidation.valid) {
          return {
            success: false,
            error: `Validación de referencias fallida: ${refValidation.errors.map(e => e.message).join(', ')}`
          };
        }
      }

      // Prepare document for saving
      const prepared = this.prepareForSave(data, false);

      // Add to Firestore
      const docRef = await addDoc(this.getCollectionRef(), prepared);

      // Get the created document to return
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return { success: false, error: 'El documento no fue creado exitosamente' };
      }

      // Return with proper formatting
      return {
        success: true,
        data: this.convertFirestoreDoc(docSnapshot)
      };
    } catch (error) {
      console.error(`Error creando ${this.collectionName}:`, error);
      return { success: false, error: `Error al crear documento: ${error}` };
    }
  }

  // Update an existing document
  async update(id: string, data: any, validateRefs = false): Promise<UpdateResult> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Usuario debe estar autenticado para actualizar documentos' };
      }

      // Get document reference
      const docRef = doc(this.getCollectionRef(), id);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return { success: false, error: 'Documento no encontrado' };
      }

      const existingDoc = docSnapshot.data();

      // Verify user owns this document
      if (existingDoc.userId !== userId) {
        return { success: false, error: 'El documento no pertenece al usuario actual' };
      }

      // Validate schema (merge with existing data)
      const mergedData = { ...existingDoc, ...data };
      const validation = this.validate(mergedData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      // Validate references if requested
      if (validateRefs) {
        const refValidation = await this.validateReferences(mergedData);
        if (!refValidation.valid) {
          return {
            success: false,
            error: `Validación de referencias fallida: ${refValidation.errors.map(e => e.message).join(', ')}`
          };
        }
      }

      // Prepare document for saving
      const prepared = this.prepareForSave(data, true);

      // Update document in Firestore
      await updateDoc(docRef, prepared);

      return { success: true };
    } catch (error) {
      console.error(`Error actualizando ${this.collectionName}:`, error);
      return { success: false, error: `Error al actualizar documento: ${error}` };
    }
  }

  // Delete a document
  async delete(id: string): Promise<DeleteResult> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Usuario debe estar autenticado para eliminar documentos' };
      }

      // Get document reference
      const docRef = doc(this.getCollectionRef(), id);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return { success: false, error: 'Documento no encontrado' };
      }

      const existingDoc = docSnapshot.data();

      // Verify user owns this document
      if (existingDoc.userId !== userId) {
        return { success: false, error: 'El documento no pertenece al usuario actual' };
      }

      // Delete document from Firestore
      await deleteDoc(docRef);

      return { success: true };
    } catch (error) {
      console.error(`Error eliminando ${this.collectionName}:`, error);
      return { success: false, error: `Error al eliminar documento: ${error}` };
    }
  }

  // Soft delete (archive) a document
  async archive(id: string): Promise<UpdateResult> {
    return this.update(id, {
      isActive: false,
      deletedAt: serverTimestamp()
    }, false);
  }

  // Restore an archived document
  async restore(id: string): Promise<UpdateResult> {
    return this.update(id, {
      isActive: true,
      deletedAt: null
    }, false);
  }

  // Find by ID
  async findById(id: string): Promise<FetchSingleResult> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Usuario debe estar autenticado para buscar documentos' };
      }

      // Get document reference
      const docRef = doc(this.getCollectionRef(), id);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return { success: false, error: 'Documento no encontrado' };
      }

      const docData = docSnapshot.data();

      // Verify user owns this document
      if (docData.userId !== userId) {
        return { success: false, error: 'El documento no pertenece al usuario actual' };
      }

      return {
        success: true,
        data: this.convertFirestoreDoc(docSnapshot)
      };
    } catch (error) {
      console.error(`Error buscando ${this.collectionName} por ID:`, error);
      return { success: false, error: `Error al buscar documento: ${error}` };
    }
  }

  // Find multiple documents with query options
  async find(options: QueryOptions = {}): Promise<FetchResult> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Usuario debe estar autenticado para buscar documentos' };
      }

      // Build Firestore query constraints
      const constraints: QueryConstraint[] = [];

      // Apply where clauses
      if (options.where) {
        for (const condition of options.where) {
          constraints.push(where(condition.field, condition.operator, condition.value));
        }
      }

      // Apply ordering
      if (options.orderBy) {
        for (const order of options.orderBy) {
          constraints.push(orderBy(order.field, order.direction));
        }
      }

      // Apply limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // Build user-scoped query
      const q = this.buildUserQuery(constraints);

      // Execute query
      const querySnapshot = await getDocs(q);

      // Convert documents
      const documents = querySnapshot.docs.map(doc => this.convertFirestoreDoc(doc));

      return { success: true, data: documents };
    } catch (error) {
      console.error(`Error buscando ${this.collectionName}:`, error);
      return { success: false, error: `Error al buscar documentos: ${error}` };
    }
  }

  // Subscribe to real-time updates
  subscribeToCollection(
    callback: (documents: DocumentWithId[]) => void,
    options: QueryOptions = {}
  ): Unsubscribe | null {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.error('Usuario debe estar autenticado para suscribirse a documentos');
        return null;
      }

      // Build Firestore query constraints
      const constraints: QueryConstraint[] = [];

      // Apply where clauses
      if (options.where) {
        for (const condition of options.where) {
          constraints.push(where(condition.field, condition.operator, condition.value));
        }
      }

      // Apply ordering
      if (options.orderBy) {
        for (const order of options.orderBy) {
          constraints.push(orderBy(order.field, order.direction));
        }
      }

      // Apply limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // Build user-scoped query
      const q = this.buildUserQuery(constraints);

      // Set up real-time listener
      return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
        const documents = querySnapshot.docs.map(doc => this.convertFirestoreDoc(doc));
        callback(documents);
      }, (error) => {
        console.error(`Error en suscripción de ${this.collectionName}:`, error);
      });
    } catch (error) {
      console.error(`Error configurando suscripción de ${this.collectionName}:`, error);
      return null;
    }
  }
}
