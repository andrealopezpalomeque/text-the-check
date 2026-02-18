import { defineStore } from 'pinia';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { getFirestoreInstance, getCurrentUser } from '~/utils/firebase';
import { WhatsappLinkSchema } from '~/utils/odm/schemas/whatsappLinkSchema';

interface LinkedAccount {
  id: string;
  status: string;
  userId: string;
  phoneNumber: string;
  contactName?: string;
  linkedAt?: any;
}

interface WhatsappState {
  linkedAccount: LinkedAccount | null;
  pendingCode: string | null;
  codeExpiresAt: Date | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

// Schema instance (lazy initialized)
let whatsappSchema: WhatsappLinkSchema | null = null;
let unsubscribeLink: Unsubscribe | null = null;

const getSchema = () => {
  if (!whatsappSchema) {
    whatsappSchema = new WhatsappLinkSchema();
  }
  return whatsappSchema;
};

export const useWhatsappStore = defineStore('whatsapp', {
  state: (): WhatsappState => ({
    linkedAccount: null,
    pendingCode: null,
    codeExpiresAt: null,
    isLoading: false,
    isGenerating: false,
    error: null
  }),

  getters: {
    isLinked: (state) => !!state.linkedAccount,
    hasValidCode: (state) => {
      if (!state.pendingCode || !state.codeExpiresAt) return false;
      return new Date() < state.codeExpiresAt;
    }
  },

  actions: {
    // Fetch linked account
    async fetchLinkedAccount() {
      this.isLoading = true;
      this.error = null;

      try {
        const result = await getSchema().findLinkedAccount();

        if (result.success && result.data && result.data.length > 0) {
          const link = result.data[0];
          this.linkedAccount = {
            ...link,
            phoneNumber: link.id
          } as LinkedAccount;
        } else {
          this.linkedAccount = null;
        }

        return true;
      } catch (error) {
        console.error('Error fetching linked account:', error);
        this.error = 'Error al obtener la cuenta vinculada';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Fetch pending code (restore on page reload)
    async fetchPendingCode() {
      try {
        const result = await getSchema().findPendingCode();

        if (result.success && result.data && result.data.length > 0) {
          const pending = result.data[0];
          const createdAt = pending.createdAt?.toDate?.() || new Date(pending.createdAt);
          const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 minutes from creation

          // Check if still valid
          if (new Date() < expiresAt) {
            this.pendingCode = pending.id;
            this.codeExpiresAt = expiresAt;
            return { success: true, code: pending.id, expiresAt };
          } else {
            // Code expired, clean it up
            this.pendingCode = null;
            this.codeExpiresAt = null;
          }
        }

        return { success: false };
      } catch (error) {
        console.error('Error fetching pending code:', error);
        return { success: false };
      }
    },

    // Generate a new linking code
    async generateCode() {
      this.isGenerating = true;
      this.error = null;

      try {
        const result = await getSchema().createPendingCode();

        if (result.success && result.code) {
          this.pendingCode = result.code;
          this.codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          return { success: true, code: result.code };
        } else {
          this.error = result.error || 'Error al generar el código';
          return { success: false, error: this.error };
        }
      } catch (error) {
        console.error('Error generating code:', error);
        this.error = 'Error al generar el código';
        return { success: false, error: this.error };
      } finally {
        this.isGenerating = false;
      }
    },

    // Unlink account
    async unlinkAccount() {
      this.isLoading = true;
      this.error = null;

      try {
        const result = await getSchema().unlinkAccount();

        if (result.success) {
          this.linkedAccount = null;
          return true;
        } else {
          this.error = result.error || 'Error al desvincular la cuenta';
          return false;
        }
      } catch (error) {
        console.error('Error unlinking account:', error);
        this.error = 'Error al desvincular la cuenta';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Clear pending code (when expired or used)
    clearPendingCode() {
      this.pendingCode = null;
      this.codeExpiresAt = null;
    },

    // Subscribe to real-time link changes
    subscribeToChanges() {
      const user = getCurrentUser();
      if (!user) return;

      // Unsubscribe from previous listener if any
      this.unsubscribe();

      const db = getFirestoreInstance();
      const linksRef = collection(db, 'p_t_whatsapp_link');
      const q = query(linksRef, where('userId', '==', user.uid), where('status', '==', 'linked'));

      unsubscribeLink = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          this.linkedAccount = {
            ...docData,
            id: snapshot.docs[0].id,
            phoneNumber: snapshot.docs[0].id
          } as LinkedAccount;
          // Clear the code if account was just linked
          this.clearPendingCode();
        } else {
          this.linkedAccount = null;
        }
      });
    },

    // Unsubscribe from real-time updates
    unsubscribe() {
      if (unsubscribeLink) {
        unsubscribeLink();
        unsubscribeLink = null;
      }
    },

    // Clear store state
    clearState() {
      this.unsubscribe();
      this.linkedAccount = null;
      this.pendingCode = null;
      this.codeExpiresAt = null;
      this.isLoading = false;
      this.isGenerating = false;
      this.error = null;
    }
  }
});
