import admin from "firebase-admin";

// Import service account using ES6 modules
import serviceAccount from "./service-credentials.json" with { type: "json" };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Migration stats for reporting
const stats = {
  totalPayments: 0,
  processedPayments: 0,
  updatedPayments: 0,
  totalRecurrents: 0,
  processedRecurrents: 0,
  updatedRecurrents: 0,
  categoriesCreated: 0,
  errors: []
};

// Legacy category to Spanish name mapping
const CATEGORY_MAPPING = {
  housing: { name: 'Vivienda y Alquiler', color: '#4682B4' },
  utilities: { name: 'Servicios', color: '#0072DF' },
  food: { name: 'Supermercado', color: '#1D9A38' },
  dining: { name: 'Salidas', color: '#FF6347' },
  transport: { name: 'Transporte', color: '#E6AE2C' },
  entertainment: { name: 'Entretenimiento', color: '#6158FF' },
  health: { name: 'Salud', color: '#E84A8A' },
  fitness: { name: 'Fitness y Deportes', color: '#FF4500' },
  personal_care: { name: 'Cuidado Personal', color: '#DDA0DD' },
  pet: { name: 'Mascotas', color: '#3CAEA3' },
  clothes: { name: 'Ropa', color: '#800020' },
  traveling: { name: 'Viajes', color: '#FF8C00' },
  education: { name: 'Educación', color: '#9370DB' },
  subscriptions: { name: 'Suscripciones', color: '#20B2AA' },
  gifts: { name: 'Regalos', color: '#FF1493' },
  taxes: { name: 'Impuestos y Gobierno', color: '#8B4513' },
  other: { name: 'Otros', color: '#808080' }
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
  stats.errors.push({ timestamp, message, error: error?.toString() });
};

// Get or create categories for a user
async function getOrCreateCategoriesForUser(userId) {
  logStatus(`Fetching/creating categories for user: ${userId}`);

  const categoryMap = new Map(); // Maps legacy key to categoryId

  try {
    // Check if user already has categories
    const existingCategories = await db.collection('p_t_expense_category')
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();

    if (!existingCategories.empty) {
      logStatus(`User ${userId} already has ${existingCategories.size} categories`);

      // Build map from name to id
      existingCategories.forEach(doc => {
        const data = doc.data();
        // Find the legacy key that matches this category name
        for (const [key, mapping] of Object.entries(CATEGORY_MAPPING)) {
          if (mapping.name === data.name) {
            categoryMap.set(key, doc.id);
            break;
          }
        }
      });

      return categoryMap;
    }

    // Create default categories for this user
    logStatus(`Creating default categories for user: ${userId}`);

    for (const [key, mapping] of Object.entries(CATEGORY_MAPPING)) {
      const newCategory = {
        name: mapping.name,
        color: mapping.color,
        userId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null
      };

      const docRef = await db.collection('p_t_expense_category').add(newCategory);
      categoryMap.set(key, docRef.id);
      stats.categoriesCreated++;
      logStatus(`Created category: ${mapping.name} (${docRef.id})`);
    }

    return categoryMap;
  } catch (error) {
    logError(`Failed to get/create categories for user ${userId}`, error);
    return categoryMap;
  }
}

// Migrate payments for a specific user
async function migratePaymentsForUser(userId, categoryMap) {
  logStatus(`Migrating payments for user: ${userId}`);

  try {
    // Fetch all payments for this user
    const paymentsSnapshot = await db.collection('p_t_payment')
      .where('userId', '==', userId)
      .get();

    stats.totalPayments += paymentsSnapshot.size;
    logStatus(`Found ${paymentsSnapshot.size} payments to process`);

    // Process in batches of 500 (Firestore limit)
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of paymentsSnapshot.docs) {
      const data = doc.data();
      stats.processedPayments++;

      // Skip if already has categoryId
      if (data.categoryId) {
        logStatus(`Payment ${doc.id} already has categoryId, skipping`);
        continue;
      }

      // Get the legacy category string
      const legacyCategory = (data.category || 'other').toLowerCase();
      const categoryId = categoryMap.get(legacyCategory) || categoryMap.get('other');

      if (!categoryId) {
        logError(`No categoryId found for legacy category: ${legacyCategory}`, null);
        continue;
      }

      // Update the document
      batch.update(doc.ref, { categoryId });
      stats.updatedPayments++;
      batchCount++;

      logStatus(`Prepared update for payment ${doc.id} with categoryId ${categoryId}`);

      // Commit batch every 500 documents
      if (batchCount >= 500) {
        await batch.commit();
        logStatus(`Committed batch of ${batchCount} payment updates`);
        batch = db.batch(); // Create new batch
        batchCount = 0;
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      logStatus(`Committed final batch of ${batchCount} payment updates`);
    }

  } catch (error) {
    logError(`Failed to migrate payments for user ${userId}`, error);
  }
}

