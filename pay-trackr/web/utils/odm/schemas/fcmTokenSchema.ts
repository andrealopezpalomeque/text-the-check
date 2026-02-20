import { Schema } from '../schema';
import type { SchemaDefinition, FetchResult, CreateResult, DeleteResult } from '../types';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { getFirestoreInstance } from '~/utils/firebase';

export class FcmTokenSchema extends Schema {
  protected collectionName = 'pt_fcm_token';

  protected schema: SchemaDefinition = {
    userId: {
      type: 'string',
      required: true
    },
    token: {
      type: 'string',
      required: true
    },
    deviceId: {
      type: 'string',
      required: false
    },
    notificationsEnabled: {
      type: 'boolean',
      required: false,
      default: true
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

  // Find all tokens for current user
  async findAllForUser(): Promise<FetchResult> {
    return this.find({});
  }

  // Find enabled tokens for current user
  async findEnabledForUser(): Promise<FetchResult> {
    return this.find({
      where: [{ field: 'notificationsEnabled', operator: '==', value: true }]
    });
  }

  // Check if token already exists for current user
  async tokenExists(token: string): Promise<boolean> {
    const result = await this.find({
      where: [{ field: 'token', operator: '==', value: token }]
    });
    return result.success && result.data && result.data.length > 0;
  }

  // Register a new token (replaces existing token for same device)
  async registerToken(token: string, deviceId: string): Promise<CreateResult> {
    // Check if this exact token already exists
    const exists = await this.tokenExists(token);
    if (exists) {
      // Token already registered, just return success
      return { success: true, data: { token } };
    }

    // Delete any existing tokens for this device (prevents duplicates)
    await this.deleteByDeviceId(deviceId);

    // Create new token document
    return this.create({
      token,
      deviceId,
      notificationsEnabled: true
    });
  }

  // Delete tokens by device ID (used for deduplication)
  async deleteByDeviceId(deviceId: string): Promise<void> {
    try {
      const result = await this.find({
        where: [{ field: 'deviceId', operator: '==', value: deviceId }]
      });

      if (result.success && result.data && result.data.length > 0) {
        for (const tokenDoc of result.data) {
          await this.delete(tokenDoc.id);
        }
      }
    } catch (error) {
      console.error('Error deleting tokens by deviceId:', error);
    }
  }

  // Delete a specific token
  async deleteToken(token: string): Promise<DeleteResult> {
    try {
      const result = await this.find({
        where: [{ field: 'token', operator: '==', value: token }]
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: true }; // Token doesn't exist, consider it deleted
      }

      // Delete the token document
      return this.delete(result.data[0].id);
    } catch (error) {
      console.error('Error eliminando token FCM:', error);
      return { success: false, error: `Error al eliminar token: ${error}` };
    }
  }

  // Delete all tokens for current user (useful for logout)
  async deleteAllForUser(): Promise<DeleteResult> {
    try {
      const result = await this.findAllForUser();

      if (!result.success || !result.data) {
        return { success: false, error: 'Error obteniendo tokens del usuario' };
      }

      // Delete each token
      for (const tokenDoc of result.data) {
        await this.delete(tokenDoc.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error eliminando todos los tokens del usuario:', error);
      return { success: false, error: `Error al eliminar tokens: ${error}` };
    }
  }

  // Toggle notifications for a specific token
  async toggleNotifications(tokenId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    return this.update(tokenId, { notificationsEnabled: enabled });
  }
}
