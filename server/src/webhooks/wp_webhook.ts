/**
 * wp_webhook.ts — Standalone Express server for the WhatsApp Business API webhook.
 *
 * Single entry point for all WhatsApp messages. Routes to GruposHandler.
 *
 * Security: HMAC SHA256 signature verification, rate limiting, message dedup.
 */

import 'dotenv/config'
import '../instrument.js'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import * as Sentry from '@sentry/node'

import { db, admin } from '../config/firebase.js'
import { normalizeForComparison, generatePhoneCandidates } from '../helpers/phone.js'
import { sendMessage, sendButtons } from '../helpers/whatsapp.js'
import {
  formatOnboardingGruposAskName,
  formatOnboardingGruposCreated,
} from '../helpers/responseFormatter.js'
import GeminiHandler from '../handlers/GeminiHandler.js'
import GruposHandler from '../handlers/GruposHandler.js'

// ─── Express setup ─────────────────────────────────────────────────

const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))

// JSON parser with raw body capture for signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf },
}))

// ─── Handler instantiation ─────────────────────────────────────────

const gemini = new GeminiHandler(process.env.GEMINI_API_KEY || '')
const gruposHandler = new GruposHandler(gemini)

// ─── Message deduplication ─────────────────────────────────────────

const processedMessageIds = new Map<string, number>()

setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [id, ts] of processedMessageIds.entries()) {
    if (ts < oneHourAgo) processedMessageIds.delete(id)
  }
}, 15 * 60 * 1000)

function isDuplicate(messageId: string): boolean {
  if (processedMessageIds.has(messageId)) return true
  processedMessageIds.set(messageId, Date.now())
  return false
}

// ─── Onboarding state machine ─────────────────────────────────

interface OnboardingState {
  phone: string
  contactName: string
  userId: string
  step: 'grupos_name'
  createdAt: number
}

const pendingOnboarding = new Map<string, OnboardingState>()

// Auto-cleanup: 5 min timeout (same pattern as dedup cleanup)
setInterval(() => {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000
  for (const [phone, state] of pendingOnboarding.entries()) {
    if (state.createdAt < fiveMinAgo) pendingOnboarding.delete(phone)
  }
}, 60 * 1000)

// ─── AI Support sessions ──────────────────────────────────────

interface SupportSession {
  timestamp: number
  previousQA: Array<{ question: string; answer: string }>
  lastQueryId: string | null
  warningTimerId: ReturnType<typeof setTimeout> | null
  expiryTimerId: ReturnType<typeof setTimeout> | null
}

const AI_SUPPORT_SESSION_TTL = 15 * 60 * 1000   // 15 min auto-end
const AI_SUPPORT_WARNING_TTL = 12 * 60 * 1000   // 12 min warning (3 min before expiry)
const SUPPORT_RATE_LIMIT = 10
const SUPPORT_RATE_WINDOW = 60 * 60 * 1000      // 1 hour

const activeSupportSessions = new Map<string, SupportSession>()
const supportRateLimits = new Map<string, { count: number; resetAt: number }>()

// FAQ cache (1 hour TTL)
const FAQ_CACHE_TTL = 60 * 60 * 1000
let faqCache: { data: Array<{ topic: string; question: string; answer: string }>; fetchedAt: number } | null = null

async function getFaqData(): Promise<Array<{ topic: string; question: string; answer: string }>> {
  if (faqCache && (Date.now() - faqCache.fetchedAt < FAQ_CACHE_TTL)) {
    return faqCache.data
  }

  try {
    const snapshot = await db.collection('ttc_faq').get()
    const data = snapshot.docs.map(doc => {
      const d = doc.data()
      return { topic: d.topic as string, question: d.question as string, answer: d.answer as string }
    })
    faqCache = { data, fetchedAt: Date.now() }
    return data
  } catch (error) {
    console.error('[SUPPORT] Error fetching FAQ data:', error)
    return faqCache?.data || []
  }
}

function checkSupportRateLimit(phone: string): boolean {
  const now = Date.now()
  const entry = supportRateLimits.get(phone)

  if (!entry || now >= entry.resetAt) {
    supportRateLimits.set(phone, { count: 1, resetAt: now + SUPPORT_RATE_WINDOW })
    return true
  }

  if (entry.count >= SUPPORT_RATE_LIMIT) return false
  entry.count++
  return true
}

function createSupportSession(phone: string): SupportSession {
  clearSupportSession(phone)
  const session: SupportSession = {
    timestamp: Date.now(),
    previousQA: [],
    lastQueryId: null,
    warningTimerId: null,
    expiryTimerId: null,
  }
  activeSupportSessions.set(phone, session)
  resetSessionTimers(phone)
  return session
}

