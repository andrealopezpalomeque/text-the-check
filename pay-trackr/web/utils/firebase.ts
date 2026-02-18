import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload
} from 'firebase/messaging'

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Get Firebase configuration from environment variables
export const getFirebaseConfig = (): FirebaseConfig => {
  const config = useRuntimeConfig()

  return {
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string,
  }
}

// Initialize Firebase app
let firebaseApp: FirebaseApp | null = null
let firestore: Firestore | null = null
let auth: Auth | null = null
let messaging: Messaging | null = null

export const initializeFirebase = (): FirebaseApp => {
  if (firebaseApp) {
    return firebaseApp
  }

  const config = getFirebaseConfig()
  firebaseApp = initializeApp(config)

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

// Initialize Google Auth Provider
export const getGoogleProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  return provider
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const auth = getAuthInstance()
    const provider = getGoogleProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    const auth = getAuthInstance()
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Get current user (synchronous - may be null on initial load)
export const getCurrentUser = (): User | null => {
  const auth = getAuthInstance()
  return auth.currentUser
}

// Get current user (async - waits for auth state to be fully determined)
export const getCurrentUserAsync = async (): Promise<User | null> => {
  const auth = getAuthInstance()

  // authStateReady() resolves once Firebase has finished restoring
  // the persisted session — avoids the race where onAuthStateChanged
  // fires with null before the stored token is loaded.
  await auth.authStateReady()

  return auth.currentUser
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  const auth = getAuthInstance()
  return onAuthStateChanged(auth, callback)
}

// Utility function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  try {
    const config = getFirebaseConfig()
    return !!(
      config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
    )
  } catch {
    return false
  }
}

// Get Messaging instance
export const getMessagingInstance = (): Messaging | null => {
  if (typeof window === 'undefined') {
    return null
  }

  if (messaging) {
    return messaging
  }

  const app = initializeFirebase()
  messaging = getMessaging(app)

  return messaging
}

// Request FCM token (asks for permission if needed)
export const requestFCMToken = async (vapidKey: string): Promise<string | null> => {
  try {
    const messagingInstance = getMessagingInstance()
    if (!messagingInstance) {
      console.warn('Messaging not available (server-side or unsupported browser)')
      return null
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser')
      return null
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return null
      }
    } else if (Notification.permission === 'denied') {
      console.log('Notification permission was previously denied')
      return null
    }

    // Register service worker for FCM
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration
    })

    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages (when app is open)
export const onForegroundMessage = (callback: (payload: MessagePayload) => void): (() => void) => {
  const messagingInstance = getMessagingInstance()
  if (!messagingInstance) {
    return () => {}
  }

  return onMessage(messagingInstance, callback)
}
