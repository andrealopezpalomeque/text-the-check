import 'dotenv/config';
import admin from 'firebase-admin';

// ============================================
// Configuration
// ============================================
const INTERVAL_SECONDS = 30; // Send every 30 seconds for testing
const RUN_ONCE = process.argv.includes('--once'); // Run once if --once flag is passed

// ============================================
// Firebase Admin Initialization
// ============================================
if (!admin.apps.length) {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'viaje-grupo',
  };

  // If service account JSON is provided as env var (base64 encoded)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
    );
    firebaseConfig.credential = admin.credential.cert(serviceAccount);
  }

  admin.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized');
}

const db = admin.firestore();
const messaging = admin.messaging();

// ============================================
// Send Test Notifications
// ============================================
async function sendTestNotifications() {
  console.log('\n📤 Sending test notifications...');
  console.log(`   Time: ${new Date().toLocaleString('es-AR')}`);

  try {
    // Query all enabled FCM tokens
    const tokensSnapshot = await db
      .collection('pt_fcm_token')
      .where('notificationsEnabled', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.log('   No tokens found with notifications enabled');
      return;
    }

    console.log(`   Found ${tokensSnapshot.size} token(s)`);

    // Send notification to each token
    let successCount = 0;
    let failCount = 0;

    for (const doc of tokensSnapshot.docs) {

      const data = doc.data();
      const token = data.token;

      try {
        const message = {
          token: token,
          notification: {
            title: '🔔 PayTrackr - Test',
            body: `Notificación de prueba enviada a las ${new Date().toLocaleTimeString('es-AR')}`
          },
          data: {
            url: '/one-time',
            type: 'test'
          },
          webpush: {
            fcmOptions: {
              link: '/one-time'
            },
            notification: {
              icon: '/img/new-logo.png',
              badge: '/img/new-logo.png'
            }
          }
        };

        const response = await messaging.send(message);
        console.log(`   ✅ Sent to user ${data.userId.substring(0, 8)}... - ID: ${response}`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed for user ${data.userId.substring(0, 8)}...: ${error.message}`);
        failCount++;

        // If token is invalid, we could delete it (optional)
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          console.log(`   🗑️  Removing invalid token for user ${data.userId.substring(0, 8)}...`);
          await db.collection('pt_fcm_token').doc(doc.id).delete();
        }
      }
    }

    console.log(`   Summary: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
  }
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('🚀 PayTrackr Test Notification Script');
  console.log('=====================================');

  if (RUN_ONCE) {
    console.log('Mode: Single run (--once)');
    await sendTestNotifications();
    console.log('\n✅ Done');
    process.exit(0);
  } else {
    console.log(`Mode: Continuous (every ${INTERVAL_SECONDS} seconds)`);
    console.log('Press Ctrl+C to stop\n');

    // Send immediately
    await sendTestNotifications();

    // Then repeat every INTERVAL_SECONDS
    setInterval(sendTestNotifications, INTERVAL_SECONDS * 1000);
  }
}

main().catch(console.error);
