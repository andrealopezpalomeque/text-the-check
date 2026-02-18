
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

const DEMO_GROUP_ID = 'demo-group'

async function main() {
  console.log('\n=== Check Settlements Logic ===\n')

  const db = initializeFirebase()

  // 1. Fetch Users
  console.log('Fetching users...')
  const groupDoc = await db.collection('ttc_group').doc(DEMO_GROUP_ID).get()
  const memberIds = groupDoc.data()?.members || []
  
  const users = []
  for (const uid of memberIds) {
    const uDoc = await db.collection('ttc_user').doc(uid).get()
    users.push({ id: uDoc.id, ...uDoc.data() })
  }
  console.log(`Found ${users.length} users:`, users.map(u => u.name).join(', '))

  // 2. Fetch Expenses
  console.log('Fetching expenses...')
  const expensesSnap = await db.collection('ttc_expense')
    .where('groupId', '==', DEMO_GROUP_ID)
    .get()
  
  const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`Found ${expenses.length} expenses.`)

  // 3. Fetch Payments
  console.log('Fetching payments...')
  const paymentsSnap = await db.collection('ttc_payment')
    .where('groupId', '==', DEMO_GROUP_ID)
    .get()
  
  const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`Found ${payments.length} payments.`)

  // 4. Calculate Logic (Ported from useUserStore.ts)
  console.log('\nCalculating...\n')
  
  const debtGraph = new Map() // [debtorId][creditorId] = amount

  // Init graph
  users.forEach(u => debtGraph.set(u.id, new Map()))

  // Process Expenses
  expenses.forEach(expense => {
    const payerId = expense.userId
    // Determine splitters
    let splitUserIds = []
    if (expense.splitAmong && expense.splitAmong.length > 0) {
      splitUserIds = expense.splitAmong.filter(id => users.some(u => u.id === id))
      if (splitUserIds.length === 0) splitUserIds = users.map(u => u.id)
    } else {
      splitUserIds = users.map(u => u.id)
    }

    const shareAmount = expense.amount / splitUserIds.length
    
    console.log(`Expense: ${expense.description} ($${expense.amount}) by ${expense.userName}`)
    console.log(`   -> Split among ${splitUserIds.length} people ($${shareAmount.toFixed(2)} each)`)

    splitUserIds.forEach(participantId => {
      if (participantId !== payerId) {
        const debtorDebts = debtGraph.get(participantId)
        if (debtorDebts) {
          const current = debtorDebts.get(payerId) || 0
          debtorDebts.set(payerId, current + shareAmount)
        }
      }
    })
  })

  // Process Payments
  payments.forEach(payment => {
     console.log(`Payment: ${payment.fromUserId} paid ${payment.amount} to ${payment.toUserId}`)
     const fromId = payment.fromUserId
     const toId = payment.toUserId

     const fromOwesTo = debtGraph.get(fromId)?.get(toId) || 0
     const toOwesFrom = debtGraph.get(toId)?.get(fromId) || 0

     if (fromOwesTo >= payment.amount) {
       debtGraph.get(fromId)?.set(toId, fromOwesTo - payment.amount)
     } else {
       debtGraph.get(fromId)?.set(toId, 0)
       const excess = payment.amount - fromOwesTo
       debtGraph.get(toId)?.set(fromId, toOwesFrom + excess)
     }
  })

  // Simplify Graph
  users.forEach(userA => {
    users.forEach(userB => {
      if (userA.id >= userB.id) return
      
      const aOwesB = debtGraph.get(userA.id)?.get(userB.id) || 0
      const bOwesA = debtGraph.get(userB.id)?.get(userA.id) || 0
      
      if (aOwesB > bOwesA) {
        debtGraph.get(userA.id)?.set(userB.id, aOwesB - bOwesA)
        debtGraph.get(userB.id)?.set(userA.id, 0)
      } else if (bOwesA > aOwesB) {
        debtGraph.get(userB.id)?.set(userA.id, bOwesA - aOwesB)
        debtGraph.get(userA.id)?.set(userB.id, 0)
      } else {
         debtGraph.get(userA.id)?.set(userB.id, 0)
         debtGraph.get(userB.id)?.set(userA.id, 0)
      }
    })
  })

  // Output Results
  console.log('\n=== SETTLEMENT RESULTS ===')
  const settlements = []
  debtGraph.forEach((creditors, debtorId) => {
    creditors.forEach((amount, creditorId) => {
      if (amount > 0.01) {
        const debtorName = users.find(u => u.id === debtorId)?.name
        const creditorName = users.find(u => u.id === creditorId)?.name
        settlements.push({ from: debtorName, to: creditorName, amount })
        console.log(`💸 ${debtorName} owes ${creditorName}: $${Math.round(amount)}`)
      }
    })
  })

  if (settlements.length === 0) {
    console.log('✅ Everyone is settled up! (No debts found)')
  }

  process.exit(0)
}

main().catch(console.error)
