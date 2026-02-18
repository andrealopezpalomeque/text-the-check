import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import admin from 'firebase-admin';
import GeminiHandler from '../handlers/GeminiHandler.js';

// ============================================
// Configuration
// ============================================
const app = express();
const PORT = process.env.PORT || 4000;
const VERIFY_TOKEN = process.env.WP_VERIFY_TOKEN || 'myself_testing';
const WP_PHONE_NUMBER_ID = process.env.IDENTIFIER_WP_NUMBER;
const WP_ACCESS_TOKEN = process.env.ACCESS_TOKEN_WP_BUSINESS;

// ============================================
// Firebase Admin Initialization
// ============================================
// Initialize with service account if available, otherwise use default
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
  console.log('[INIT] Firebase initialized');
}

const db = admin.firestore();
console.log('[INIT] Firestore connection established');

// ============================================
// Collections
// ============================================
const COLLECTIONS = {
  WHATSAPP_LINKS: 'p_t_whatsapp_link', // Single collection for both pending codes and linked accounts
  PAYMENTS: 'p_t_payment',
  CATEGORIES: 'p_t_expense_category'
};

// ============================================
// Fallback categories (used when no payment history)
// ============================================
const FALLBACK_CATEGORIES = ['supermercado', 'salidas', 'transporte', 'servicios', 'suscripciones'];

// ============================================
// Get user's most common categories from last 10 payments
// ============================================
async function getUserCommonCategories(userId) {
  try {
    // Get last 10 payments
    const paymentsSnapshot = await db
      .collection(COLLECTIONS.PAYMENTS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (paymentsSnapshot.empty) {
      return FALLBACK_CATEGORIES;
    }

    // Get category IDs from payments
    const categoryIds = paymentsSnapshot.docs
      .map(doc => doc.data().categoryId)
      .filter(id => id);

    if (categoryIds.length === 0) {
      return FALLBACK_CATEGORIES;
    }

    // Get unique category IDs preserving order of first appearance
    const uniqueCategoryIds = [...new Set(categoryIds)];

    // Fetch category names
    const categoriesSnapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('userId', '==', userId)
      .get();

    const categoryMap = {};
    categoriesSnapshot.docs.forEach(doc => {
      categoryMap[doc.id] = doc.data().name;
    });

    // Map IDs to names, filter out missing, take first 5
    const categoryNames = uniqueCategoryIds
      .map(id => categoryMap[id])
      .filter(name => name && name.toLowerCase() !== 'otros')
      .slice(0, 5)
      .map(name => name.toLowerCase());

    return categoryNames.length > 0 ? categoryNames : FALLBACK_CATEGORIES;
  } catch (error) {
    logError('Error getting common categories:', error);
    return FALLBACK_CATEGORIES;
  }
}

// ============================================
// Error Logging Helper
// ============================================
function logError(message, error) {
  const detail = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error).slice(0, 200) : String(error ?? ''));
  console.error(`[ERROR] ${message} ${detail}`);
  if (error instanceof Error) {
    Sentry.captureException(error);
  } else {
    Sentry.captureMessage(message, { level: 'error', extra: { detail: error } });
  }
}

// ============================================
// Middleware
// ============================================
app.use(express.json());

// ============================================
// Routes
// ============================================

// GET - Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[VERIFY] mode=${mode} token=${token ? '***' : 'none'} challenge=${challenge ? 'present' : 'none'}`);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[VERIFY] Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.log('[VERIFY] Webhook verification failed');
  return res.sendStatus(403);
});

// POST - Receive incoming messages
app.post('/webhook', async (req, res) => {
  const msgType = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.type || 'unknown';
  const msgFrom = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || 'unknown';
  console.log(`[WEBHOOK] Incoming ${msgType} from ${msgFrom}`);

  // Always respond 200 quickly to acknowledge receipt
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) {
      return;
    }

    const message = value.messages[0];
    const from = message.from; // Phone number
    const contactName = value.contacts?.[0]?.profile?.name || 'Usuario';

    // Route by message type
    if (message.type === 'text') {
      const messageText = message.text?.body || '';
      console.log(`[MSG] Text from ${from}: ${messageText.slice(0, 80)}`);
      await processMessage(from, messageText, contactName);
    } else if (message.type === 'audio') {
      console.log(`[MSG] Audio from ${from}`);
      await processAudioMessage(from, message.audio.id, contactName);
    } else if (message.type === 'image') {
      console.log(`[MSG] Image from ${from}`);
      await processImageMessage(from, message.image.id, message.image?.caption, contactName);
    } else if (message.type === 'document') {
      const mimeType = message.document?.mime_type || '';
      if (mimeType === 'application/pdf') {
        console.log(`[MSG] PDF from ${from}`);
        await processPDFMessage(from, message.document.id, message.document?.caption, contactName);
      } else {
        console.log(`[MSG] Unsupported document from ${from}: ${mimeType}`);
        await sendWhatsAppMessage(from, 'Solo se aceptan documentos PDF.');
      }
    } else {
      console.log(`[MSG] Unsupported type from ${from}: ${message.type}`);
    }
  } catch (error) {
    logError('Error processing webhook:', error);
  }
});

