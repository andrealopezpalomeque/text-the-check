import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

if (!admin.apps.length) {
  const config: admin.AppOptions = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'viaje-grupo',
  }

  // Option A: Base64-encoded service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
    )
    config.credential = admin.credential.cert(serviceAccount)
  }
  // Option B: Individual credential fields
  else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    config.credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  }
  // Option C: Default credentials (e.g. Cloud Run)

  admin.initializeApp(config)
  console.log('[INIT] Firebase Admin initialized')
}

export const db = admin.firestore()
export const messaging: import('firebase-admin').messaging.Messaging = admin.messaging()
export { admin }
