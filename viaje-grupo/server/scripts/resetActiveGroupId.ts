/**
 * Reset activeGroupId for a user (for testing multi-group flow)
 *
 * Run with: npx tsx scripts/resetActiveGroupId.ts
 */

import admin from 'firebase-admin'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Initialize Firebase Admin
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

    console.log('Firebase Admin initialized')
  }

  return admin.firestore()
}

const PIPI_PHONE = '+5493794702813'

async function main() {
  console.log('\n=== Reset activeGroupId Script ===\n')

  const db = initializeFirebase()

  // Find Pipi by phone
  const phone = PIPI_PHONE
  const digitsOnly = phone.replace(/[^\d]/g, '')
  const candidates = [phone, digitsOnly, `+${digitsOnly}`]

  let userId: string | null = null

  for (const candidate of candidates) {
    const snapshot = await db.collection('ttc_user').where('phone', '==', candidate).limit(1).get()
    if (!snapshot.empty) {
      userId = snapshot.docs[0].id
      break
    }
  }

  if (!userId) {
    console.error('User not found!')
    process.exit(1)
  }

  console.log(`Found user: ${userId}`)

  // Get current activeGroupId
  const userDoc = await db.collection('ttc_user').doc(userId).get()
  const currentActiveGroupId = userDoc.data()?.activeGroupId

  console.log(`Current activeGroupId: ${currentActiveGroupId || '(not set)'}`)

  // Reset to null
  await db.collection('ttc_user').doc(userId).update({
    activeGroupId: admin.firestore.FieldValue.delete()
  })

  console.log('✅ activeGroupId has been reset (deleted)')

  // Verify groups the user belongs to
  const groupsSnapshot = await db.collection('ttc_group').where('members', 'array-contains', userId).get()
  console.log(`\nUser belongs to ${groupsSnapshot.size} groups:`)
  groupsSnapshot.docs.forEach(doc => {
    console.log(`  - ${doc.data().name} (${doc.id})`)
  })

  process.exit(0)
}

main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
