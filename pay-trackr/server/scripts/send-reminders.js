import 'dotenv/config';
import * as Sentry from '@sentry/node';
import admin from 'firebase-admin';

// ============================================
// Configuration
// ============================================
const MODE = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : 'morning';

const TIMEZONE = 'America/Argentina/Buenos_Aires';

// ============================================
// Firebase Admin Initialization
// ============================================
if (!admin.apps.length) {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'viaje-grupo',
  };

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
    );
    firebaseConfig.credential = admin.credential.cert(serviceAccount);
  }

  admin.initializeApp(firebaseConfig);
  console.log('Firebase initialized');
}

const db = admin.firestore();
const messaging = admin.messaging();

// ============================================
// Main Script
// ============================================
async function main() {
  console.log('========================================');
  console.log('PayTrackr - Payment Reminders');
  console.log('========================================');
  console.log(`Mode: ${MODE}`);

  // Get current date in Argentina timezone
  const now = new Date();
  const argentinaDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const todayDay = argentinaDate.getDate();
  const todayMonth = argentinaDate.getMonth();
  const todayYear = argentinaDate.getFullYear();

  // Calculate 3 days from now
  const threeDaysFromNow = new Date(argentinaDate);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysDay = threeDaysFromNow.getDate();
  const threeDaysMonth = threeDaysFromNow.getMonth();
  const threeDaysYear = threeDaysFromNow.getFullYear();

  console.log(`Time (ART): ${argentinaDate.toLocaleString('es-AR')}`);
  console.log(`Today: day ${todayDay}`);
  if (MODE === 'morning') {
    console.log(`3 days from now: day ${threeDaysDay}`);
  }

  // ----------------------------------------
  // Step 1: Fetch recurrent templates matching due dates
  // ----------------------------------------
  console.log('\n--- Fetching recurrent templates ---');
  const dueDays = MODE === 'morning'
    ? [String(todayDay), String(threeDaysDay)]
    : [String(todayDay)];
  console.log(`Filtering by dueDateDay in [${dueDays.join(', ')}]`);
  const recurrentsSnapshot = await db.collection('pt_recurrent')
    .where('dueDateDay', 'in', dueDays)
    .get();

  if (recurrentsSnapshot.empty) {
    console.log('No recurrent templates found');
    process.exit(0);
  }

  console.log(`Found ${recurrentsSnapshot.size} recurrent templates`);

  // ----------------------------------------
  // Step 2: Filter templates by due date
  // ----------------------------------------
  const paymentsToNotify = []; // { recurrent, userId, daysUntilDue }

  for (const doc of recurrentsSnapshot.docs) {
    const recurrent = { id: doc.id, ...doc.data() };
    const dueDateDay = parseInt(recurrent.dueDateDay);

    // Check if endDate has passed (template is no longer active)
    if (recurrent.endDate) {
      const endDate = new Date(recurrent.endDate);
      if (endDate < argentinaDate) {
        continue; // Skip expired templates
      }
    }

    // Check if due today
    if (dueDateDay === todayDay) {
      paymentsToNotify.push({ recurrent, daysUntilDue: 0 });
    }
    // Check if due in 3 days (morning mode only)
    else if (MODE === 'morning' && dueDateDay === threeDaysDay) {
      // Handle month boundary: if 3 days from now is next month, check accordingly
      paymentsToNotify.push({ recurrent, daysUntilDue: 3 });
    }
  }

  console.log(`Templates matching due date criteria: ${paymentsToNotify.length}`);

  if (paymentsToNotify.length === 0) {
    console.log('\nNo payments to notify');
    process.exit(0);
  }

  // ----------------------------------------
  // Step 3: Check which ones are already paid this month
  // ----------------------------------------
  console.log('\n--- Checking payment status ---');

  const unpaidPayments = [];

  for (const { recurrent, daysUntilDue } of paymentsToNotify) {
    // Determine which month we're checking
    const checkMonth = daysUntilDue === 0 ? todayMonth : threeDaysMonth;
    const checkYear = daysUntilDue === 0 ? todayYear : threeDaysYear;

    // Calculate month boundaries for the query
    const monthStart = new Date(checkYear, checkMonth, 1);
    const monthEnd = new Date(checkYear, checkMonth + 1, 0, 23, 59, 59, 999);

    // Check if there's a paid instance for this recurrent in the target month
    const instancesSnapshot = await db
      .collection('pt_payment')
      .where('recurrentId', '==', recurrent.id)
      .where('isPaid', '==', true)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(monthStart))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(monthEnd))
      .limit(1)
      .get();

    if (instancesSnapshot.empty) {
      // No paid instance found - add to notification list
      unpaidPayments.push({ recurrent, daysUntilDue });
      console.log(`   "${recurrent.title}" - UNPAID (due ${daysUntilDue === 0 ? 'today' : 'in 3 days'})`);
    } else {
      console.log(`   "${recurrent.title}" - already paid, skipping`);
    }
  }

  if (unpaidPayments.length === 0) {
    console.log('\nAll matching payments are already paid');
    process.exit(0);
  }

  // ----------------------------------------
  // Step 4: Group by userId and fetch tokens
  // ----------------------------------------
  console.log('\n--- Sending notifications ---');

  const paymentsByUser = {};
  for (const payment of unpaidPayments) {
    const userId = payment.recurrent.userId;
    if (!paymentsByUser[userId]) {
      paymentsByUser[userId] = [];
    }
    paymentsByUser[userId].push(payment);
  }

  console.log(`Users to notify: ${Object.keys(paymentsByUser).length}`);

  let totalSent = 0;
  let totalFailed = 0;

  for (const [userId, payments] of Object.entries(paymentsByUser)) {
    // Fetch FCM tokens for this user
    const tokensSnapshot = await db
      .collection('pt_fcm_token')
      .where('userId', '==', userId)
      .where('notificationsEnabled', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.log(`\n   User ${userId.substring(0, 8)}... has no active tokens, skipping`);
      continue;
    }

    const tokens = tokensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`\n   User ${userId.substring(0, 8)}... (${tokens.length} token(s), ${payments.length} payment(s))`);

    // Send notification for each payment to each token
    for (const { recurrent, daysUntilDue } of payments) {
      const dueText = daysUntilDue === 0 ? 'vence hoy' : `vence en ${daysUntilDue} días`;
      const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
      }).format(recurrent.amount);

      const body = `Tu pago de '${recurrent.title}' de ${formattedAmount} ${dueText}`;

      for (const tokenDoc of tokens) {
        try {
          await messaging.send({
            token: tokenDoc.token,
            notification: {
              title: 'PayTrackr - Recordatorio',
              body: body
            },
            data: {
              url: '/fijos',
              type: 'reminder'
            },
            webpush: {
              fcmOptions: { link: '/fijos' },
              notification: {
                icon: '/img/new-logo.png',
                badge: '/img/new-logo.png'
              }
            }
          });
          console.log(`      Sent: "${recurrent.title}" (${daysUntilDue === 0 ? 'today' : '3 days'})`);
          totalSent++;
        } catch (error) {
          console.error(`      Failed: "${recurrent.title}" - ${error.message}`);
          totalFailed++;
          Sentry.captureException(error, { extra: { userId: userId.substring(0, 8), tokenId: tokenDoc.id.substring(0, 8), title: recurrent.title, context: 'fcmSendReminder' } });

          // Remove invalid tokens
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            await db.collection('pt_fcm_token').doc(tokenDoc.id).delete();
            console.log(`      Removed invalid token`);
          }
        }
      }
    }
  }

  // ----------------------------------------
  // Done
  // ----------------------------------------
  console.log(`\n========================================`);
  console.log(`Summary: ${totalSent} sent, ${totalFailed} failed`);
  console.log('Done');
  await Sentry.flush(5000);
  process.exit(0);
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  Sentry.captureException(error);
  await Sentry.flush(5000);
  process.exit(1);
});
