import {
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  Timestamp,
  type Firestore
} from 'firebase/firestore'
import type { User } from '~/types'

// Extended user info combining Firebase Auth and Firestore user
interface AuthenticatedUser {
  firebaseUser: FirebaseUser
  firestoreUser: User
}

// Track if auth has been initialized (outside of reactive state to prevent multiple inits)
let authInitialized = false

export const useAuth = () => {
  const { $auth, $db } = useNuxtApp()
  const auth = $auth as Auth | undefined
  const db = $db as Firestore | undefined

  // Use shallowRef to prevent deep reactivity on Firebase User object
  // This avoids cross-origin errors when the User contains popup window references
  const user = useState<FirebaseUser | null>('auth-user', () => null)
  const firestoreUser = useState<User | null>('firestore-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)
  const error = useState<string | null>('auth-error', () => null)

  const requireAuth = () => {
    if (!auth) {
      throw new Error(
        'Firebase Auth is not available. Ensure the Firebase Nuxt plugin runs before calling useAuth().'
      )
    }
    return auth
  }

  const requireDb = () => {
    if (!db) {
      throw new Error(
        'Firebase Firestore is not available. Ensure the Firebase Nuxt plugin runs before calling useAuth().'
      )
    }
    return db
  }

  /**
   * Look up a user in Firestore by email
   */
  const findUserByEmail = async (email: string): Promise<User | null> => {
    try {
      const database = requireDb()
      const usersRef = collection(database, 'ttc_user')

      // Query for exact email match
      const q = query(usersRef, where('email', '==', email.toLowerCase()))
      const snapshot = await getDocs(q)

      if (!snapshot.empty && snapshot.docs[0]) {
        const userDoc = snapshot.docs[0]
        return {
          id: userDoc.id,
          ...userDoc.data()
        } as User
      }

      return null
    } catch (err) {
      console.error('Error finding user by email:', err)
      return null
    }
  }

  /**
   * Update user's email in Firestore
   */
  const updateUserEmail = async (userId: string, email: string): Promise<boolean> => {
    try {
      const database = requireDb()
      const userRef = doc(database, 'ttc_user', userId)
      await updateDoc(userRef, { email: email.toLowerCase() })
      return true
    } catch (err) {
      console.error('Error updating user email:', err)
      return false
    }
  }

  /**
   * Link Firebase Auth user with Firestore user
   * Returns the matched Firestore user or null if not authorized
   */
  const linkAuthToFirestore = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const email = firebaseUser.email

    // Custom token auth (WhatsApp OTP) — UID is the ttc_user doc ID
    if (!email) {
      const database = requireDb()
      const userDoc = await getDoc(doc(database, 'ttc_user', firebaseUser.uid))
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User
      }
      return null
    }

    // Look up by email
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return existingUser
    }

    // Email not found - auto-create user on first sign-in
    const database = requireDb()
    const newUserRef = doc(database, 'ttc_user', firebaseUser.uid)
    const newUser: User = {
      id: newUserRef.id,
      name: firebaseUser.displayName || email.split('@')[0],
      phone: '',
      email: email.toLowerCase(),
      aliases: [],
    }
    await setDoc(newUserRef, { ...newUser, createdAt: Timestamp.now() })
    return newUser
  }

  // Initialize auth state listener
  // Returns a promise that resolves when the first auth state is determined
  const initAuth = (): Promise<void> => {
    // Prevent multiple initializations
    if (authInitialized) {
      return Promise.resolve()
    }
    authInitialized = true

    return new Promise((resolve) => {
      try {
        onAuthStateChanged(
          requireAuth(),
          async (firebaseUser) => {
            if (firebaseUser) {
              // Use markRaw to prevent Vue from making the User object deeply reactive
              user.value = markRaw(firebaseUser)

              // Try to link with Firestore user
              const linkedUser = await linkAuthToFirestore(firebaseUser)

              if (linkedUser) {
                firestoreUser.value = linkedUser
              } else {
                // User not authorized - sign them out
                firestoreUser.value = null
                // Don't sign out here on init - let the component handle it
              }
            } else {
              user.value = null
              firestoreUser.value = null
            }
            loading.value = false
            resolve()
          },
          (err) => {
            console.error('Auth state change error:', err)
            error.value = err.message
            loading.value = false
            resolve()
          }
        )
      } catch (err: any) {
        console.error(err)
        error.value = err?.message ?? 'Firebase Auth initialization error'
        loading.value = false
        resolve()
      }
    })
  }

  // Sign in with Google and verify against Firestore users
  const signInWithGoogle = async (): Promise<AuthenticatedUser> => {
    loading.value = true
    error.value = null

    try {
      const provider = new GoogleAuthProvider()

      // Force account selection (prevents auto-selecting cached account)
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(requireAuth(), provider)
      const firebaseUser = result.user

      // Use markRaw to prevent deep reactivity
      user.value = markRaw(firebaseUser)

      // Link with Firestore user
      const linkedUser = await linkAuthToFirestore(firebaseUser)

      if (!linkedUser) {
        // No email on the Google account — cannot create user
        await firebaseSignOut(requireAuth())
        user.value = null
        firestoreUser.value = null
        throw new Error('Tu cuenta de Google no tiene un email asociado. Intenta con otra cuenta.')
      }

      firestoreUser.value = linkedUser

      return {
        firebaseUser: markRaw(firebaseUser),
        firestoreUser: linkedUser
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      error.value = err.message || 'Error al iniciar sesión con Google'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign in with OTP custom token (WhatsApp login)
  const signInWithOTP = async (token: string): Promise<AuthenticatedUser> => {
    loading.value = true
    error.value = null
    try {
      const result = await signInWithCustomToken(requireAuth(), token)
      const firebaseUser = result.user
      user.value = markRaw(firebaseUser)
      const linkedUser = await linkAuthToFirestore(firebaseUser)
      if (!linkedUser) throw new Error('No se encontró la cuenta')
      firestoreUser.value = linkedUser
      return { firebaseUser: markRaw(firebaseUser), firestoreUser: linkedUser }
    } catch (err: any) {
      error.value = err.message || 'Error al iniciar sesión'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async () => {
    loading.value = true
    error.value = null

    try {
      await firebaseSignOut(requireAuth())
      user.value = null
      firestoreUser.value = null
    } catch (err: any) {
      console.error('Sign out error:', err)
      error.value = err.message || 'Error al cerrar sesión'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user: readonly(user),
    firestoreUser: readonly(firestoreUser),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated: computed(() => !!user.value && !!firestoreUser.value),
    isFirebaseAuthenticated: computed(() => !!user.value),
    initAuth,
    signInWithGoogle,
    signInWithOTP,
    signOut
  }
}
