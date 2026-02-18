/**
 * Utility script to update a user's email address
 *
 * Usage:
 *   npx tsx scripts/updateUserEmail.ts --phone="+5493794574159" --email="virginia@example.com"
 *
 * This is useful when a user provides their Google email after being added to the system.
 * The email is required for dashboard access via Google Auth.
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
  }

  return admin.firestore()
}

/**
 * Parse command line arguments
 */
function parseArgs(): { phone: string, email: string } {
  const args = process.argv.slice(2)
  let phone = ''
  let email = ''

  for (const arg of args) {
    if (arg.startsWith('--phone=')) {
      phone = arg.substring('--phone='.length)
    } else if (arg.startsWith('--email=')) {
      email = arg.substring('--email='.length)
    }
  }

  if (!phone || !email) {
    console.error('Usage: npx tsx scripts/updateUserEmail.ts --phone="+5493794574159" --email="user@example.com"')
    console.error('')
    console.error('Arguments:')
    console.error('  --phone   User\'s phone number (with country code)')
    console.error('  --email   New email address to set')
    process.exit(1)
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error(`Invalid email format: ${email}`)
    process.exit(1)
  }

  return { phone, email }
}

/**
 * Find user by phone number
 */
async function findUserByPhone(db: FirebaseFirestore.Firestore, phone: string): Promise<{ id: string, name: string, currentEmail: string | null } | null> {
  const normalizedPhone = phone.replace(/[\s-]/g, '')
  const digitsOnly = phone.replace(/[^\d]/g, '')

  const candidates = [normalizedPhone, digitsOnly, `+${digitsOnly}`]

  for (const candidate of candidates) {
    const snapshot = await db.collection('ttc_user').where('phone', '==', candidate).limit(1).get()
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        currentEmail: data.email || null
      }
    }
  }

  return null
}

async function main() {
  const { phone, email } = parseArgs()

  console.log('\n=== Update User Email ===\n')
  console.log(`Phone: ${phone}`)
  console.log(`New Email: ${email}`)

  const db = initializeFirebase()

  // Find user
  console.log('\nLooking up user...')
  const user = await findUserByPhone(db, phone)

  if (!user) {
    console.error(`\n❌ User not found with phone: ${phone}`)
    process.exit(1)
  }

  console.log(`\nFound user: ${user.name} (${user.id})`)
  console.log(`Current email: ${user.currentEmail || '(none)'}`)

  // Update email
  console.log(`\nUpdating email to: ${email}...`)

  await db.collection('ttc_user').doc(user.id).update({
    email: email.toLowerCase()
  })

  console.log(`\n✅ Email updated successfully!`)
  console.log(`\n${user.name} can now access the dashboard at https://textthecheck.app`)

  process.exit(0)
}

main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
