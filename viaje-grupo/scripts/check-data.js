const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Initialize with environment variables (same as server)
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
});

const db = admin.firestore();

async function checkData() {
  try {
    // Get all groups
    const groupsSnapshot = await db.collection('ttc_group').get();
    console.log('\n=== Groups ===');
    groupsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Members: ${JSON.stringify(data.members)}`);
    });

    // Get all users
    const usersSnapshot = await db.collection('ttc_user').get();
    console.log('\n=== Users ===');
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}, Name: ${data.name}`);
    });

    // Get expense count
    const expensesSnapshot = await db.collection('ttc_expense').get();
    console.log(`\n=== Expenses: ${expensesSnapshot.size} total ===`);

    // Show last 3 expenses
    const expenses = [];
    expensesSnapshot.forEach(doc => expenses.push({ id: doc.id, ...doc.data() }));
    expenses.slice(0, 3).forEach(e => {
      console.log(`  ${e.amount} - ${e.description} (by ${e.userName})`);
    });

    // Get payment count
    const paymentsSnapshot = await db.collection('ttc_payment').get();
    console.log(`\n=== Payments: ${paymentsSnapshot.size} total ===`);

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkData();
