/**
 * Seed script for Brazil 2026 Ingleses Group
 *
 * This script:
 * 1. Creates Gonzalo Soria (if not exists)
 * 2. Creates Agustin Hurtado (if not exists)
 * 3. Creates Conrado Romero (if not exists)
 * 4. Creates Chiche Gonzalez (if not exists)
 * 5. Finds Pipi's existing user by phone
 * 6. Creates "Brazil 2026 Ingleses" group (if not exists) with all 5 members
 *
 * This script is IDEMPOTENT - safe to run multiple times.
 * It will NOT modify existing groups or users.
 *
 * Run with: npx tsx scripts/seedBrazil2026Group.ts
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

// User data to seed
interface SeedUser {
  name: string
  phone: string
  email: string | null
  aliases: string[]
  paymentInfo: string | null
}

const NEW_USERS: SeedUser[] = [
  {
    name: 'Gonzalo Soria',
    phone: '+5493794008427',
    email: null,
    aliases: ['gonzalo', 'gonza', 'suller'],
    paymentInfo: null
  },
  {
    name: 'Agustin Hurtado',
    phone: '+5493794335989',
    email: null,
    aliases: ['hurtado', 'agustin', 'emilio'],
    paymentInfo: null
  },
  {
    name: 'Conrado Romero',
    phone: '+5493794351114',
    email: null,
    aliases: ['conrado', 'panadero', 'pana'],
    paymentInfo: null
  },
  {
    name: 'Chiche Gonzalez',
    phone: '+5493794382508',
    email: null,
    aliases: ['gabriel', 'chiche'],
    paymentInfo: null
  }
]

const PIPI_PHONE = '+5493794702813'
const GROUP_ID = 'brazil-2026-ingleses'
const GROUP_NAME = 'Brasil 2026 Ingleses'

/**
 * Find user by phone number
 */
async function findUserByPhone(db: FirebaseFirestore.Firestore, phone: string): Promise<string | null> {
  const normalizedPhone = phone.replace(/[\s-]/g, '')
  const digitsOnly = phone.replace(/[^\d]/g, '')

  const candidates = [normalizedPhone, digitsOnly, `+${digitsOnly}`]

  for (const candidate of candidates) {
    const snapshot = await db.collection('ttc_user').where('phone', '==', candidate).limit(1).get()
    if (!snapshot.empty) {
      return snapshot.docs[0].id
    }
  }

  return null
}

/**
 * Find user by name (exact match)
 */
async function findUserByName(db: FirebaseFirestore.Firestore, name: string): Promise<string | null> {
  const snapshot = await db.collection('ttc_user').where('name', '==', name).limit(1).get()
  if (!snapshot.empty) {
    return snapshot.docs[0].id
  }
  return null
}

/**
 * Create a user if they don't exist
 * Returns { id: string, created: boolean }
 */
async function ensureUser(db: FirebaseFirestore.Firestore, userData: SeedUser): Promise<{ id: string, created: boolean }> {
  // First check if user already exists by phone
  const existingId = await findUserByPhone(db, userData.phone)
  if (existingId) {
    console.log(`  ⏭️  User already exists: ${userData.name} (${existingId})`)
    return { id: existingId, created: false }
  }

  // Check by name as fallback
  const existingByName = await findUserByName(db, userData.name)
  if (existingByName) {
    console.log(`  ⏭️  User already exists: ${userData.name} (${existingByName})`)
    return { id: existingByName, created: false }
  }

  // Create new user
  const docRef = db.collection('ttc_user').doc()
  const userId = docRef.id

  await docRef.set({
    id: userId,
    name: userData.name,
    phone: userData.phone,
    email: userData.email,
    aliases: userData.aliases,
    paymentInfo: userData.paymentInfo,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  console.log(`  ✅ Created user: ${userData.name} (${userId})`)
  return { id: userId, created: true }
}

/**
 * Check if group exists
 */
async function groupExists(db: FirebaseFirestore.Firestore, groupId: string): Promise<boolean> {
  const doc = await db.collection('ttc_group').doc(groupId).get()
  return doc.exists
}

/**
 * Create group if it doesn't exist
 */
async function ensureGroup(
  db: FirebaseFirestore.Firestore,
  memberIds: string[],
  creatorId: string
): Promise<boolean> {
  if (await groupExists(db, GROUP_ID)) {
    console.log(`  ⏭️  Group already exists: ${GROUP_NAME} (${GROUP_ID})`)
    return false
  }

  await db.collection('ttc_group').doc(GROUP_ID).set({
    id: GROUP_ID,
    name: GROUP_NAME,
    members: memberIds,
    createdBy: creatorId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  console.log(`  ✅ Created group: ${GROUP_NAME} (${GROUP_ID}) with ${memberIds.length} members`)
  return true
}

async function main() {
  console.log('\n=== Brazil 2026 Ingleses Group Seed Script ===\n')

  const db = initializeFirebase()

  const stats = {
    usersCreated: 0,
    usersExisted: 0,
    groupCreated: false
  }

  // Step 1: Find Pipi's existing user
  console.log('Step 1: Finding Pipi\'s existing user...')
  const pipiId = await findUserByPhone(db, PIPI_PHONE)

  if (!pipiId) {
    console.error('  ❌ ERROR: Pipi\'s user not found! Make sure seedUsers.ts has been run first.')
    process.exit(1)
  }
  console.log(`  ✅ Found Pipi: ${pipiId}`)

  // Step 2: Create new users (if not exist)
  console.log('\nStep 2: Creating new users...')
  const newUserIds: string[] = []

  for (const user of NEW_USERS) {
    const result = await ensureUser(db, user)
    newUserIds.push(result.id)
    if (result.created) stats.usersCreated++
    else stats.usersExisted++
  }

  // Step 3: Create group (if not exists)
  console.log('\nStep 3: Creating group...')
  // Pipi first, then the new users
  const allMemberIds = [pipiId, ...newUserIds]
  stats.groupCreated = await ensureGroup(db, allMemberIds, pipiId)

  // Summary
  console.log('\n=== Seed Complete! ===\n')
  console.log('Summary:')
  console.log(`  - ${stats.usersCreated} users created`)
  console.log(`  - ${stats.usersExisted} users already existed`)
  console.log(`  - Group ${stats.groupCreated ? 'created' : 'already existed'}`)

  console.log('\n📝 REMINDER: Add these phone numbers to ALLOWED_PHONE_NUMBERS on Render:')
  for (const user of NEW_USERS) {
    console.log(`   ${user.phone} (${user.name})`)
  }

  console.log('\n📝 Group members:')
  console.log(`   - Pipi: ${pipiId}`)
  newUserIds.forEach((id, i) => {
    console.log(`   - ${NEW_USERS[i].name}: ${id}`)
  })

  process.exit(0)
}

main().catch(error => {
  console.error('Seed script failed:', error)
  process.exit(1)
})