function clearSupportSession(phone: string): void {
  const session = activeSupportSessions.get(phone)
  if (session) {
    if (session.warningTimerId) clearTimeout(session.warningTimerId)
    if (session.expiryTimerId) clearTimeout(session.expiryTimerId)
    activeSupportSessions.delete(phone)
  }
}

function resetSessionTimers(phone: string): void {
  const session = activeSupportSessions.get(phone)
  if (!session) return

  if (session.warningTimerId) clearTimeout(session.warningTimerId)
  if (session.expiryTimerId) clearTimeout(session.expiryTimerId)

  session.warningTimerId = setTimeout(async () => {
    if (activeSupportSessions.get(phone) === session) {
      try {
        await sendMessage(phone, 'El soporte se cerrará en 3 minutos. Escribí tu consulta o "salir" para terminar.')
      } catch (err) {
        console.error('[SUPPORT] Error sending session warning:', err)
      }
    }
  }, AI_SUPPORT_WARNING_TTL)

  session.expiryTimerId = setTimeout(async () => {
    if (activeSupportSessions.get(phone) === session) {
      activeSupportSessions.delete(phone)
      try {
        await sendMessage(phone, 'La sesión de soporte se cerró por inactividad. Escribí /ayuda cuando necesites.')
      } catch (err) {
        console.error('[SUPPORT] Error sending session expiry:', err)
      }
    }
  }, AI_SUPPORT_SESSION_TTL)
}

