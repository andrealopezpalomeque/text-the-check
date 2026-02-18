import { defineStore } from 'pinia';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { getCurrentUser } from '~/utils/firebase';
import { CategorySchema } from '~/utils/odm/schemas/categorySchema';
import type { ExpenseCategory, CategoryState } from '~/interfaces/category';
import { DEFAULT_CATEGORIES } from '~/interfaces/category';

// Schema instance
const categorySchema = new CategorySchema();

export const useCategoryStore = defineStore('category', {
  state: (): CategoryState => ({
    categories: [],
    isLoading: false,
    isLoaded: false,
    error: null
  }),

  getters: {
    // Returns only active (non-deleted) categories
    getCategories: (state): ExpenseCategory[] => {
      return state.categories.filter(cat => !cat.deletedAt);
    },

    // Find category by ID
    getCategoryById: (state) => {
      return (id: string): ExpenseCategory | undefined => {
        return state.categories.find(cat => cat.id === id && !cat.deletedAt);
      };
    },

    // Get category color by ID (useful for display components)
    getCategoryColor: (state) => {
      return (id: string): string => {
        const category = state.categories.find(cat => cat.id === id);
        return category?.color || '#808080';
      };
    },

    // Get category name by ID
    getCategoryName: (state) => {
      return (id: string): string => {
        const category = state.categories.find(cat => cat.id === id);
        return category?.name || 'Otros';
      };
    }
  },

  actions: {
    // Fetch categories from Firestore, auto-seed if empty
    async fetchCategories() {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      // Don't refetch if already loaded
      if (this.isLoaded) {
        return true;
      }

      this.isLoading = true;

      try {
        const result = await categorySchema.findActive();

        if (result.success && result.data) {
          // Sort by name client-side to avoid composite index requirement
          this.categories = (result.data as ExpenseCategory[]).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          );
          this.isLoaded = true;

          // Auto-seed default categories if no categories exist
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

    // Seed default categories for new users
    async seedDefaultCategories() {
      const user = getCurrentUser();

      if (!user) {
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
            userId: user.uid,
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

    // Create a new category
    async createCategory(name: string, color: string) {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      this.isLoading = true;

      try {
        const result = await categorySchema.create({
          name,
          color,
          userId: user.uid,
          deletedAt: null
        });

        if (result.success && result.data) {
          // Add to local state
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

    // Update an existing category
    async updateCategory(id: string, updates: { name?: string; color?: string }) {
      this.isLoading = true;

      try {
        const result = await categorySchema.update(id, updates);

        if (result.success) {
          // Update local state
          const index = this.categories.findIndex(cat => cat.id === id);
          if (index !== -1) {
            this.categories[index] = {
              ...this.categories[index],
              ...updates
            };
            // Trigger reactivity
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

    // Soft delete a category
    async deleteCategory(id: string) {
      this.isLoading = true;

      try {
        const result = await categorySchema.softDelete(id);

        if (result.success) {
          // Update local state with soft delete
          const index = this.categories.findIndex(cat => cat.id === id);
          if (index !== -1) {
            this.categories[index] = {
              ...this.categories[index],
              deletedAt: Timestamp.now()
            };
            // Trigger reactivity
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

    // Force refetch categories (clears cache)
    async refetchCategories() {
      this.isLoaded = false;
      return this.fetchCategories();
    },

    // Clear store state
    clearState() {
      this.categories = [];
      this.isLoading = false;
      this.isLoaded = false;
      this.error = null;
    }
  }
});
