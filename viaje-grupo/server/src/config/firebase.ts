import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Missing Firebase configuration. Check your .env file.')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    })

    console.log('✅ Firebase Admin initialized')
  }

  return admin
}

export const firebase = initializeFirebase()
export const db = admin.firestore()