async function handleAISupport(phone: string, question: string, session: SupportSession): Promise<void> {
  // Rate limit
  if (!checkSupportRateLimit(phone)) {
    clearSupportSession(phone)
    await sendMessage(phone, 'Alcanzaste el límite de consultas por hora (10). Intentá de nuevo más tarde.')
    return
  }

  if (!gemini.isAIEnabled()) {
    await sendMessage(phone, 'El soporte AI no está disponible en este momento.')
    return
  }

  await sendMessage(phone, 'Buscando respuesta...')

  const faqData = await getFaqData()
  if (faqData.length === 0) {
    await sendMessage(phone, 'No pude acceder a la información de soporte. Intentá más tarde.')
    return
  }

  const conversationHistory = session.previousQA.slice(-3)
  const result = await gemini.answerSupportQuestion(question, faqData, conversationHistory)

  // Store query for analytics
  let queryDocId: string | null = null
  try {
    const queryDoc = await db.collection('ttc_support_queries').add({
      phoneNumber: phone,
      question,
      answer: result?.answer || null,
      noAnswer: result?.noAnswer || false,
      error: !result ? 'gemini_error' : null,
      parentQueryId: session.lastQueryId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    queryDocId = queryDoc.id
  } catch (err) {
    console.error('[SUPPORT] Error storing support query:', err)
  }

  // Handle Gemini errors
  if (!result) {
    clearSupportSession(phone)
    await sendMessage(phone, 'El servicio de soporte no está disponible. Intentá más tarde.')
    return
  }

  // Update session
  session.previousQA.push({ question, answer: result.answer || '' })
  session.lastQueryId = queryDocId
  resetSessionTimers(phone)

  // Handle "no answer" case
  if (result.noAnswer) {
    await sendMessage(phone, result.answer)
    await sendButtons(phone, '¿Necesitás algo más?', [
      { id: 'support_otra', title: 'Otra consulta' },
      { id: 'support_listo', title: 'Listo, gracias' },
    ])
    return
  }

  // Successful answer
  await sendMessage(phone, result.answer)
  await sendButtons(phone, '¿Necesitás algo más?', [
    { id: 'support_otra', title: 'Otra consulta' },
    { id: 'support_listo', title: 'Listo, gracias' },
  ])
}

async function startOnboarding(phone: string, contactName: string): Promise<void> {
  try {
    const userId = crypto.randomUUID()
    const canonicalPhone = normalizeForComparison(phone)

    // Create ttc_user doc
    await db.collection('ttc_user').doc(userId).set({
      id: userId,
      name: contactName !== 'Usuario' ? contactName : '',
      phone: canonicalPhone,
      email: null,
      aliases: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    pendingOnboarding.set(phone, {
      phone,
      contactName,
      userId,
      step: 'grupos_name',
      createdAt: Date.now(),
    })

    const greeting = contactName && contactName !== 'Usuario' ? `Hola ${contactName}!` : 'Hola!'
    await sendMessage(phone, `👋 *${greeting}* Bienvenido a *text the check*\n\n👥 Vamos a crear tu primer grupo para dividir gastos.\n\n¿Cómo se llama? (ej: "Viaje a Bariloche", "Depto")`)
    console.log(`[ONBOARDING] New user created: ${userId} (${contactName}, ${phone})`)
  } catch (error) {
    console.error('[ONBOARDING] Error starting onboarding:', error)
    await sendMessage(phone, '⚠️ Hubo un error. Intentá de nuevo en unos minutos.')
  }
}

async function handleOnboardingStep(phone: string, message: any): Promise<void> {
  const state = pendingOnboarding.get(phone)
  if (!state) return

  const text = (message.type === 'text' ? message.text?.body?.trim() : '') || ''
  const textLower = text.toLowerCase()

  try {
    if (!text || text.length < 2) {
      await sendMessage(phone, 'Escribí un nombre para tu grupo (ej: "Viaje a Bariloche")')
      return
    }

    // Create group
    const groupRef = db.collection('ttc_group').doc()
    await groupRef.set({
      id: groupRef.id,
      name: text,
      members: [state.userId],
      createdBy: state.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    await setActiveMode(state.userId, 'grupos')
    pendingOnboarding.delete(phone)

    const inviteLink = `https://textthecheck.app/join?group=${groupRef.id}`
    await sendMessage(phone, formatOnboardingGruposCreated(text, inviteLink))
    console.log(`[ONBOARDING] ${state.contactName} completed → grupos (group: ${text})`)
  } catch (error) {
    console.error('[ONBOARDING] Error in step:', error)
    await sendMessage(phone, '⚠️ Hubo un error. Intentá de nuevo.')
  }
}

// ─── Security middleware ───────────────────────────────────────────

function verifyWebhookSignature(req: any, res: any, next: any): void {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const skipFlag = process.env.WHATSAPP_SKIP_SIGNATURE_VERIFICATION === 'true'

  if (isDevelopment && skipFlag) {
    console.warn('WARNING: Skipping webhook signature verification (development only)')
    return next()
  }

  if (!isDevelopment && skipFlag) {
    console.error('SECURITY ERROR: WHATSAPP_SKIP_SIGNATURE_VERIFICATION is enabled in production')
    return res.status(500).json({ error: 'Invalid server configuration' })
  }

  const signature = req.headers['x-hub-signature-256']
  const appSecret = process.env.WHATSAPP_APP_SECRET

  if (!appSecret) { console.error('WHATSAPP_APP_SECRET not configured'); return res.status(500).json({ error: 'Server configuration error' }) }
  if (!signature) { console.error('Missing X-Hub-Signature-256 header'); return res.status(401).json({ error: 'Missing signature' }) }

  const signatureHash = signature.split('=')[1]
  if (!signatureHash) { return res.status(401).json({ error: 'Invalid signature format' }) }

  const rawBody = req.rawBody
  const expectedHash = crypto.createHmac('sha256', appSecret).update(rawBody || JSON.stringify(req.body)).digest('hex')

  // Constant-time comparison
  try {
    const sigBuf = Buffer.from(signatureHash, 'hex')
    const expBuf = Buffer.from(expectedHash, 'hex')
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error('Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }
  } catch {
    console.error('Invalid webhook signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  next()
}

const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Routes ────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    name: 'Text The Check API',
    version: '1.0.0',
    status: 'running',
    endpoints: { health: '/health', webhook: '/webhook' },
  })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
})

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[VERIFY] Webhook verified successfully')
    return res.status(200).send(challenge)
  }

  console.error('[VERIFY] Webhook verification failed')
  return res.sendStatus(403)
})

// Webhook POST — receive messages
app.post('/webhook', webhookRateLimiter, verifyWebhookSignature, async (req, res) => {
  res.sendStatus(200) // Respond immediately

  try {
    await processWebhook(req.body)
  } catch (error) {
    console.error('Error processing webhook:', error)
  }
})

// ─── Webhook processing ───────────────────────────────────────────

async function processWebhook(payload: any): Promise<void> {
  if (payload.object !== 'whatsapp_business_account') return
  if (!payload.entry) return

  for (const entry of payload.entry) {
    if (!entry.changes) continue
    for (const change of entry.changes) {
      const { value } = change
      if (!value?.messages?.length) continue

      for (const message of value.messages) {
        await processMessage(message, value.contacts)
      }
    }
  }
}

async function processMessage(message: any, contacts: any[]): Promise<void> {
  const messageId = message.id
  if (isDuplicate(messageId)) return

  const from = message.from
  const contactName = contacts?.[0]?.profile?.name || 'Usuario'
  const messageType = message.type

  const preview = messageType === 'text' ? ` "${(message.text?.body || '').slice(0, 80)}"` : ''
  console.log(`[MSG] ${contactName} (${from}) ${messageType}${preview}`)

  // ── Global commands (before mode routing) ──

  if (messageType === 'text') {
    const textRaw = message.text?.body?.trim() || ''
    const textUpper = textRaw.toUpperCase()
    const textLower = textRaw.toLowerCase()

    // VINCULAR — unified linking flow (works for both modes)
    if (textLower.startsWith('vincular ')) {
      const code = textRaw.split(/\s+/)[1] || ''
      await handleVincular(from, code, contactName)
      return
    }

    // DESVINCULAR — unlink WhatsApp
    if (textLower === 'desvincular') {
      await handleDesvincular(from)
      return
    }

    // /ayuda or /help — two-step flow with buttons
    if (textLower === '/ayuda' || textLower === '/help' || textLower === 'ayuda' || textLower === 'help') {
      const { user: helpUser } = await determineUserMode(from)
      if (!helpUser) {
        await sendMessage(from, `📖 *Cómo usar text the check*\n\nMandá cualquier mensaje para crear tu cuenta y empezar a dividir gastos con amigos.`)
        return
      }
      // Has account — show button choice: Comandos vs Soporte AI
      await sendButtons(from, '¿En qué te puedo ayudar?', [
        { id: 'ayuda_comandos', title: 'Comandos' },
        { id: 'ayuda_soporte', title: 'Soporte AI' },
      ])
      return
    }
  }

  // ── Interactive button responses (before mode routing) ──

  if (messageType === 'interactive') {
    const buttonId = message.interactive?.button_reply?.id || ''

    // /ayuda button responses
    if (buttonId === 'ayuda_comandos') {
      const { user } = await determineUserMode(from)
      if (user) {
        await gruposHandler.handleMessage(from, 'text', { type: 'text', text: { body: '/ayuda' } }, user, contactName)
      }
      return
    }

    if (buttonId === 'ayuda_soporte') {
      createSupportSession(from)
      await sendMessage(from, 'Escribí tu consulta y te ayudo.')
      return
    }

    // Support session button responses
    if (buttonId === 'support_otra') {
      const session = activeSupportSessions.get(from)
      if (session) {
        resetSessionTimers(from)
        await sendMessage(from, 'Escribí tu consulta y te ayudo.')
      } else {
        createSupportSession(from)
        await sendMessage(from, 'Escribí tu consulta y te ayudo.')
      }
      return
    }

    if (buttonId === 'support_listo') {
      clearSupportSession(from)
      await sendMessage(from, 'Listo! Si necesitás algo más, escribí /ayuda cuando quieras.')
      return
    }

    // Smart support detection button responses
    if (buttonId === 'support_detect_ai') {
      createSupportSession(from)
      await sendMessage(from, 'Escribí tu consulta y te ayudo.')
      const user = await gruposHandler.getUserByPhone(from)
      if (user) {
        gruposHandler.clearPendingSupportText(user.id)
      }
      return
    }

    if (buttonId === 'support_detect_expense') {
      const user = await gruposHandler.getUserByPhone(from)
      if (!user) {
        await sendMessage(from, 'Escribí el gasto que querés registrar.')
        return
      }
      const originalText = gruposHandler.getPendingSupportText(user.id)

      if (originalText) {
        gruposHandler.clearPendingSupportText(user.id)
        await gruposHandler.handleMessage(from, 'text', { type: 'text', text: { body: originalText } }, user, contactName, true)
      } else {
        await sendMessage(from, 'Escribí el gasto que querés registrar.')
      }
      return
    }

    // Unknown button — fall through to text handling
    // Some button responses might be handled by the mode handlers
  }

  // ── Active support session check (before mode routing) ──

  if (messageType === 'text') {
    const textBody = (message.text?.body?.trim() || '').toLowerCase()
    const session = activeSupportSessions.get(from)
    if (session) {
      // Exit commands
      if (['salir', 'exit', 'listo', 'listo, gracias', 'listo gracias'].includes(textBody)) {
        clearSupportSession(from)
        await sendMessage(from, 'Listo! Si necesitás algo más, escribí /ayuda cuando quieras.')
        return
      }
      // Route to support handler
      await handleAISupport(from, message.text?.body?.trim() || '', session)
      return
    }
  }

  // ── Determine user ──

  const { user } = await determineUserMode(from)

  if (!user) {
    // Check if user is mid-onboarding
    if (pendingOnboarding.has(from)) {
      await handleOnboardingStep(from, message)
      return
    }

    // New user — auto-create account and start onboarding
    await startOnboarding(from, contactName)
    return
  }

  // Route to Grupos handler
  await gruposHandler.handleMessage(from, messageType, message, user, contactName)
}

// ─── VINCULAR / DESVINCULAR ──────────────────────────────────────

async function handleVincular(phone: string, code: string, contactName: string): Promise<void> {
  if (!code) {
    await sendMessage(phone, '⚠️ Formato incorrecto. Usá: *VINCULAR <código>*\n\nEjemplo: VINCULAR ABC123')
    return
  }

  try {
    const codeUpper = code.toUpperCase()
    const codeDoc = await db.collection('pt_whatsapp_link').doc(codeUpper).get()

    if (!codeDoc.exists) {
      await sendMessage(phone, '⚠️ Código no encontrado o expirado.\n\nGenerá un nuevo código desde tu Perfil en la app.')
      return
    }

    const codeData = codeDoc.data()!
    if (codeData.status !== 'pending') {
      await sendMessage(phone, '⚠️ Código no válido.\n\nGenerá un nuevo código desde tu Perfil en la app.')
      return
    }

    // Check 10-minute expiry
    const createdAt = codeData.createdAt?.toDate() || new Date(0)
    if ((Date.now() - createdAt.getTime()) / (1000 * 60) > 10) {
      await db.collection('pt_whatsapp_link').doc(codeUpper).delete()
      await sendMessage(phone, '⚠️ El código expiró.\n\nGenerá un nuevo código desde tu Perfil en la app.')
      return
    }

    const userId = codeData.userId // Auth UID = ttc_user doc ID
    const canonicalPhone = normalizeForComparison(phone)

    // Delete pending code doc
    await db.collection('pt_whatsapp_link').doc(codeUpper).delete()

    // Set ttc_user.phone (enables Grupos)
    await db.collection('ttc_user').doc(userId).update({ phone: canonicalPhone })

    await sendMessage(phone, `✅ *¡Cuenta vinculada!*\n\nYa podés dividir gastos con amigos por WhatsApp.\nContame qué pagaste y lo divido.\n\n_Escribí /ayuda para ver todas las opciones._`)
  } catch (error) {
    console.error('Error in VINCULAR:', error)
    await sendMessage(phone, '⚠️ Error al vincular la cuenta. Intentá nuevamente.')
  }
}

async function handleDesvincular(phone: string): Promise<void> {
  try {
    const linkDoc = await db.collection('pt_whatsapp_link').doc(phone).get()
    if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
      await sendMessage(phone, '⚠️ Este número no está vinculado a ninguna cuenta.\n\nPara vincular, generá un código desde tu Perfil en la app.')
      return
    }

    const userId = linkDoc.data()!.userId

    // Clear ttc_user.phone
    if (userId) {
      await db.collection('ttc_user').doc(userId).update({ phone: '' })
    }

    // Delete linked doc
    await db.collection('pt_whatsapp_link').doc(phone).delete()

    await sendMessage(phone, '✅ *Cuenta desvinculada*\n\nPara volver a vincular, generá un nuevo código desde tu Perfil en la app.')
  } catch (error) {
    console.error('Error in DESVINCULAR:', error)
    await sendMessage(phone, '⚠️ Error al desvincular la cuenta. Intentá nuevamente.')
  }
}

// ─── User detection ──────────────────────────────────────────

interface UserLookupResult {
  user: any | null
}

async function determineUserMode(phone: string): Promise<UserLookupResult> {
  const user = await gruposHandler.getUserByPhone(phone)

  if (!user) {
    const candidates = generatePhoneCandidates(phone)
    console.log(`[MODE] User not found for phone ${phone}. Candidates tried: ${candidates.join(', ')}`)
  }

  return { user }
}


async function setActiveMode(userId: string, mode: string): Promise<void> {
  try {
    await db.collection('ttc_user').doc(userId).update({ activeMode: mode })
  } catch (error) {
    console.error('Error setting active mode:', error)
  }
}

// ─── Error handlers ────────────────────────────────────────────────

app.use((_req: any, res: any) => {
  res.status(404).json({ error: 'Not Found' })
})

Sentry.setupExpressErrorHandler(app)

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  })
})

// ─── Start server ──────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[INIT] Text The Check server running on http://localhost:${PORT}`)
  console.log(`[INIT] Endpoints: GET /health, GET /webhook, POST /webhook`)
})
