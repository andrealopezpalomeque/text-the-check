import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

export const useFirebase = () => {
  const { $db } = useNuxtApp()

  return {
    db: $db as Firestore
  }
}