// ============================================
// Message Processing
// ============================================

async function processMessage(phoneNumber, text, contactName) {
  const normalizedText = text.trim().toLowerCase();

  // Check for VINCULAR command
  if (normalizedText.startsWith('vincular ')) {
    const code = text.trim().split(' ')[1]?.toUpperCase();
    await handleLinkCommand(phoneNumber, code, contactName);
    return;
  }

  // Check for DESVINCULAR command
  if (normalizedText === 'desvincular') {
    await handleUnlinkCommand(phoneNumber);
    return;
  }

  // Check for AYUDA command
  if (normalizedText === 'ayuda' || normalizedText === 'help') {
    await sendHelpMessage(phoneNumber);
    return;
  }

  // Check for CATEGORIAS command
  if (normalizedText === 'categorias') {
    await handleCategoriesCommand(phoneNumber);
    return;
  }

  // Check for RESUMEN command
  if (normalizedText === 'resumen') {
    await handleResumenCommand(phoneNumber);
    return;
  }

  // Check for FIJOS command
  if (normalizedText === 'fijos') {
    await handleFijosCommand(phoneNumber);
    return;
  }

  // Check for ANALISIS command
  if (normalizedText === 'analisis') {
    await handleAnalisisCommand(phoneNumber);
    return;
  }

  // Try to parse as expense
  await handleExpenseMessage(phoneNumber, text);
}

// ============================================
// Command Handlers
// ============================================

async function handleLinkCommand(phoneNumber, code, contactName) {
  if (!code) {
    await sendWhatsAppMessage(
      phoneNumber,
      'Formato incorrecto. Usa: VINCULAR <codigo>\n\nEjemplo: VINCULAR ABC123'
    );
    return;
  }

  try {
    // Look for the code in whatsapp_links (pending codes use code as doc ID)
    const codeDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(code).get();

    if (!codeDoc.exists) {
      await sendWhatsAppMessage(
        phoneNumber,
        'Codigo no encontrado o expirado. Genera un nuevo codigo desde la app.'
      );
      return;
    }

    const codeData = codeDoc.data();

    // Check if this is a pending code (not an already linked account)
    if (codeData.status !== 'pending') {
      await sendWhatsAppMessage(
        phoneNumber,
        'Codigo no valido. Genera un nuevo codigo desde la app.'
      );
      return;
    }

    // Check if expired (10 minutes)
    const createdAt = codeData.createdAt?.toDate() || new Date(0);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 10) {
      await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(code).delete();
      await sendWhatsAppMessage(
        phoneNumber,
        'El codigo ha expirado. Genera un nuevo codigo desde la app.'
      );
      return;
    }

    // Delete the pending code document
    await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(code).delete();

    // Create the linked account document (phone number as doc ID)
    await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).set({
      status: 'linked',
      userId: codeData.userId,
      phoneNumber: phoneNumber,
      contactName: contactName,
      linkedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await sendWhatsAppMessage(
      phoneNumber,
      `Cuenta vinculada!

Ahora podes registrar gastos:

\`$500 Super #supermercado\`
\`$1500 Cena #salidas\`

Escribi AYUDA para mas info.`
    );
  } catch (error) {
    logError('Error linking account:', error);
    await sendWhatsAppMessage(
      phoneNumber,
      'Error al vincular la cuenta. Intenta nuevamente.'
    );
  }
}

async function handleUnlinkCommand(phoneNumber) {
  try {
    const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();

    if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
      await sendWhatsAppMessage(
        phoneNumber,
        'Este numero no esta vinculado a ninguna cuenta.'
      );
      return;
    }

    await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).delete();

    await sendWhatsAppMessage(
      phoneNumber,
      'Cuenta desvinculada exitosamente. Ya no se registraran gastos desde este numero.'
    );
  } catch (error) {
    logError('Error unlinking account:', error);
    await sendWhatsAppMessage(
      phoneNumber,
      'Error al desvincular la cuenta. Intenta nuevamente.'
    );
  }
}

async function sendHelpMessage(phoneNumber) {
  // Get user's common categories if linked
  let commonCats = FALLBACK_CATEGORIES;
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();
  if (linkDoc.exists && linkDoc.data()?.status === 'linked') {
    const userId = linkDoc.data().userId;
    commonCats = await getUserCommonCategories(userId);
  }

  const catsFormatted = commonCats.map(c => `#${c}`).join('\n');

  const helpText = `*PayTrackr - Ayuda*

*Formato:*
\`\`\`
$<monto> <titulo> #<cat>
\`\`\`

*Ejemplos:*
\`$500 Super #supermercado\`
\`$1500 Cena #salidas d:Cumple\`
\`$2000 Uber\` (sin cat = Otros)

*Tus categorias frecuentes:*
${catsFormatted}

Podes escribir parte del nombre:
#super -> Supermercado
#sal -> Salidas

*Tambien podes enviar:*
- Audio describiendo un gasto
- Foto de comprobante de transferencia
- PDF de comprobante de transferencia

*Comandos:*
RESUMEN - Tu mes actual
FIJOS - Gastos fijos
ANALISIS - Feedback con IA
CATEGORIAS - Ver todas
AYUDA - Ver este mensaje`;

  await sendWhatsAppMessage(phoneNumber, helpText);
}

