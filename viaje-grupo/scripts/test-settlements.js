const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Initialize with environment variables
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
});

const db = admin.firestore();

// Demo group members (from check-data.js)
const DEMO_GROUP_ID = 'demo-group';
const USERS = {
  pipi: { id: 'LcC9X6kIsWwNcGRjIrYE', name: 'Pipi López Palomeque' },
  carlos: { id: 'gzZvrdAIzAKfVv7rOgdv', name: 'Carlos Demo' },
  laura: { id: 'gnTnZtWPxF4ImFeDgVE7', name: 'Laura Demo' },
  virginia: { id: 'mW2rp5h0qeSvojlVoaLr', name: 'Virginia' }
};

const args = process.argv.slice(2);
const command = args[0];

async function clearTestData() {
  console.log('Clearing test data from demo-group...\n');

  // Delete expenses
  const expensesSnapshot = await db.collection('ttc_expense')
    .where('groupId', '==', DEMO_GROUP_ID)
    .get();

  const expenseDeletes = expensesSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(expenseDeletes);
  console.log(`Deleted ${expensesSnapshot.size} expenses`);

  // Delete payments
  const paymentsSnapshot = await db.collection('ttc_payment')
    .where('groupId', '==', DEMO_GROUP_ID)
    .get();

  const paymentDeletes = paymentsSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(paymentDeletes);
  console.log(`Deleted ${paymentsSnapshot.size} payments`);

  console.log('\nTest data cleared!');
}

