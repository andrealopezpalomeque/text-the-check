import { Timestamp } from 'firebase/firestore';

export interface ExpenseCategory {
  id: string;
  name: string;           // Spanish label (e.g., "Vivienda y Alquiler")
  color: string;          // Hex color (e.g., "#4682B4")
  userId: string;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;  // Soft delete
}

export interface CategoryState {
  categories: ExpenseCategory[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

// Default categories with their Spanish names and colors
export const DEFAULT_CATEGORIES: Omit<ExpenseCategory, 'id' | 'userId' | 'createdAt' | 'deletedAt'>[] = [
  { name: 'Vivienda y Alquiler', color: '#4682B4' },
  { name: 'Servicios', color: '#0072DF' },
  { name: 'Supermercado', color: '#1D9A38' },
  { name: 'Salidas', color: '#FF6347' },
  { name: 'Transporte', color: '#E6AE2C' },
  { name: 'Entretenimiento', color: '#6158FF' },
  { name: 'Salud', color: '#E84A8A' },
  { name: 'Fitness y Deportes', color: '#FF4500' },
  { name: 'Cuidado Personal', color: '#DDA0DD' },
  { name: 'Mascotas', color: '#3CAEA3' },
  { name: 'Ropa', color: '#800020' },
  { name: 'Viajes', color: '#FF8C00' },
  { name: 'Educación', color: '#9370DB' },
  { name: 'Suscripciones', color: '#20B2AA' },
  { name: 'Regalos', color: '#FF1493' },
  { name: 'Impuestos y Gobierno', color: '#8B4513' },
  { name: 'Otros', color: '#808080' },
];