async function handleCategoriesCommand(phoneNumber) {
  // Check if phone is linked
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();

  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(
      phoneNumber,
      'Este numero no esta vinculado a ninguna cuenta de PayTrackr.'
    );
    return;
  }

  const linkData = linkDoc.data();
  const userId = linkData.userId;

  try {
    const categoriesSnapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('userId', '==', userId)
      .get();

    if (categoriesSnapshot.empty) {
      await sendWhatsAppMessage(phoneNumber, 'No tenes categorias configuradas en tu cuenta.');
      return;
    }

    const categoryNames = categoriesSnapshot.docs
      .map(doc => doc.data().name)
      .filter(name => name)
      .sort();

    const categoriesFormatted = categoryNames.map(name => `#${name.toLowerCase()}`).join('\n');

    await sendWhatsAppMessage(
      phoneNumber,
      `*Tus categorias:*

${categoriesFormatted}

*Tip:* Podes escribir solo parte del nombre y se detecta automaticamente.

Ejemplos:
#super -> Supermercado
#sal -> Salidas
#trans -> Transporte`
    );
  } catch (error) {
    logError('Error fetching categories:', error);
    await sendWhatsAppMessage(phoneNumber, 'Error al obtener las categorias.');
  }
}

// ============================================
// RESUMEN Command - Monthly Overview
// ============================================
async function handleResumenCommand(phoneNumber) {
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();

  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(phoneNumber, 'Este numero no esta vinculado a ninguna cuenta de PayTrackr.');
    return;
  }

  const userId = linkDoc.data().userId;

  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get current month payments
    const currentPaymentsSnapshot = await db
      .collection(COLLECTIONS.PAYMENTS)
      .where('userId', '==', userId)
      .where('createdAt', '>=', currentMonthStart)
      .where('createdAt', '<=', currentMonthEnd)
      .get();

    // Get previous month payments
    const prevPaymentsSnapshot = await db
      .collection(COLLECTIONS.PAYMENTS)
      .where('userId', '==', userId)
      .where('createdAt', '>=', prevMonthStart)
      .where('createdAt', '<=', prevMonthEnd)
      .get();

    // Calculate current month total and by category
    const currentPayments = currentPaymentsSnapshot.docs.map(doc => doc.data());
    const currentTotal = currentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const currentCount = currentPayments.length;

    // Calculate previous month total
    const prevPayments = prevPaymentsSnapshot.docs.map(doc => doc.data());
    const prevTotal = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get categories for names
    const categoriesSnapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('userId', '==', userId)
      .get();

    const categoryMap = {};
    categoriesSnapshot.docs.forEach(doc => {
      categoryMap[doc.id] = doc.data().name;
    });

    // Calculate by category
    const byCategory = {};
    currentPayments.forEach(p => {
      const catName = categoryMap[p.categoryId] || 'Otros';
      byCategory[catName] = (byCategory[catName] || 0) + (p.amount || 0);
    });

    // Sort categories by amount and get top 3
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Count pending recurrent payments
    const pendingRecurrentSnapshot = await db
      .collection(COLLECTIONS.PAYMENTS)
      .where('userId', '==', userId)
      .where('paymentType', '==', 'recurrent')
      .where('isPaid', '==', false)
      .get();

    const pendingRecurrentCount = pendingRecurrentSnapshot.size;

    // Format amounts
    const formatAmount = (amount) => new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);

    // Calculate comparison
    let comparison = '';
    if (prevTotal > 0) {
      const diff = currentTotal - prevTotal;
      const pct = Math.round((diff / prevTotal) * 100);
      const sign = diff >= 0 ? '+' : '';
      comparison = `vs mes anterior: ${sign}${pct}% (${sign}${formatAmount(diff)})`;
    }

    // Format month name
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[now.getMonth()];

    // Build top categories text
    let topCatsText = '';
    if (topCategories.length > 0) {
      topCatsText = '\n\n*Top categorias:*\n' + topCategories
        .map(([name, amount]) => `#${name.toLowerCase()} ${formatAmount(amount)}`)
        .join('\n');
    }

    // Build pending text
    let pendingText = '';
    if (pendingRecurrentCount > 0) {
      pendingText = `\n\nFijos pendientes: ${pendingRecurrentCount}`;
    }

    const message = `*${monthName} ${now.getFullYear()}*

Gastaste: ${formatAmount(currentTotal)}
${currentCount} pagos registrados
${comparison}${topCatsText}${pendingText}`;

    await sendWhatsAppMessage(phoneNumber, message);
  } catch (error) {
    logError('Error in RESUMEN command:', error);
    await sendWhatsAppMessage(phoneNumber, 'Error al obtener el resumen. Intenta nuevamente.');
  }
}

