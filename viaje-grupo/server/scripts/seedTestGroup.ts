/**
 * Seed script for Demo Group (Test/Marketing)
 *
 * This script:
 * 1. Creates Virginia user (if not exists)
 * 2. Creates demo users: Carlos Demo, Laura Demo (if not exist)
 * 3. Finds Pipi's existing user by phone
 * 4. Creates "Demo Group" (if not exists) with all 4 members
 *
 * This script is IDEMPOTENT - safe to run multiple times.
 * It will NOT modify the existing "Brazil Trip 2025" group.
 *
 * Run with: npx tsx scripts/seedTestGroup.ts
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
  phone: string | null
  email: string | null
  aliases: string[]
}

const VIRGINIA: SeedUser = {
  name: 'Virginia',
  phone: '+5493794574159',
  email: null,  // Will be added later via updateUserEmail script
  aliases: ['virginia', 'virgi', 'vir']
}

const DEMO_USERS: SeedUser[] = [
  {
    name: 'Carlos Demo',
    phone: null,
    email: null,
    aliases: ['carlos']
  },
  {
    name: 'Laura Demo',
    phone: null,
    email: null,
    aliases: ['laura']
  }
]

const PIPI_PHONE = '+5493794702813'
const DEMO_GROUP_ID = 'demo-group'

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
  // First check if user already exists by phone (if has phone)
  if (userData.phone) {
    const existingId = await findUserByPhone(db, userData.phone)
    if (existingId) {
      console.log(`  ⏭️  User already exists: ${userData.name} (${existingId})`)
      return { id: existingId, created: false }
    }
  }

  // Check by name for demo users without phone
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
 * Create demo group if it doesn't exist
 */
async function ensureGroup(
  db: FirebaseFirestore.Firestore,
  memberIds: string[],
  creatorId: string
): Promise<boolean> {
  if (await groupExists(db, DEMO_GROUP_ID)) {
    console.log(`  ⏭️  Group already exists: Demo Group (${DEMO_GROUP_ID})`)
    return false
  }

  await db.collection('ttc_group').doc(DEMO_GROUP_ID).set({
    id: DEMO_GROUP_ID,
    name: 'Demo Group',
    members: memberIds,
    createdBy: creatorId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  console.log(`  ✅ Created group: Demo Group (${DEMO_GROUP_ID}) with ${memberIds.length} members`)
  return true
}

async function main() {
  console.log('\n=== Demo Group Seed Script ===\n')

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

  // Step 2: Create Virginia (if not exists)
  console.log('\nStep 2: Ensuring Virginia user exists...')
  const virginiaResult = await ensureUser(db, VIRGINIA)
  if (virginiaResult.created) stats.usersCreated++
  else stats.usersExisted++

  // Step 3: Create demo users (if not exist)
  console.log('\nStep 3: Ensuring demo users exist...')
  const demoUserIds: string[] = []

  for (const demoUser of DEMO_USERS) {
    const result = await ensureUser(db, demoUser)
    demoUserIds.push(result.id)
    if (result.created) stats.usersCreated++
    else stats.usersExisted++
  }

  // Step 4: Create Demo Group (if not exists)
  console.log('\nStep 4: Ensuring Demo Group exists...')
  const allMemberIds = [virginiaResult.id, ...demoUserIds, pipiId]
  stats.groupCreated = await ensureGroup(db, allMemberIds, pipiId)

  // Summary
  console.log('\n=== Seed Complete! ===\n')
  console.log('Summary:')
  console.log(`  - ${stats.usersCreated} users created`)
  console.log(`  - ${stats.usersExisted} users already existed`)
  console.log(`  - Group ${stats.groupCreated ? 'created' : 'already existed'}`)

  console.log('\n📝 REMINDER: Add Virginia\'s phone to ALLOWED_PHONE_NUMBERS on Render:')
  console.log('   Current: ALLOWED_PHONE_NUMBERS=+5493794702813,+5493794702875,...')
  console.log('   Add:     +5493794574159')

  console.log('\n📝 Group members:')
  console.log(`   - Virginia: ${virginiaResult.id}`)
  demoUserIds.forEach((id, i) => {
    console.log(`   - ${DEMO_USERS[i].name}: ${id}`)
  })
  console.log(`   - Pipi: ${pipiId}`)

  process.exit(0)
}

main().catch(error => {
  console.error('Seed script failed:', error)
  process.exit(1)
})
