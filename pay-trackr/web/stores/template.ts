import { defineStore } from 'pinia';
import { Timestamp } from 'firebase/firestore';
import { getCurrentUser } from '~/utils/firebase';
import { TemplateSchema } from '~/utils/odm/schemas/templateSchema';

interface PaymentTemplate {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  userId: string;
  createdAt: any;
  usageCount: number;
}

interface TemplateState {
  templates: PaymentTemplate[];
  isLoading: boolean;
  error: string | null;
}

// Schema instance
const templateSchema = new TemplateSchema();

export const useTemplateStore = defineStore('template', {
  state: (): TemplateState => ({
    templates: [],
    isLoading: false,
    error: null
  }),

  getters: {
    getTemplates: (state) => state.templates,
    // Sort by usage count (most used first)
    getTemplatesSorted: (state) => {
      return [...state.templates].sort((a, b) => b.usageCount - a.usageCount);
    }
  },

  actions: {
    // Fetch all templates for current user
    async fetchTemplates() {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      this.isLoading = true;

      try {
        const result = await templateSchema.findAllSortedByUsage();

        if (result.success && result.data) {
          this.templates = result.data as PaymentTemplate[];
          return true;
        } else {
          this.error = result.error || 'Error al obtener las plantillas';
          return false;
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        this.error = 'Error al obtener las plantillas';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Create new template
    async createTemplate(templateData: Omit<PaymentTemplate, 'id' | 'createdAt' | 'usageCount'>) {
      const user = getCurrentUser();

      if (!user) {
        this.error = 'Usuario no autenticado';
        return false;
      }

      this.isLoading = true;

      try {
        // Prepare clean data
        const cleanData: any = {
          name: templateData.name,
          categoryId: templateData.categoryId,
          userId: user.uid,
          usageCount: 0
        };

        // Only add description if it has a value
        if (templateData.description) {
          cleanData.description = templateData.description;
        }

        const result = await templateSchema.create(cleanData);

        if (result.success && result.data) {
          // Add to local state
          this.templates = [...this.templates, result.data as PaymentTemplate];

          return {
            success: true,
            templateId: result.data.id
          };
        } else {
          this.error = result.error || 'Error al crear la plantilla';
          return false;
        }
      } catch (error) {
        console.error('Error creating template:', error);
        this.error = 'Error al crear la plantilla';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Delete template
    async deleteTemplate(templateId: string) {
      this.isLoading = true;

      try {
        const result = await templateSchema.delete(templateId);

        if (result.success) {
          // Update local state
          this.templates = this.templates.filter(t => t.id !== templateId);
          return true;
        } else {
          this.error = result.error || 'Error al eliminar la plantilla';
          return false;
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        this.error = 'Error al eliminar la plantilla';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Increment usage count when template is used
    async incrementUsage(templateId: string) {
      try {
        const result = await templateSchema.incrementUsage(templateId);

        if (result.success) {
          // Update local state
          const index = this.templates.findIndex(t => t.id === templateId);
          if (index !== -1) {
            this.templates[index].usageCount++;
          }
          return true;
        } else {
          console.error('Error incrementing usage:', result.error);
          return false;
        }
      } catch (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }
    },

    // Clear store state
    clearState() {
      this.templates = [];
      this.error = null;
    }
  }
});
