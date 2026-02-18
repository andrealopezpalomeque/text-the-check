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
  totalTemplates: 0,
  processedTemplates: 0,
  updatedTemplates: 0,
  skippedTemplates: 0,
  errors: []
};

// Legacy category to Spanish name mapping
const CATEGORY_MAPPING = {
  housing: 'Vivienda y Alquiler',
  utilities: 'Servicios',
  food: 'Supermercado',
  dining: 'Salidas',
  transport: 'Transporte',
  entertainment: 'Entretenimiento',
  health: 'Salud',
  fitness: 'Fitness y Deportes',
  personal_care: 'Cuidado Personal',
  pet: 'Mascotas',
  clothes: 'Ropa',
  traveling: 'Viajes',
  education: 'Educación',
  subscriptions: 'Suscripciones',
  gifts: 'Regalos',
  taxes: 'Impuestos y Gobierno',
  other: 'Otros'
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

// Get category map for a user (legacy key -> categoryId)
async function getCategoryMapForUser(userId) {
  logStatus(`Fetching categories for user: ${userId}`);

  const categoryMap = new Map(); // Maps legacy key to categoryId

  try {
    const existingCategories = await db.collection('p_t_expense_category')
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();

    if (existingCategories.empty) {
      logError(`User ${userId} has no categories - run migrate-category-ids.js first`, null);
      return categoryMap;
    }

    logStatus(`User ${userId} has ${existingCategories.size} categories`);

    // Build map from legacy key to category id
    existingCategories.forEach(doc => {
      const data = doc.data();
      // Find the legacy key that matches this category name
      for (const [key, spanishName] of Object.entries(CATEGORY_MAPPING)) {
        if (spanishName === data.name) {
          categoryMap.set(key, doc.id);
          break;
        }
      }
    });

    return categoryMap;
  } catch (error) {
    logError(`Failed to fetch categories for user ${userId}`, error);
    return categoryMap;
  }
}

// Migrate templates for a specific user
async function migrateTemplatesForUser(userId, categoryMap) {
  logStatus(`Migrating templates for user: ${userId}`);

  try {
    // Fetch all templates for this user
    const templatesSnapshot = await db.collection('p_t_payment_template')
      .where('userId', '==', userId)
      .get();

    stats.totalTemplates += templatesSnapshot.size;
    logStatus(`Found ${templatesSnapshot.size} templates to process`);

    // Process in batches of 500 (Firestore limit)
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of templatesSnapshot.docs) {
      const data = doc.data();
      stats.processedTemplates++;

      // Skip if already has categoryId
      if (data.categoryId) {
        logStatus(`Template ${doc.id} (${data.name}) already has categoryId, skipping`);
        stats.skippedTemplates++;
        continue;
      }

      // Get the legacy category string
      const legacyCategory = (data.category || 'other').toLowerCase();
      const categoryId = categoryMap.get(legacyCategory) || categoryMap.get('other');

      if (!categoryId) {
        logError(`No categoryId found for legacy category: ${legacyCategory} in template ${doc.id}`, null);
        continue;
      }

      // Update the document: add categoryId, remove old category field
      batch.update(doc.ref, {
        categoryId,
        category: admin.firestore.FieldValue.delete()
      });
      stats.updatedTemplates++;
      batchCount++;

      logStatus(`Prepared update for template ${doc.id} (${data.name}): ${legacyCategory} -> ${categoryId}`);

      // Commit batch every 500 documents
      if (batchCount >= 500) {
        await batch.commit();
        logStatus(`Committed batch of ${batchCount} template updates`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      logStatus(`Committed final batch of ${batchCount} template updates`);
    }

  } catch (error) {
    logError(`Failed to migrate templates for user ${userId}`, error);
  }
}

// Main migration function
async function runMigration() {
  logStatus('=== Starting Template Category Migration ===');

  // Manually add user IDs here (same as in migrate-category-ids.js)
  const userIds = [
    "ccmFgIVugBYdPlgabAIwiHZztTA2"
  ];

  for (const userId of userIds) {
    logStatus(`\n=== Processing user: ${userId} ===`);

    // Get category map for this user
    const categoryMap = await getCategoryMapForUser(userId);

    if (categoryMap.size === 0) {
      logError(`No categories available for user ${userId}, skipping`, null);
      continue;
    }

    logStatus(`Category map has ${categoryMap.size} entries`);

    // Migrate templates
    await migrateTemplatesForUser(userId, categoryMap);
  }

  // Print final migration stats
  logStatus('\n=== MIGRATION SUMMARY ===');
  logStatus(`Users processed: ${userIds.length}`);
  logStatus(`Templates processed: ${stats.processedTemplates}/${stats.totalTemplates}`);
  logStatus(`Templates updated: ${stats.updatedTemplates}`);
  logStatus(`Templates skipped (already migrated): ${stats.skippedTemplates}`);
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