// ============================================
// FIJOS Command - Recurring Payments
// ============================================
async function handleFijosCommand(phoneNumber) {
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();

  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(phoneNumber, 'Este numero no esta vinculado a ninguna cuenta de PayTrackr.');
    return;
  }

  const userId = linkDoc.data().userId;

  try {
    // Get all recurrent templates
    const recurrentSnapshot = await db
      .collection('p_t_recurrent')
      .where('userId', '==', userId)
      .get();

    if (recurrentSnapshot.empty) {
      await sendWhatsAppMessage(phoneNumber, 'No tenes gastos fijos configurados.\n\nPodes agregarlos desde la app en la seccion "Fijos".');
      return;
    }

    const recurrents = recurrentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get current month's recurrent payment instances to check which are pending
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const instancesSnapshot = await db
      .collection(COLLECTIONS.PAYMENTS)
      .where('userId', '==', userId)
      .where('paymentType', '==', 'recurrent')
      .where('createdAt', '>=', currentMonthStart)
      .where('createdAt', '<=', currentMonthEnd)
      .get();

    // Map instances by recurrentId
    const instancesByRecurrent = {};
    instancesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.recurrentId) {
        instancesByRecurrent[data.recurrentId] = data;
      }
    });

    // Build list with pending status
    const formatAmount = (amount) => new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);

    // Separate pending and paid
    const pending = [];
    const paid = [];

    recurrents.forEach(r => {
      const instance = instancesByRecurrent[r.id];
      const isPaid = instance?.isPaid ?? false;
      const dueDateDay = parseInt(r.dueDateDay) || 1;

      // Calculate due date for this month
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDateDay);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      const item = {
        title: r.title,
        amount: r.amount,
        daysUntilDue,
        dueDateDay
      };

      if (isPaid) {
        paid.push(item);
      } else {
        pending.push(item);
      }
    });

    // Sort pending by due date (most urgent first)
    pending.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Calculate total
    const totalMonthly = recurrents.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Format due date text
    const formatDue = (days) => {
      if (days < 0) return `vencido hace ${Math.abs(days)} dias`;
      if (days === 0) return 'vence hoy';
      if (days === 1) return 'vence manana';
      return `vence en ${days} dias`;
    };

    // Build message
    let message = `*Gastos fijos: ${formatAmount(totalMonthly)}/mes*\n`;

    if (pending.length > 0) {
      message += `\n*Pendientes (${pending.length}):*\n`;
      pending.forEach(p => {
        message += `${p.title} ${formatAmount(p.amount)}\n  _${formatDue(p.daysUntilDue)}_\n`;
      });
    }

    if (paid.length > 0) {
      message += `\n*Pagados (${paid.length}):*\n`;
      paid.forEach(p => {
        message += `${p.title} ${formatAmount(p.amount)}\n`;
      });
    }

    await sendWhatsAppMessage(phoneNumber, message.trim());
  } catch (error) {
    logError('Error in FIJOS command:', error);
    await sendWhatsAppMessage(phoneNumber, 'Error al obtener los gastos fijos. Intenta nuevamente.');
  }
}

// ============================================
// ANALISIS Command - AI Financial Health Analysis
// ============================================
const geminiHandler = process.env.GEMINI_API_KEY
  ? new GeminiHandler(process.env.GEMINI_API_KEY)
  : null;

