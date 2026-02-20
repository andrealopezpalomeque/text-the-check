import { Schema } from '../schema';
import type { SchemaDefinition, FetchResult, CreateResult, DeleteResult } from '../types';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance, getCurrentUser } from '~/utils/firebase';

export class WhatsappLinkSchema extends Schema {
  protected collectionName = 'pt_whatsapp_link';

  protected schema: SchemaDefinition = {
    status: {
      type: 'string',
      required: true
    },
    userId: {
      type: 'string',
      required: true
    },
    phoneNumber: {
      type: 'string',
      required: false
    },
    contactName: {
      type: 'string',
      required: false
    },
    createdAt: {
      type: 'date',
      required: false
    },
    linkedAt: {
      type: 'date',
      required: false
    }
  };

  // Generate a random 6-character code
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a pending link code (code as document ID)
  async createPendingCode(): Promise<{ success: boolean; code?: string; error?: string }> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const db = getFirestoreInstance();
      const code = this.generateCode();

      await setDoc(doc(db, this.collectionName, code), {
        status: 'pending',
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      return { success: true, code };
    } catch (error) {
      console.error('Error creating pending code:', error);
      return { success: false, error: `Error al crear código: ${error}` };
    }
  }

  // Find linked account for current user
  async findLinkedAccount(): Promise<FetchResult> {
    return this.find({
      where: [{ field: 'status', operator: '==', value: 'linked' }]
    });
  }

  // Find pending code for current user
  async findPendingCode(): Promise<FetchResult> {
    return this.find({
      where: [{ field: 'status', operator: '==', value: 'pending' }]
    });
  }

  // Delete linked account for current user
  async unlinkAccount(): Promise<DeleteResult> {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const result = await this.findLinkedAccount();

      if (result.success && result.data && result.data.length > 0) {
        const db = getFirestoreInstance();

        for (const link of result.data) {
          await deleteDoc(doc(db, this.collectionName, link.id));
        }

        return { success: true };
      }

      return { success: false, error: 'No hay cuenta vinculada' };
    } catch (error) {
      console.error('Error unlinking account:', error);
      return { success: false, error: `Error al desvincular: ${error}` };
    }
  }
}