async function setupBugFixTest() {
  console.log('=== BUG FIX TEST SCENARIO ===\n');
  console.log('This tests that payments are shown in breakdown.\n');

  // Scenario: Pipi pays $1000 pizza, split with Carlos
  // Then Carlos makes a $250 payment to Pipi
  // Settlement should show $500 with breakdown showing payment

  const expenses = [
    {
      userId: USERS.pipi.id,
      userName: USERS.pipi.name,
      amount: 1000,
      description: 'Pizza para dos',
      category: 'food',
      originalInput: '1000 Pizza para dos @carlos',
      splitAmong: [USERS.pipi.id, USERS.carlos.id],
      groupId: DEMO_GROUP_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      userId: USERS.pipi.id,
      userName: USERS.pipi.name,
      amount: 500,
      description: 'Taxi nocturno',
      category: 'transport',
      originalInput: '500 Taxi nocturno @carlos',
      splitAmong: [USERS.pipi.id, USERS.carlos.id],
      groupId: DEMO_GROUP_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const expense of expenses) {
    await db.collection('ttc_expense').add(expense);
    console.log(`Added expense: $${expense.amount} ${expense.description}`);
  }

  // Add a payment from Carlos to Pipi
  const payment = {
    groupId: DEMO_GROUP_ID,
    fromUserId: USERS.carlos.id,
    toUserId: USERS.pipi.id,
    amount: 250,
    recordedBy: USERS.carlos.id,
    authUid: 'test-auth',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('ttc_payment').add(payment);
  console.log(`Added payment: Carlos -> Pipi: $250`);

  console.log('\n=== EXPECTED RESULTS ===');
  console.log('Carlos owes Pipi from expenses:');
  console.log('  Pizza: $1000 / 2 = $500');
  console.log('  Taxi:  $500 / 2 = $250');
  console.log('  Total: $750');
  console.log('\nCarlos already paid: $250');
  console.log('Settlement should show: Carlos -> Pipi: $500');
  console.log('\nBreakdown should show:');
  console.log('  [x] Pizza: $500');
  console.log('  [x] Taxi: $250');
  console.log('  ----');
  console.log('  Pagos realizados:');
  console.log('  [date]  -$250');
  console.log('  ----');
  console.log('  Total gastos: $750');
  console.log('  Ya pagado: -$250');
  console.log('  Pendiente: $500');
}

async function setupSimplificationTest() {
  console.log('=== SIMPLIFICATION TEST SCENARIO ===\n');
  console.log('This tests circular debts and simplification.\n');

  // Circular debt scenario with 3 users:
  // Pipi pays $300, split with Carlos and Laura (each owes $100)
  // Carlos pays $150, split with Pipi and Laura (each owes $50)
  // Laura pays $90, split with Pipi only (Pipi owes $45)

  const expenses = [
    {
      userId: USERS.pipi.id,
      userName: USERS.pipi.name,
      amount: 300,
      description: 'Almuerzo grupal',
      category: 'food',
      originalInput: '300 Almuerzo grupal @carlos @laura',
      splitAmong: [USERS.pipi.id, USERS.carlos.id, USERS.laura.id],
      groupId: DEMO_GROUP_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      userId: USERS.carlos.id,
      userName: USERS.carlos.name,
      amount: 150,
      description: 'Cafe y medialunas',
      category: 'food',
      originalInput: '150 Cafe y medialunas @pipi @laura',
      splitAmong: [USERS.carlos.id, USERS.pipi.id, USERS.laura.id],
      groupId: DEMO_GROUP_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      userId: USERS.laura.id,
      userName: USERS.laura.name,
      amount: 90,
      description: 'Uber a casa',
      category: 'transport',
      originalInput: '90 Uber a casa @pipi',
      splitAmong: [USERS.laura.id, USERS.pipi.id],
      groupId: DEMO_GROUP_ID,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const expense of expenses) {
    await db.collection('ttc_expense').add(expense);
    console.log(`Added expense: $${expense.amount} ${expense.description} (paid by ${expense.userName})`);
  }

  console.log('\n=== DEBT ANALYSIS ===');
  console.log('Pipi paid $300, split 3 ways = $100 each');
  console.log('  -> Carlos owes Pipi: $100');
  console.log('  -> Laura owes Pipi: $100');
  console.log('');
  console.log('Carlos paid $150, split 3 ways = $50 each');
  console.log('  -> Pipi owes Carlos: $50');
  console.log('  -> Laura owes Carlos: $50');
  console.log('');
  console.log('Laura paid $90, split 2 ways = $45 each');
  console.log('  -> Pipi owes Laura: $45');

  console.log('\n=== WITHOUT SIMPLIFICATION (Direct) ===');
  console.log('Net after mutual netting:');
  console.log('  Carlos -> Pipi: $100 - $50 = $50');
  console.log('  Laura -> Pipi: $100 - $45 = $55');
  console.log('  Laura -> Carlos: $50');
  console.log('Total: 3 transfers');

  console.log('\n=== WITH SIMPLIFICATION ===');
  console.log('Net balances:');
  console.log('  Pipi: paid $300, share $195 (100+50+45) = net +$105 (creditor)');
  console.log('  Carlos: paid $150, share $150 (100+50) = net $0 (even)');
  console.log('  Laura: paid $90, share $195 (100+50+45) = net -$105 (debtor)');
  console.log('Simplified: Laura -> Pipi: $105 (only 1 transfer!)');
}

async function setupEdgeCaseTest() {
  console.log('=== EDGE CASE TEST SCENARIO ===\n');

  // Single debt (should be same in both modes)
  const expense = {
    userId: USERS.virginia.id,
    userName: USERS.virginia.name,
    amount: 200,
    description: 'Helado',
    category: 'food',
    originalInput: '200 Helado @pipi',
    splitAmong: [USERS.virginia.id, USERS.pipi.id],
    groupId: DEMO_GROUP_ID,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('ttc_expense').add(expense);
  console.log(`Added expense: $${expense.amount} ${expense.description}`);

  console.log('\n=== EXPECTED RESULTS ===');
  console.log('Single debt: Pipi -> Virginia: $100');
  console.log('Should be identical in both modes.');
}

async function showCurrentState() {
  console.log('=== CURRENT DATA STATE ===\n');

  const expensesSnapshot = await db.collection('ttc_expense')
    .where('groupId', '==', DEMO_GROUP_ID)
    .get();

  console.log(`Expenses in demo-group: ${expensesSnapshot.size}`);
  expensesSnapshot.forEach(doc => {
    const e = doc.data();
    console.log(`  $${e.amount} ${e.description} (by ${e.userName})`);
  });

  const paymentsSnapshot = await db.collection('ttc_payment')
    .where('groupId', '==', DEMO_GROUP_ID)
    .get();

  console.log(`\nPayments in demo-group: ${paymentsSnapshot.size}`);
  paymentsSnapshot.forEach(doc => {
    const p = doc.data();
    console.log(`  $${p.amount} from ${p.fromUserId} to ${p.toUserId}`);
  });
}

async function main() {
  try {
    switch (command) {
      case 'clear':
        await clearTestData();
        break;

      case 'bugfix':
        await clearTestData();
        console.log('\n');
        await setupBugFixTest();
        break;

      case 'simplify':
        await clearTestData();
        console.log('\n');
        await setupSimplificationTest();
        break;

      case 'edge':
        await clearTestData();
        console.log('\n');
        await setupEdgeCaseTest();
        break;

      case 'all':
        await clearTestData();
        console.log('\n');
        await setupBugFixTest();
        console.log('\n\n');
        await setupSimplificationTest();
        break;

      case 'status':
        await showCurrentState();
        break;

      default:
        console.log('Settlement Testing Script');
        console.log('========================\n');
        console.log('Usage: node scripts/test-settlements.js <command>\n');
        console.log('Commands:');
        console.log('  clear     - Clear all test data from demo-group');
        console.log('  bugfix    - Setup bug fix test (payments in breakdown)');
        console.log('  simplify  - Setup simplification test (circular debts)');
        console.log('  edge      - Setup edge case test (single debt)');
        console.log('  all       - Setup both bugfix and simplify scenarios');
        console.log('  status    - Show current data state');
        console.log('\nExample:');
        console.log('  node scripts/test-settlements.js bugfix');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

main();