async function handleAnalisisCommand(phoneNumber) {
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();

  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(phoneNumber, 'Este numero no esta vinculado a ninguna cuenta de PayTrackr.');
    return;
  }

  const userId = linkDoc.data().userId;

  // Check if AI is configured
  if (!geminiHandler) {
    await sendWhatsAppMessage(phoneNumber, 'El analisis con IA no esta disponible en este momento.');
    return;
  }

  try {
    await sendWhatsAppMessage(phoneNumber, 'Analizando tus finanzas... esto puede tomar unos segundos.');

    // Get last 3 months of data
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // Get payments
    const paymentsSnapshot = await db
      .collection(COLLECTIONS.PAYMENTS)
      .where('userId', '==', userId)
      .where('createdAt', '>=', threeMonthsAgo)
      .orderBy('createdAt', 'desc')
      .get();

    // Get recurrent templates
    const recurrentSnapshot = await db
      .collection('p_t_recurrent')
      .where('userId', '==', userId)
      .get();

    // Get categories
    const categoriesSnapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('userId', '==', userId)
      .get();

    const categoryMap = {};
    categoriesSnapshot.docs.forEach(doc => {
      categoryMap[doc.id] = doc.data().name;
    });

    // Process payments data
    const payments = paymentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        amount: data.amount,
        category: categoryMap[data.categoryId] || 'Otros',
        type: data.paymentType,
        month: data.createdAt?.toDate()?.toISOString().slice(0, 7) || 'unknown'
      };
    });

    // Calculate monthly totals by category
    const monthlyData = {};
    payments.forEach(p => {
      if (!monthlyData[p.month]) {
        monthlyData[p.month] = { total: 0, byCategory: {}, count: 0 };
      }
      monthlyData[p.month].total += p.amount;
      monthlyData[p.month].count++;
      monthlyData[p.month].byCategory[p.category] =
        (monthlyData[p.month].byCategory[p.category] || 0) + p.amount;
    });

    // Get recurrent totals
    const recurrents = recurrentSnapshot.docs.map(doc => ({
      title: doc.data().title,
      amount: doc.data().amount,
      category: categoryMap[doc.data().categoryId] || 'Otros'
    }));

    const totalRecurrent = recurrents.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Prepare data summary for AI
    const dataSummary = {
      monthlyData,
      totalRecurrent,
      recurrentCount: recurrents.length,
      recurrents: recurrents.slice(0, 10), // Top 10 for context
      totalPayments: payments.length,
      months: Object.keys(monthlyData).sort()
    };

    // Call AI for analysis
    const analysis = await geminiHandler.getFinancialAnalysis(dataSummary);

    await sendWhatsAppMessage(phoneNumber, analysis);
  } catch (error) {
    logError('Error in ANALISIS command:', error);
    await sendWhatsAppMessage(phoneNumber, 'Error al analizar tus finanzas. Intenta nuevamente.');
  }
}