// Migrate recurrent payments for a specific user
async function migrateRecurrentsForUser(userId, categoryMap) {
  logStatus(`Migrating recurrent payments for user: ${userId}`);

  try {
    // Fetch all recurrent payments for this user
    const recurrentsSnapshot = await db.collection('p_t_recurrent')
      .where('userId', '==', userId)
      .get();

    stats.totalRecurrents += recurrentsSnapshot.size;
    logStatus(`Found ${recurrentsSnapshot.size} recurrent payments to process`);

    // Process in batches of 500 (Firestore limit)
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of recurrentsSnapshot.docs) {
      const data = doc.data();
      stats.processedRecurrents++;

      // Skip if already has categoryId
      if (data.categoryId) {
        logStatus(`Recurrent ${doc.id} already has categoryId, skipping`);
        continue;
      }

      // Get the legacy category string
      const legacyCategory = (data.category || 'other').toLowerCase();
      const categoryId = categoryMap.get(legacyCategory) || categoryMap.get('other');

      if (!categoryId) {
        logError(`No categoryId found for legacy category: ${legacyCategory}`, null);
        continue;
      }

      // Update the document
      batch.update(doc.ref, { categoryId });
      stats.updatedRecurrents++;
      batchCount++;

      // Commit batch every 500 documents
      if (batchCount >= 500) {
        await batch.commit();
        logStatus(`Committed batch of ${batchCount} recurrent updates`);
        batch = db.batch(); // Create new batch
        batchCount = 0;
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      logStatus(`Committed final batch of ${batchCount} recurrent updates`);
    }

  } catch (error) {
    logError(`Failed to migrate recurrents for user ${userId}`, error);
  }
}

// Main migration function
async function runMigration() {
  logStatus('=== Starting Category ID Migration ===');

  // Manually add user IDs here
  const userIds = [
    "ccmFgIVugBYdPlgabAIwiHZztTA2"
  ];

  for (const userId of userIds) {
    logStatus(`\n=== Processing user: ${userId} ===`);

    // Get or create categories for this user
    const categoryMap = await getOrCreateCategoriesForUser(userId);

    if (categoryMap.size === 0) {
      logError(`No categories available for user ${userId}, skipping`, null);
      continue;
    }

    // Migrate payments
    await migratePaymentsForUser(userId, categoryMap);

    // Migrate recurrent payments
    await migrateRecurrentsForUser(userId, categoryMap);
  }

  // Print final migration stats
  logStatus('\n=== MIGRATION SUMMARY ===');
  logStatus(`Users processed: ${userIds.length}`);
  logStatus(`Categories created: ${stats.categoriesCreated}`);
  logStatus(`Payments processed: ${stats.processedPayments}/${stats.totalPayments}`);
  logStatus(`Payments updated: ${stats.updatedPayments}`);
  logStatus(`Recurrents processed: ${stats.processedRecurrents}/${stats.totalRecurrents}`);
  logStatus(`Recurrents updated: ${stats.updatedRecurrents}`);
  logStatus(`Errors encountered: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    logStatus('\n=== ERROR DETAILS ===');
    stats.errors.forEach((err, i) => {
      logStatus(`Error ${i+1}: ${err.message} (${err.timestamp})`);
    });
  }

  logStatus('\nMigration process completed');
}

// Execute the migration
runMigration().catch(error => {
  logError('Migration failed with critical error', error);
  process.exit(1);
});
