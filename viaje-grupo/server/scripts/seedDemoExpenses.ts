
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

const DEMO_GROUP_ID = 'demo-group'

async function getGroupMembers(db: FirebaseFirestore.Firestore, groupId: string) {
  const groupDoc = await db.collection('ttc_group').doc(groupId).get()
  if (!groupDoc.exists) {
    throw new Error(`Group ${groupId} not found. Run seedTestGroup.ts first.`)
  }
  const data = groupDoc.data()
  return data?.members || []
}

async function main() {
  console.log('\n=== Seed Demo Expenses ===\n')

  const db = initializeFirebase()

  // Verify group exists
  console.log('Checking Demo Group...')
  const memberIds = await getGroupMembers(db, DEMO_GROUP_ID)
  console.log(`Found ${memberIds.length} members in ${DEMO_GROUP_ID}`)

  if (memberIds.length < 2) {
    console.error('Not enough members to create debts. Need at least 2.')
    process.exit(1)
  }

  const payerId = memberIds[0] // e.g. Virginia
  const splitUserId = memberIds[1] // e.g. Carlos Demo

  // Get user names for nice logs
  const payerDoc = await db.collection('ttc_user').doc(payerId).get()
  const splitUserDoc = await db.collection('ttc_user').doc(splitUserId).get()
  
  const payerName = payerDoc.data()?.name || 'User A'
  const splitUserName = splitUserDoc.data()?.name || 'User B'

  console.log(`\nCreating expenses:`)
  console.log(`1. ${payerName} pays $10,000 for "Cena Bienvenida" (split with everyone)`)
  console.log(`2. ${splitUserName} pays $5,000 for "Taxi Aeropuerto" (split with everyone)`)

  const expensesRef = db.collection('ttc_expense')

  // Expense 1: Large dinner paid by Member 0
  await expensesRef.add({
    groupId: DEMO_GROUP_ID,
    userId: payerId,
    userName: payerName,
    amount: 10000,
    description: 'Cena Bienvenida',
    category: 'food',
    splitAmong: [], // Empty means "everyone" in the current logic if not specified
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  // Expense 2: Taxi paid by Member 1
  await expensesRef.add({
    groupId: DEMO_GROUP_ID,
    userId: splitUserId,
    userName: splitUserName,
    amount: 5000,
    description: 'Taxi Aeropuerto',
    category: 'transport',
    splitAmong: [],
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  console.log('\n✅ Expenses seeded successfully!')
  console.log('Go to https://textthecheck-app.web.app (or localhost) and select Demo Group.')
  console.log('You should now see settlement recommendations.')

  process.exit(0)
}

main().catch(error => {
  console.error('Seed script failed:', error)
  process.exit(1)
})
