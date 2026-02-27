import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

if (!admin.apps.length) {
  const config: admin.AppOptions = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'viaje-grupo',
  }

  // Base64-encoded service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
    )
    config.credential = admin.credential.cert(serviceAccount)
  }
  // Default credentials (e.g. Cloud Run)

  admin.initializeApp(config)
  console.log('[INIT] Firebase Admin initialized')
}

export const db = admin.firestore()
export const messaging: import('firebase-admin').messaging.Messaging = admin.messaging()
export { admin }
