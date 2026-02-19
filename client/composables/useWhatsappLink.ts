import {
  collection,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

interface LinkedAccount {
  id: string
  status: string
  userId: string
  phoneNumber: string
  contactName?: string
  linkedAt?: any
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // excludes I, O, L, 0, 1
const CODE_LENGTH = 6
const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function generateRandomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export const useWhatsappLink = () => {
  const { $db } = useNuxtApp()
  const db = $db as Firestore
  const { user, firestoreUser } = useAuth()

  const linkedAccount = ref<LinkedAccount | null>(null)
  const pendingCode = ref<string | null>(null)
  const codeExpiresAt = ref<Date | null>(null)
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const isLinked = computed(() => !!linkedAccount.value)
  const countdown = ref('')

  let unsubscribeLink: Unsubscribe | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  // Update countdown display every second
  function startCountdown() {
    stopCountdown()
    countdownInterval = setInterval(() => {
      if (!codeExpiresAt.value) {
        countdown.value = ''
        return
      }
      const remaining = codeExpiresAt.value.getTime() - Date.now()
      if (remaining <= 0) {
        countdown.value = ''
        pendingCode.value = null
        codeExpiresAt.value = null
        stopCountdown()
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      countdown.value = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }, 1000)
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  // Subscribe to real-time link changes for the current user
  function subscribe() {
    const authUid = user.value?.uid
    if (!authUid) return

    unsubscribe()

    const linksRef = collection(db, 'p_t_whatsapp_link')
    const q = query(linksRef, where('authUid', '==', authUid), where('status', '==', 'linked'))

    unsubscribeLink = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0]
        linkedAccount.value = {
          ...docSnap.data(),
          id: docSnap.id,
          phoneNumber: docSnap.id,
        } as LinkedAccount
        // Account was just linked — clear the pending code
        pendingCode.value = null
        codeExpiresAt.value = null
        stopCountdown()
      } else {
        linkedAccount.value = null
      }
    })
  }

  function unsubscribe() {
    if (unsubscribeLink) {
      unsubscribeLink()
      unsubscribeLink = null
    }
  }

  // Generate a new linking code
  async function generateCode() {
    const authUid = user.value?.uid
    const userId = firestoreUser.value?.id
    if (!authUid || !userId) return

    isGenerating.value = true
    error.value = null

    try {
      const code = generateRandomCode()
      await setDoc(doc(db, 'p_t_whatsapp_link', code), {
        status: 'pending',
        userId,
        authUid,
        createdAt: serverTimestamp(),
      })

      pendingCode.value = code
      codeExpiresAt.value = new Date(Date.now() + CODE_TTL_MS)
      startCountdown()
    } catch (err: any) {
      console.error('Error generating code:', err)
      error.value = 'Error al generar el código'
    } finally {
      isGenerating.value = false
    }
  }

  // Unlink the account
  async function unlinkAccount() {
    if (!linkedAccount.value) return

    isLoading.value = true
    error.value = null

    try {
      await deleteDoc(doc(db, 'p_t_whatsapp_link', linkedAccount.value.id))
      linkedAccount.value = null
    } catch (err: any) {
      console.error('Error unlinking account:', err)
      error.value = 'Error al desvincular la cuenta'
    } finally {
      isLoading.value = false
    }
  }

  // Auto-subscribe when user is available
  watch(firestoreUser, (user) => {
    if (user) {
      subscribe()
    } else {
      unsubscribe()
      linkedAccount.value = null
    }
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
    stopCountdown()
  })

  return {
    linkedAccount: readonly(linkedAccount),
    pendingCode: readonly(pendingCode),
    codeExpiresAt: readonly(codeExpiresAt),
    isLinked,
    isLoading: readonly(isLoading),
    isGenerating: readonly(isGenerating),
    error: readonly(error),
    countdown: readonly(countdown),
    generateCode,
    unlinkAccount,
  }
}
