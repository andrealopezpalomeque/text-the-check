import 'dotenv/config';
import * as Sentry from '@sentry/node';
import admin from 'firebase-admin';
import GeminiHandler from '../handlers/GeminiHandler.js';

// ============================================
// Configuration
// ============================================
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

const geminiHandler = process.env.GEMINI_API_KEY
  ? new GeminiHandler(process.env.GEMINI_API_KEY)
  : null;

if (!geminiHandler) {
  console.warn('GEMINI_API_KEY not set — AI insights will be skipped');
  Sentry.captureMessage('Weekly summary: GEMINI_API_KEY not set', { level: 'warning' });
}

// ============================================
// Main Script
// ============================================
async function main() {
  console.log('========================================');
  console.log('PayTrackr - Weekly Summary');
  console.log('========================================');

  // Get current date in Argentina timezone
  const now = new Date();
  const argentinaDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const todayDay = argentinaDate.getDate();
  const todayMonth = argentinaDate.getMonth();
  const todayYear = argentinaDate.getFullYear();

  // Calculate 7 days from now
  const sevenDaysFromNow = new Date(argentinaDate);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysDay = sevenDaysFromNow.getDate();
  const sevenDaysMonth = sevenDaysFromNow.getMonth();

  // Calculate 7 days ago
  const sevenDaysAgo = new Date(argentinaDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoDay = sevenDaysAgo.getDate();
  const sevenDaysAgoMonth = sevenDaysAgo.getMonth();

  // Current month boundaries
  const monthStart = new Date(todayYear, todayMonth, 1);
  const monthEnd = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999);

  console.log(`Time (ART): ${argentinaDate.toLocaleString('es-AR')}`);
  console.log(`Today: day ${todayDay}, past week from day ${sevenDaysAgoDay}, next week through day ${sevenDaysDay}`);
  console.log(`Month range: ${monthStart.toLocaleDateString('es-AR')} - ${monthEnd.toLocaleDateString('es-AR')}`);

  // ----------------------------------------
  // Step 1: Fetch ALL recurrent templates
  // Full scan needed: dueDateDay is a string and we need a 7-day range
  // that may span month boundaries, so Firestore where() can't filter this
  // ----------------------------------------
  console.log('\n--- Fetching recurrent templates ---');
  const recurrentsSnapshot = await db.collection('p_t_recurrent').get();

  if (recurrentsSnapshot.empty) {
    console.log('No recurrent templates found');
    process.exit(0);
  }

  console.log(`Found ${recurrentsSnapshot.size} recurrent templates`);

  // Group by userId, filter expired
  const recurrentsByUser = {};
  for (const doc of recurrentsSnapshot.docs) {
    const recurrent = { id: doc.id, ...doc.data() };

    // Skip expired templates
    if (recurrent.endDate) {
      const endDate = new Date(recurrent.endDate);
      if (endDate < argentinaDate) continue;
    }

    const userId = recurrent.userId;
    if (!recurrentsByUser[userId]) {
      recurrentsByUser[userId] = [];
    }
    recurrentsByUser[userId].push(recurrent);
  }

  const userIds = Object.keys(recurrentsByUser);
  console.log(`Active users with recurrents: ${userIds.length}`);

  if (userIds.length === 0) {
    console.log('No active users to notify');
    process.exit(0);
  }

  // ----------------------------------------
  // Step 2: Per-user stats computation
  // ----------------------------------------
  console.log('\n--- Computing per-user stats ---');

  const formatAmount = (amount) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const userRecurrents = recurrentsByUser[userId];

    // Filter recurrents due past week (dueDateDay in [today-7..yesterday])
    const pastWeekRecurrents = userRecurrents.filter(r => {
      const dueDay = parseInt(r.dueDateDay);
      if (sevenDaysAgoMonth === todayMonth) {
        return dueDay >= sevenDaysAgoDay && dueDay < todayDay;
      } else {
        const daysInPrevMonth = new Date(todayYear, todayMonth, 0).getDate();
        return (dueDay >= sevenDaysAgoDay && dueDay <= daysInPrevMonth) || (dueDay >= 1 && dueDay < todayDay);
      }
    });

    // Filter recurrents due next week (dueDateDay in [today..today+7])
    const nextWeekRecurrents = userRecurrents.filter(r => {
      const dueDay = parseInt(r.dueDateDay);
      if (todayMonth === sevenDaysMonth) {
        return dueDay >= todayDay && dueDay <= sevenDaysDay;
      } else {
        const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
        return (dueDay >= todayDay && dueDay <= daysInMonth) || (dueDay >= 1 && dueDay <= sevenDaysDay);
      }
    });

    // Query payment2 for current month instances (both recurrent and one-time)
    const paymentsSnapshot = await db.collection('p_t_payment')
      .where('userId', '==', userId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(monthStart))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(monthEnd))
      .get();

    const monthPayments = paymentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Separate recurrent instances from one-time payments
    const recurrentInstances = monthPayments.filter(p => p.paymentType === 'recurrent');
    const oneTimePayments = monthPayments.filter(p => p.paymentType === 'one-time');

    // Compute stats
    const paidRecurrents = recurrentInstances.filter(p => p.isPaid);
    const unpaidRecurrents = recurrentInstances.filter(p => !p.isPaid);

    // Also count recurrents that have no instance yet this month as unpaid
    const instanceRecurrentIds = new Set(recurrentInstances.map(p => p.recurrentId));
    const noInstanceCount = userRecurrents.filter(r => !instanceRecurrentIds.has(r.id)).length;

    const totalPaidAmount = paidRecurrents.reduce((sum, p) => sum + (p.amount || 0), 0);
    const oneTimeAmount = oneTimePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Per-week paid/unpaid breakdown using recurrent instance data
    const paidRecurrentIds = new Set(paidRecurrents.map(p => p.recurrentId));

    const buildWeekStats = (weekRecurrents) => {
      const paid = weekRecurrents.filter(r => paidRecurrentIds.has(r.id));
      const unpaid = weekRecurrents.filter(r => !paidRecurrentIds.has(r.id));
      return {
        count: weekRecurrents.length,
        amount: weekRecurrents.reduce((sum, r) => sum + (r.amount || 0), 0),
        paidCount: paid.length,
        unpaidCount: unpaid.length,
        unpaidAmount: unpaid.reduce((sum, r) => sum + (r.amount || 0), 0)
      };
    };

    const pastWeek = buildWeekStats(pastWeekRecurrents);
    const nextWeek = buildWeekStats(nextWeekRecurrents);
    const totalUnpaidAmount = pastWeek.unpaidAmount + nextWeek.unpaidAmount;

    const stats = {
      pastWeek,
      nextWeek,
      totalUnpaidAmount,
      paidThisMonth: paidRecurrents.length,
      unpaidThisMonth: unpaidRecurrents.length + noInstanceCount,
      totalPaidAmount,
      oneTimeCount: oneTimePayments.length,
      oneTimeAmount
    };

    console.log(`\n   User ${userId.substring(0, 8)}...`);
    console.log(`   Past week: ${pastWeek.count} (${pastWeek.paidCount} paid, ${pastWeek.unpaidCount} unpaid)`);
    console.log(`   Next week: ${nextWeek.count} (${nextWeek.paidCount} paid, ${nextWeek.unpaidCount} unpaid)`);
    console.log(`   Total unpaid: $${totalUnpaidAmount.toLocaleString('es-AR')}`);
    console.log(`   Month: ${stats.paidThisMonth} paid, ${stats.unpaidThisMonth} unpaid`);
    console.log(`   One-time: ${stats.oneTimeCount} ($${stats.oneTimeAmount.toLocaleString('es-AR')})`);

    // ----------------------------------------
    // Step 3: AI insight
    // ----------------------------------------
    let aiInsight = null;
    if (geminiHandler) {
      aiInsight = await geminiHandler.getWeeklyInsight(stats);
      if (aiInsight) {
        console.log(`   AI insight: ${aiInsight}`);
      } else {
        console.log('   AI insight: unavailable');
        Sentry.captureMessage('Weekly summary: AI insight returned null', {
          level: 'error',
          extra: { userId: userId.substring(0, 8), stats }
        });
      }
    }

    // ----------------------------------------
    // Step 3.5: Persist weekly summary to Firestore (one doc per user, overwritten)
    // ----------------------------------------
    try {
      await db.collection('p_t_weekly_summary').doc(userId).set({
        userId,
        stats,
        aiInsight,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   Saved weekly summary to Firestore`);
    } catch (err) {
      console.error(`   Failed to save weekly summary: ${err.message}`);
      Sentry.captureException(err, { extra: { userId: userId.substring(0, 8), context: 'saveWeeklySummary' } });
    }

    // ----------------------------------------
    // Step 4: Build notification body
    // ----------------------------------------
    let body = `Entrante: ${nextWeek.count} pago(s) por ${formatAmount(nextWeek.amount)}. Pendiente total: ${formatAmount(totalUnpaidAmount)}.`;

    if (stats.oneTimeCount > 0) {
      body += ` Gastos únicos: ${stats.oneTimeCount} (${formatAmount(stats.oneTimeAmount)}).`;
    }

    body += '\nVer resumen';

    // ----------------------------------------
    // Step 5: Fetch FCM tokens and send
    // ----------------------------------------
    const tokensSnapshot = await db.collection('p_t_fcm_token')
      .where('userId', '==', userId)
      .where('notificationsEnabled', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.log(`   No active tokens, skipping`);
      continue;
    }

    const tokens = tokensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`   Sending to ${tokens.length} token(s)`);

    for (const tokenDoc of tokens) {
      try {
        await messaging.send({
          token: tokenDoc.token,
          notification: {
            title: 'PayTrackr - Resumen Semanal',
            body
          },
          data: {
            url: '/weekly-summary',
            type: 'weekly-summary'
          },
          webpush: {
            fcmOptions: { link: '/weekly-summary' },
            notification: {
              icon: '/img/new-logo.png',
              badge: '/img/new-logo.png'
            }
          }
        });
        console.log(`      Sent to token ${tokenDoc.id.substring(0, 8)}...`);
        totalSent++;
      } catch (error) {
        console.error(`      Failed: ${error.message}`);
        totalFailed++;
        Sentry.captureException(error, { extra: { userId: userId.substring(0, 8), tokenId: tokenDoc.id.substring(0, 8), context: 'fcmSendWeeklySummary' } });

        // Remove invalid tokens
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          await db.collection('p_t_fcm_token').doc(tokenDoc.id).delete();
          console.log(`      Removed invalid token`);
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
