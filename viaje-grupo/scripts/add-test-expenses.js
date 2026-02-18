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

// Demo group members
const DEMO_GROUP_ID = 'demo-group';
const USERS = {
  virginia: { id: 'mW2rp5h0qeSvojlVoaLr', name: 'Virginia' },
  carlos: { id: 'gzZvrdAIzAKfVv7rOgdv', name: 'Carlos Demo' },
  laura: { id: 'gnTnZtWPxF4ImFeDgVE7', name: 'Laura Demo' },
  pipi: { id: 'LcC9X6kIsWwNcGRjIrYE', name: 'Pipi López Palomeque' }
};

async function addTestExpenses() {
  try {
    console.log('Adding test expenses to demo-group...\n');

    const expenses = [
      {
        userId: USERS.carlos.id,
        userName: USERS.carlos.name,
        amount: 5000,
        description: 'Cena en restaurante',
        category: 'food',
        originalInput: '5000 Cena en restaurante',
        splitAmong: [], // Everyone splits
        groupId: DEMO_GROUP_ID,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: USERS.laura.id,
        userName: USERS.laura.name,
        amount: 3000,
        description: 'Taxi al aeropuerto',
        category: 'transport',
        originalInput: '3000 Taxi al aeropuerto',
        splitAmong: [], // Everyone splits
        groupId: DEMO_GROUP_ID,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: USERS.virginia.id,
        userName: USERS.virginia.name,
        amount: 8000,
        description: 'Supermercado',
        category: 'food',
        originalInput: '8000 Supermercado',
        splitAmong: [], // Everyone splits
        groupId: DEMO_GROUP_ID,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const expense of expenses) {
      const docRef = await db.collection('ttc_expense').add(expense);
      console.log(`Added: $${expense.amount} ${expense.description} (paid by ${expense.userName})`);
    }

    console.log('\n=== Settlement calculation ===');
    console.log('Total: $16,000 split 4 ways = $4,000/person');
    console.log('- Carlos paid $5,000, owes $4,000 = +$1,000 (is owed)');
    console.log('- Laura paid $3,000, owes $4,000 = -$1,000 (owes)');
    console.log('- Virginia paid $8,000, owes $4,000 = +$4,000 (is owed)');
    console.log('- Pipi paid $0, owes $4,000 = -$4,000 (owes)');
    console.log('\nSettlements should show:');
    console.log('- Laura -> Carlos: ~$1,000');
    console.log('- Pipi -> Virginia: ~$4,000 (or split between Virginia/Carlos)');

    console.log('\nDone! Now go to the dashboard, select "Grupo Demo", go to "Grupo" tab.');

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

addTestExpenses();
