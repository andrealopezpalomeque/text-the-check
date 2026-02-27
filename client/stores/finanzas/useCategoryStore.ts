import { defineStore } from 'pinia';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
// useAuth() composable is used for user ID (auto-imported by Nuxt)
import { CategorySchema } from '~/utils/odm/schemas/categorySchema';
import type { ExpenseCategory, CategoryState } from '~/types/finanzas/category';
import { DEFAULT_CATEGORIES } from '~/types/finanzas/category';

// Schema instance
const categorySchema = new CategorySchema();

export const useFinanzasCategoryStore = defineStore('finanzas-category', {
  state: (): CategoryState => ({
    categories: [],
    isLoading: false,
    isLoaded: false,
    error: null
  }),

  getters: {
    getCategories: (state): ExpenseCategory[] => {
      return state.categories.filter(cat => !cat.deletedAt);
    },

    getCategoryById: (state) => {
      return (id: string): ExpenseCategory | undefined => {
        return state.categories.find(cat => cat.id === id && !cat.deletedAt);
      };
    },

    getCategoryColor: (state) => {
      return (id: string): string => {
        const category = state.categories.find(cat => cat.id === id);
        return category?.color || '#808080';
      };
    },

    getCategoryName: (state) => {
      return (id: string): string => {
        const category = state.categories.find(cat => cat.id === id);
        return category?.name || 'Otros';
      };
    }
  },

  actions: {
    async fetchCategories() {
      const { firestoreUser } = useAuth();

      if (!firestoreUser.value) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      if (this.isLoaded) {
        return true;
      }

      this.isLoading = true;

      try {
        const result = await categorySchema.findActive();

        if (result.success && result.data) {
          this.categories = (result.data as ExpenseCategory[]).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          );
          this.isLoaded = true;

          if (this.categories.length === 0) {
            await this.seedDefaultCategories();
          }

          return true;
        } else {
          this.error = result.error || 'Error al obtener las categorías';
          return false;
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        this.error = 'Error al obtener las categorías';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async seedDefaultCategories() {
      const { firestoreUser } = useAuth();

      if (!firestoreUser.value) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      this.isLoading = true;

      try {
        const createdCategories: ExpenseCategory[] = [];

        for (const category of DEFAULT_CATEGORIES) {
          const result = await categorySchema.create({
            name: category.name,
            color: category.color,
            userId: firestoreUser.value.id,
            deletedAt: null
          });

          if (result.success && result.data) {
            createdCategories.push(result.data as ExpenseCategory);
          }
        }

        this.categories = createdCategories;
        return true;
      } catch (error) {
        console.error('Error seeding default categories:', error);
        this.error = 'Error al crear las categorías predeterminadas';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async createCategory(name: string, color: string) {
      const { firestoreUser } = useAuth();

      if (!firestoreUser.value) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      this.isLoading = true;

      try {
        const result = await categorySchema.create({
          name,
          color,
          userId: firestoreUser.value.id,
          deletedAt: null
        });

        if (result.success && result.data) {
          this.categories = [...this.categories, result.data as ExpenseCategory];

          return {
            success: true,
            categoryId: result.data.id
          };
        } else {
          this.error = result.error || 'Error al crear la categoría';
          return false;
        }
      } catch (error) {
        console.error('Error creating category:', error);
        this.error = 'Error al crear la categoría';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async updateCategory(id: string, updates: { name?: string; color?: string }) {
      this.isLoading = true;

      try {
        const result = await categorySchema.update(id, updates);

        if (result.success) {
          const index = this.categories.findIndex(cat => cat.id === id);
          if (index !== -1) {
            this.categories[index] = {
              ...this.categories[index],
              ...updates
            };
            this.categories = [...this.categories];
          }

          return true;
        } else {
          this.error = result.error || 'Error al actualizar la categoría';
          return false;
        }
      } catch (error) {
        console.error('Error updating category:', error);
        this.error = 'Error al actualizar la categoría';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteCategory(id: string) {
      this.isLoading = true;

      try {
        const result = await categorySchema.softDelete(id);

        if (result.success) {
          const index = this.categories.findIndex(cat => cat.id === id);
          if (index !== -1) {
            this.categories[index] = {
              ...this.categories[index],
              deletedAt: Timestamp.now()
            };
            this.categories = [...this.categories];
          }

          return true;
        } else {
          this.error = result.error || 'Error al eliminar la categoría';
          return false;
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        this.error = 'Error al eliminar la categoría';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async refetchCategories() {
      this.isLoaded = false;
      return this.fetchCategories();
    },

    clearState() {
      this.categories = [];
      this.isLoading = false;
      this.isLoaded = false;
      this.error = null;
    }
  }
});
