/**
 * Update group names to Spanish
 * Run with: npx tsx scripts/updateGroupNames.ts
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

// Group name updates: ID -> New Spanish name
const GROUP_NAME_UPDATES: Record<string, string> = {
  'brazil-trip-2025': 'Brasil 2026 Bombinhas',
  'demo-group': 'Grupo Demo',
  'brazil-2026-ingleses': 'Brasil 2026 Ingleses'
}

async function updateGroupNames() {
  const db = initializeFirebase()

  console.log('\n🔄 Updating group names to Spanish...\n')

  for (const [groupId, newName] of Object.entries(GROUP_NAME_UPDATES)) {
    try {
      const groupRef = db.collection('ttc_group').doc(groupId)
      const groupDoc = await groupRef.get()

      if (!groupDoc.exists) {
        console.log(`  ⚠️  Group not found: ${groupId}`)
        continue
      }

      const currentName = groupDoc.data()?.name
      await groupRef.update({ name: newName })
      console.log(`  ✅ Updated: "${currentName}" → "${newName}"`)
    } catch (error) {
      console.error(`  ❌ Error updating ${groupId}:`, error)
    }
  }

  console.log('\n✅ Done!')
}

updateGroupNames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
