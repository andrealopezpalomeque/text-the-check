import { getApp, initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import {
  getAuth,
  type Auth,
  type User
} from 'firebase/auth'

// Singleton instances
let firebaseApp: FirebaseApp | null = null
let firestore: Firestore | null = null
let auth: Auth | null = null

// Reuse viaje-grupo's Firebase app (initialized by plugins/firebase.client.ts)
// Falls back to initializing a new app if none exists
export const initializeFirebase = (): FirebaseApp => {
  if (firebaseApp) {
    return firebaseApp
  }

  try {
    // Reuse the existing Firebase app from viaje-grupo's plugin
    firebaseApp = getApp()
  } catch {
    // No existing app — initialize one (shouldn't happen in merged app)
    const config = useRuntimeConfig()
    firebaseApp = initializeApp({
      apiKey: config.public.firebaseApiKey as string,
      authDomain: config.public.firebaseAuthDomain as string,
      projectId: config.public.firebaseProjectId as string,
      storageBucket: config.public.firebaseStorageBucket as string,
      messagingSenderId: config.public.firebaseMessagingSenderId as string,
      appId: config.public.firebaseAppId as string,
    })
  }

  return firebaseApp
}

// Get Firestore instance
export const getFirestoreInstance = (): Firestore => {
  if (firestore) {
    return firestore
  }

  const app = initializeFirebase()
  firestore = getFirestore(app)

  return firestore
}

// Get Auth instance
export const getAuthInstance = (): Auth => {
  if (auth) {
    return auth
  }

  const app = initializeFirebase()
  auth = getAuth(app)

  return auth
}

// Get current user (synchronous - may be null on initial load)
export const getCurrentUser = (): User | null => {
  const auth = getAuthInstance()
  return auth.currentUser
}

// Get current user (async - waits for auth state to be fully determined)
export const getCurrentUserAsync = async (): Promise<User | null> => {
  const auth = getAuthInstance()
  await auth.authStateReady()
  return auth.currentUser
}
