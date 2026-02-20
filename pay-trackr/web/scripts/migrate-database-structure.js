import admin from "firebase-admin";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween);

// Import service account using ES6 modules
import serviceAccount from "./service-credentials.json" assert { type: "json" };
import { Timestamp } from "firebase-admin/firestore";

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Migration stats for reporting
const stats = {
  totalPayments: 0,
  processedPayments: 0,
  createdRecurrents: 0,
  totalTrackers: 0,
  processedTrackers: 0,
  createdNewPayments: 0,
  errors: []
};

// Log with timestamp for better tracking
const logStatus = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Log error with timestamp
const logError = (message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error);
  stats.errors.push({ timestamp, message, error: error.toString() });
};

// Fetch all documents from a collection
async function fetchCollection(collectionName) {
  try {
    logStatus(`Fetching all documents from '${collectionName}' collection...`);
    const snapshot = await db.collection(collectionName).get();
    const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    logStatus(`Successfully fetched ${docs.length} documents from '${collectionName}'`);
    return docs;
  } catch (error) {
    logError(`Failed to fetch documents from '${collectionName}'`, error);
    return [];
  }
}

// Create recurrent payments
async function createRecurrentPayments(payments) {
  logStatus("=== Starting recurrent payments migration ===");
  stats.totalPayments = payments.length;
  
  const recurrentObjects = [];
  const validUserId = "ccmFgIVugBYdPlgabAIwiHZztTA2";
  
  // Using Promise.all with map instead of forEach to properly handle async
  await Promise.all(payments.map(async (payment, index) => {
    logStatus(`Processing payment ${index + 1} of ${payments.length}`);
    stats.processedPayments++;
    
    if (payment.user_id === validUserId) {
      const recurrent = {
        title: payment.title,
        description: payment.description,
        amount: payment.amount,
        startDate: payment.dueDate,
        dueDateDay: payment.dueDate.split("/")[1],
        endDate: null,
        timePeriod: payment.timePeriod,
        category: payment.category,
        isCreditCard: false,
        creditCardId: null,
        userId: payment.user_id,
        createdAt: payment.createdAt
      };

      try {
        const newDoc = await db.collection("pt_recurrent").add(recurrent);
        logStatus(`Created recurrent payment with ID: ${newDoc.id}`);
        recurrentObjects.push({ ...recurrent, id: newDoc.id });
        stats.createdRecurrents++;
      } catch (error) {
        logError(`Failed to create recurrent payment for ${payment.title}`, error);
      }
    }
  }));
  
  logStatus(`=== Completed recurrent payments migration: ${stats.createdRecurrents}/${stats.totalPayments} created ===`);
  return recurrentObjects;
}

// Create payments from trackers
async function createPaymentsFromTrackers(trackers, recurrentObjects) {
  logStatus("=== Starting tracker-to-payment migration ===");
  stats.totalTrackers = trackers.length;
  
  // Process trackers sequentially for better logging and error handling
  for (let i = 0; i < trackers.length; i++) {
    const tracker = trackers[i];
    logStatus(`Processing tracker ${i + 1} of ${trackers.length}`);
    stats.processedTrackers++;
    
    // Process payments within each tracker sequentially
    for (let j = 0; j < tracker.payments.length; j++) {
      const trackerPay = tracker.payments[j];
      logStatus(`Processing payment ${j + 1} of ${tracker.payments.length} from tracker ${i + 1}`);
      
      // Find recurrent ID based on title
      const recurrent = recurrentObjects.find((rec) => rec.title === trackerPay.title);
      const recurrentId = recurrent ? recurrent.id : null;
      
      if (recurrentId) {
        logStatus(`Found matching recurrent payment with ID: ${recurrentId}`);
      } else {
        logStatus(`No matching recurrent payment found for "${trackerPay.title}"`);
      }

      // Create payment object
      const payment = {
        title: trackerPay.title ? trackerPay.title : "",
        description: trackerPay.description ? trackerPay.description : "",
        amount: trackerPay.amount ? trackerPay.amount : 0,
        category: trackerPay.category ? trackerPay.category : "Other",
        isPaid: trackerPay.isPaid ? trackerPay.isPaid : false,
        paidDate: Timestamp.fromDate(dayjs(trackerPay.dueDate, { format: 'MM/DD/YYYY' }).toDate()),
        recurrentId: recurrentId ? recurrentId : null,
        paymentType: !trackerPay.timePeriod || trackerPay.timePeriod == "monthly" ? "recurrent" : "one-time",
        userId: tracker.user_id ? tracker.user_id : null,
        createdAt: Timestamp.fromDate(dayjs(trackerPay.dueDate, { format: 'MM/DD/YYYY' }).toDate()),
      };

      try {
        const newDoc = await db.collection("pt_payment").add(payment);
        logStatus(`Created new payment with ID: ${newDoc.id}`);
        stats.createdNewPayments++;
      } catch (error) {
        logError(`Failed to create payment for ${payment.title}`, error);
      }
    }
  }
  
  logStatus(`=== Completed tracker-to-payment migration: ${stats.createdNewPayments} payments created ===`);
}

// Main migration function
async function runMigration() {
  logStatus("Starting database migration process");
  
  // Step 1: Fetch all existing payments
  // const allPayments = await fetchCollection("payment");
  
  // Step 2: Create recurrent payments and get references
  const recurrentObjects = await fetchCollection("pt_recurrent");//await createRecurrentPayments(allPayments);
  logStatus(`Created ${recurrentObjects.length} recurrent payment references`);
  
  // Step 3: Fetch all trackers
  const allTrackers = await fetchCollection("tracker");
  
  // Step 4: Create payments from trackers
  await createPaymentsFromTrackers(allTrackers, recurrentObjects);
  
  // Print final migration stats
  logStatus("\n=== MIGRATION SUMMARY ===");
  logStatus(`Payments processed: ${stats.processedPayments}/${stats.totalPayments}`);
  logStatus(`Recurrent payments created: ${stats.createdRecurrents}`);
  logStatus(`Trackers processed: ${stats.processedTrackers}/${stats.totalTrackers}`);
  logStatus(`New payments created: ${stats.createdNewPayments}`);
  logStatus(`Errors encountered: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    logStatus("\n=== ERROR DETAILS ===");
    stats.errors.forEach((err, i) => {
      logStatus(`Error ${i+1}: ${err.message} (${err.timestamp})`);
    });
  }
  
  logStatus("Migration process completed");
}

// Execute the migration
runMigration().catch(error => {
  logError("Migration failed with critical error", error);
  process.exit(1);
});