async function handleExpenseMessage(phoneNumber, text) {
  // Check if phone is linked
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).get();

  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(
      phoneNumber,
      'Este numero no esta vinculado a ninguna cuenta de PayTrackr.\n\nPara vincular tu cuenta:\n1. Ingresa a la app\n2. Ve a Configuracion > WhatsApp\n3. Genera un codigo de vinculacion\n4. Envialo aqui: VINCULAR <codigo>'
    );
    return;
  }

  const linkData = linkDoc.data();
  const userId = linkData.userId;

  // Parse the expense message
  const parsed = parseExpenseMessage(text);

  if (!parsed) {
    // Get user's common categories for suggestion
    const commonCats = await getUserCommonCategories(userId);
    const catsFormatted = commonCats.slice(0, 3).map(c => `#${c}`).join(' ');

    await sendWhatsAppMessage(
      phoneNumber,
      `No pude entender el mensaje.

*Formato:*
\`$<monto> <titulo> #<cat>\`

*Ejemplos:*
\`$500 Super #supermercado\`
\`$1500 Cena #salidas\`

*Categorias sugeridas:*
${catsFormatted}

Escribi AYUDA para mas info.`
    );
    return;
  }

  try {
    // Find category ID for this user (case-insensitive, partial match fallback)
    const categoryResult = await findCategoryId(userId, parsed.category);

    // Create the payment
    const paymentData = {
      title: parsed.title,
      description: parsed.description,
      amount: parsed.amount,
      categoryId: categoryResult.id,
      isPaid: true,
      paidDate: admin.firestore.FieldValue.serverTimestamp(),
      paymentType: 'one-time',
      userId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      dueDate: admin.firestore.FieldValue.serverTimestamp(),
      recurrentId: null,
      isWhatsapp: true,
      status: 'pending',
      source: 'whatsapp-text',
      needsRevision: false,
      recipient: null,
      audioTranscription: null
    };

    await db.collection(COLLECTIONS.PAYMENTS).add(paymentData);

    // Format amount for display
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(parsed.amount);

    let successMessage = `Gasto registrado!

*${parsed.title}*
${formattedAmount}
#${categoryResult.name.toLowerCase()}`;

    if (parsed.description) {
      successMessage += `\n_${parsed.description}_`;
    }

    await sendWhatsAppMessage(phoneNumber, successMessage);
  } catch (error) {
    logError('Error creating payment:', error);
    await sendWhatsAppMessage(
      phoneNumber,
      'Error al registrar el gasto. Intenta nuevamente.'
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function parseExpenseMessage(text) {
  // Format: $<amount> <title> #<category> d:<description>
  // Category and description are optional, order is flexible
  // Examples:
  // - "$500 Super #supermercado d:Compras del finde"
  // - "$1500 Cena #salidas"
  // - "$2000 Uber d:Viaje al centro #transporte"
  // - "$300 Cafe"

  const cleanText = text.trim();

  // Extract amount and the rest
  const amountRegex = /^\$?\s*([\d.,]+)\s+(.+)$/i;
  const match = cleanText.match(amountRegex);

  if (!match) {
    return null;
  }

  let amountStr = match[1];
  let rest = match[2].trim();

  // Normalize amount: remove thousand separators (.) and convert decimal (,) to (.)
  // Argentine format: 1.234,56 -> 1234.56
  amountStr = amountStr.replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  // Extract category (hashtag)
  let category = null;
  const categoryMatch = rest.match(/#(\S+)/);
  if (categoryMatch) {
    category = categoryMatch[1].toLowerCase();
    rest = rest.replace(/#\S+/, '').trim();
  }

  // Extract description (d:)
  let description = '';
  const descMatch = rest.match(/d:(.+?)(?=#|$)/i);
  if (descMatch) {
    description = descMatch[1].trim();
    rest = rest.replace(/d:.+?(?=#|$)/i, '').trim();
  }

  // What remains is the title
  const title = capitalizeFirst(rest.trim());

  if (!title) {
    return null;
  }

  return {
    amount,
    title,
    category,
    description
  };
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Parse YYYY-MM-DD date string into Firestore timestamp, fallback to serverTimestamp
function parseDateOrNow(dateStr) {
  if (!dateStr) return admin.firestore.FieldValue.serverTimestamp();
  const parsed = new Date(dateStr + 'T12:00:00');
  if (isNaN(parsed.getTime())) return admin.firestore.FieldValue.serverTimestamp();
  return admin.firestore.Timestamp.fromDate(parsed);
}

// ============================================
// Media Download Helper
// ============================================
async function downloadWhatsAppMedia(mediaId) {
  if (!WP_ACCESS_TOKEN) {
    console.log('[MEDIA] WhatsApp credentials not configured, cannot download media');
    return null;
  }
  try {
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}`,
      { headers: { 'Authorization': `Bearer ${WP_ACCESS_TOKEN}` } }
    );
    if (!mediaResponse.ok) {
      logError('Error getting media URL:', await mediaResponse.text());
      return null;
    }
    const mediaInfo = await mediaResponse.json();
    const mediaUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type || 'application/octet-stream';

    const downloadResponse = await fetch(mediaUrl, {
      headers: { 'Authorization': `Bearer ${WP_ACCESS_TOKEN}` }
    });
    if (!downloadResponse.ok) {
      logError('Error downloading media', null);
      return null;
    }
    const buffer = await downloadResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { base64, mimeType };
  } catch (error) {
    logError('Error downloading WhatsApp media:', error);
    return null;
  }
}

// ============================================
// Recipient History Matching
// ============================================
async function findRecipientHistory(userId, recipientData) {
  try {
    let query = null;

    // Try matching by recipient name first
    if (recipientData.recipientName) {
      query = db
        .collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId)
        .where('recipient.name', '==', recipientData.recipientName)
        .orderBy('createdAt', 'desc')
        .limit(5);
    } else if (recipientData.recipientCBU) {
      query = db
        .collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId)
        .where('recipient.cbu', '==', recipientData.recipientCBU)
        .orderBy('createdAt', 'desc')
        .limit(5);
    }

    if (!query) return null;

    const snapshot = await query.get();
    if (snapshot.empty) return null;

    const pastPayments = snapshot.docs.map(doc => doc.data());

    // Find most common title
    const titleCounts = {};
    const categoryCounts = {};
    pastPayments.forEach(p => {
      if (p.title) titleCounts[p.title] = (titleCounts[p.title] || 0) + 1;
      if (p.categoryId) categoryCounts[p.categoryId] = (categoryCounts[p.categoryId] || 0) + 1;
    });

    const suggestedTitle = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const suggestedCategoryId = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { pastPayments, suggestedTitle, suggestedCategoryId };
  } catch (error) {
    logError('Error finding recipient history:', error);
    return null;
  }
}

// ============================================
// Shared Transfer Processing
// ============================================
async function processTransferData(phoneNumber, userId, transferData, caption, source) {
  const formatAmount = (amount) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);

  const amount = parseFloat(transferData.amount) || 0;
  if (amount <= 0) {
    await sendWhatsAppMessage(phoneNumber, 'No pude determinar el monto del comprobante.');
    return;
  }

  // Build recipient object
  const recipient = {
    name: transferData.recipientName || null,
    cbu: transferData.recipientCBU || null,
    alias: transferData.recipientAlias || null,
    bank: transferData.recipientBank || null
  };

  // Check recipient history for auto-fill
  const history = await findRecipientHistory(userId, transferData);

  let title;
  let categoryId;
  let needsRevision;

  if (history?.suggestedTitle) {
    title = history.suggestedTitle;
    categoryId = history.suggestedCategoryId;
    needsRevision = false;
  } else {
    const recipientLabel = transferData.recipientName || transferData.recipientAlias || 'desconocido';
    title = `Transferencia a ${recipientLabel}`;
    const otrosCategory = await findOtrosCategory(userId);
    categoryId = otrosCategory.id;
    needsRevision = true;
  }

  // If caption provided, parse it to override title/category
  if (caption) {
    const parsed = parseExpenseMessage(`$${amount} ${caption}`);
    if (parsed) {
      title = parsed.title || title;
      if (parsed.category) {
        const categoryResult = await findCategoryId(userId, parsed.category);
        categoryId = categoryResult.id;
        needsRevision = false;
      }
    }
  }

  // Use date from receipt if available
  const paymentDate = parseDateOrNow(transferData.date);

  // Save payment
  const paymentData = {
    title,
    description: transferData.concept || '',
    amount,
    categoryId: categoryId || '',
    isPaid: true,
    paidDate: paymentDate,
    paymentType: 'one-time',
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    dueDate: paymentDate,
    recurrentId: null,
    isWhatsapp: true,
    status: 'pending',
    source,
    needsRevision,
    recipient,
    audioTranscription: null
  };

  await db.collection(COLLECTIONS.PAYMENTS).add(paymentData);

  // Get category name for display
  let categoryName = 'Otros';
  if (categoryId) {
    const catDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).get();
    if (catDoc.exists) categoryName = catDoc.data().name;
  }

  let successMessage = `Transferencia registrada!

*${title}*
${formatAmount(amount)}
#${categoryName.toLowerCase()}`;

  if (transferData.recipientName) {
    successMessage += `\n_Destinatario: ${transferData.recipientName}_`;
  }

  if (needsRevision) {
    successMessage += '\n\n_Revisa el titulo y categoria desde la app._';
  }

  await sendWhatsAppMessage(phoneNumber, successMessage);
}

// ============================================
// Audio Message Handler
// ============================================
async function processAudioMessage(from, audioId, contactName) {
  // Check linked account
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(from).get();
  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(
      from,
      'Este numero no esta vinculado a ninguna cuenta de PayTrackr.\n\nPara vincular tu cuenta:\n1. Ingresa a la app\n2. Ve a Configuracion > WhatsApp\n3. Genera un codigo de vinculacion\n4. Envialo aqui: VINCULAR <codigo>'
    );
    return;
  }

  if (!geminiHandler) {
    await sendWhatsAppMessage(from, 'Esta funcion no esta disponible en este momento.');
    return;
  }

  const userId = linkDoc.data().userId;

  // Download audio
  const media = await downloadWhatsAppMedia(audioId);
  if (!media) {
    await sendWhatsAppMessage(from, 'Error al descargar. Intenta nuevamente.');
    return;
  }

  // Fetch user's category names
  const categoriesSnapshot = await db
    .collection(COLLECTIONS.CATEGORIES)
    .where('userId', '==', userId)
    .get();
  const categoryNames = categoriesSnapshot.docs
    .map(doc => doc.data().name)
    .filter(name => name);

  // Transcribe audio with Gemini
  await sendWhatsAppMessage(from, 'Procesando audio...');
  const transcription = await geminiHandler.transcribeAudio(media.base64, media.mimeType, categoryNames);
  if (!transcription) {
    await sendWhatsAppMessage(from, 'No pude procesar. Intenta de nuevo o registra manualmente.');
    return;
  }

  const amount = parseFloat(transcription.totalAmount) || 0;
  if (amount <= 0) {
    // Show transcription even if we can't determine the expense
    let msg = 'No pude determinar el gasto.';
    if (transcription.transcription) {
      msg = `_"${transcription.transcription}"_\n\n${msg}`;
    }
    await sendWhatsAppMessage(from, msg);
    return;
  }

  // Match category
  const categoryResult = await findCategoryId(userId, transcription.category);

  // Use date from audio if mentioned
  const paymentDate = parseDateOrNow(transcription.date);

  // Save payment
  const paymentData = {
    title: transcription.title || 'Gasto por audio',
    description: transcription.description || '',
    amount,
    categoryId: categoryResult.id,
    isPaid: true,
    paidDate: paymentDate,
    paymentType: 'one-time',
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    dueDate: paymentDate,
    recurrentId: null,
    isWhatsapp: true,
    status: 'pending',
    source: 'whatsapp-audio',
    needsRevision: false,
    recipient: null,
    audioTranscription: transcription.transcription || null
  };

  await db.collection(COLLECTIONS.PAYMENTS).add(paymentData);

  const formattedAmount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);

  let successMessage = `Gasto registrado por audio!

*${paymentData.title}*
${formattedAmount}
#${categoryResult.name.toLowerCase()}`;

  if (transcription.transcription) {
    successMessage += `\n_"${transcription.transcription}"_`;
  }

  await sendWhatsAppMessage(from, successMessage);
}

// ============================================
// Image Message Handler (Transfer Receipt)
// ============================================
async function processImageMessage(from, imageId, caption, contactName) {
  // Check linked account
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(from).get();
  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(
      from,
      'Este numero no esta vinculado a ninguna cuenta de PayTrackr.\n\nPara vincular tu cuenta:\n1. Ingresa a la app\n2. Ve a Configuracion > WhatsApp\n3. Genera un codigo de vinculacion\n4. Envialo aqui: VINCULAR <codigo>'
    );
    return;
  }

  if (!geminiHandler) {
    await sendWhatsAppMessage(from, 'Esta funcion no esta disponible en este momento.');
    return;
  }

  const userId = linkDoc.data().userId;

  // Download image
  const media = await downloadWhatsAppMedia(imageId);
  if (!media) {
    await sendWhatsAppMessage(from, 'Error al descargar. Intenta nuevamente.');
    return;
  }

  // Parse transfer image with Gemini
  await sendWhatsAppMessage(from, 'Procesando imagen...');
  const transferData = await geminiHandler.parseTransferImage(media.base64, media.mimeType);
  if (!transferData) {
    await sendWhatsAppMessage(from, 'No pude procesar. Intenta de nuevo o registra manualmente.');
    return;
  }

  await processTransferData(from, userId, transferData, caption, 'whatsapp-image');
}

// ============================================
// PDF Message Handler (Transfer Receipt)
// ============================================
async function processPDFMessage(from, docId, caption, contactName) {
  // Check linked account
  const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(from).get();
  if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
    await sendWhatsAppMessage(
      from,
      'Este numero no esta vinculado a ninguna cuenta de PayTrackr.\n\nPara vincular tu cuenta:\n1. Ingresa a la app\n2. Ve a Configuracion > WhatsApp\n3. Genera un codigo de vinculacion\n4. Envialo aqui: VINCULAR <codigo>'
    );
    return;
  }

  if (!geminiHandler) {
    await sendWhatsAppMessage(from, 'Esta funcion no esta disponible en este momento.');
    return;
  }

  const userId = linkDoc.data().userId;

  // Download PDF
  const media = await downloadWhatsAppMedia(docId);
  if (!media) {
    await sendWhatsAppMessage(from, 'Error al descargar. Intenta nuevamente.');
    return;
  }

  // Parse transfer PDF with Gemini
  await sendWhatsAppMessage(from, 'Procesando PDF...');
  const transferData = await geminiHandler.parseTransferPDF(media.base64, media.mimeType);
  if (!transferData) {
    await sendWhatsAppMessage(from, 'No pude procesar. Intenta de nuevo o registra manualmente.');
    return;
  }

  await processTransferData(from, userId, transferData, caption, 'whatsapp-pdf');
}

async function findCategoryId(userId, categoryInput) {
  // If no category provided, return "Otros"
  if (!categoryInput) {
    return await findOtrosCategory(userId);
  }

  const normalizedInput = categoryInput.toLowerCase();

  // Fetch all categories for this user
  const categoriesSnapshot = await db
    .collection(COLLECTIONS.CATEGORIES)
    .where('userId', '==', userId)
    .get();

  if (categoriesSnapshot.empty) {
    return { id: '', name: 'Otros' };
  }

  const categories = categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || ''
  }));

  // 1. Try exact match (case-insensitive)
  const exactMatch = categories.find(c => c.name.toLowerCase() === normalizedInput);
  if (exactMatch) {
    return exactMatch;
  }

  // 2. Try partial match (category name starts with input)
  const partialMatch = categories.find(c => c.name.toLowerCase().startsWith(normalizedInput));
  if (partialMatch) {
    return partialMatch;
  }

  // 3. Try partial match (input is contained in category name)
  const containsMatch = categories.find(c => c.name.toLowerCase().includes(normalizedInput));
  if (containsMatch) {
    return containsMatch;
  }

  // 4. Fallback to "Otros"
  return await findOtrosCategory(userId);
}

async function findOtrosCategory(userId) {
  const otrosSnapshot = await db
    .collection(COLLECTIONS.CATEGORIES)
    .where('userId', '==', userId)
    .where('name', '==', 'Otros')
    .limit(1)
    .get();

  if (!otrosSnapshot.empty) {
    return { id: otrosSnapshot.docs[0].id, name: 'Otros' };
  }

  return { id: '', name: 'Otros' };
}

// Normalize Argentine phone numbers (remove the 9 after country code)
function normalizePhoneNumber(phone) {
  // Argentine mobile numbers come as 5493513467739 but API expects 543513467739
  if (phone.startsWith('549') && phone.length === 13) {
    return '54' + phone.slice(3);
  }
  return phone;
}

async function sendWhatsAppMessage(to, message) {
  // Normalize the phone number for the API
  const normalizedTo = normalizePhoneNumber(to);

  if (!WP_PHONE_NUMBER_ID || !WP_ACCESS_TOKEN) {
    console.log(`[SEND] Credentials not configured, would send to ${normalizedTo}: ${message.slice(0, 60)}...`);
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      logError('Error sending WhatsApp message:', result);
    } else {
      console.log(`[SEND] Message sent to ${normalizedTo} (id: ${result?.messages?.[0]?.id || 'unknown'})`);
    }
  } catch (error) {
    logError('Error sending WhatsApp message:', error);
  }
}

// ============================================
// Sentry Error Handler (must be after all controllers)
// ============================================
Sentry.setupExpressErrorHandler(app);

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`[INIT] Server running on http://localhost:${PORT}/webhook`);
});
