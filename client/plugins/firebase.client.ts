import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin({
  name: 'firebase',
  setup() {
    const config = useRuntimeConfig()

    const firebaseConfig = {
      apiKey: config.public.firebaseApiKey,
      authDomain: config.public.firebaseAuthDomain,
      projectId: config.public.firebaseProjectId,
      storageBucket: config.public.firebaseStorageBucket,
      messagingSenderId: config.public.firebaseMessagingSenderId,
      appId: config.public.firebaseAppId
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig)

    // Initialize Firestore
    const db = getFirestore(app)

    // Initialize Auth
    const auth = getAuth(app)

    return {
      provide: {
        firebase: app,
        db,
        auth
      }
    }
  }
})
