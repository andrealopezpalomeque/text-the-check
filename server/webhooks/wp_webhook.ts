/**
 * wp_webhook.ts — Standalone Express server for the WhatsApp Business API webhook.
 *
 * Single entry point for all WhatsApp messages. Routes to GruposHandler or
 * FinanzasHandler based on user's activeMode field.
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
import { sendMessage } from '../helpers/whatsapp.js'
import GeminiHandler from '../handlers/GeminiHandler.js'
import GruposHandler from '../handlers/GruposHandler.js'
import FinanzasHandler from '../handlers/FinanzasHandler.js'

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
const finanzasHandler = new FinanzasHandler(gemini)

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

    // MODE switch
    if (textUpper === 'MODE GRUPOS' || textUpper === 'MODE FINANZAS') {
      const targetMode = textUpper === 'MODE GRUPOS' ? 'grupos' : 'finanzas'
      const switched = await setUserActiveMode(from, targetMode)
      if (switched) {
        await sendMessage(from, `Modo cambiado a *${targetMode}*. Tus próximos mensajes se procesarán en este modo.`)
      } else {
        await sendMessage(from, `No encontré tu cuenta. Primero vinculá tu número:\n\n1. Registrate en https://textthecheck.app\n2. Andá a Configuración → WhatsApp\n3. Copiá el código y enviá acá: *VINCULAR <código>*`)
      }
      return
    }
  }

  // ── Determine user mode ──

  const { mode, user } = await determineUserMode(from)

  if (!mode) {
    await sendMessage(from, `¡Hola${contactName !== 'Usuario' ? ` ${contactName}` : ''}! No encontré tu cuenta.\n\nPara empezar:\n1. Registrate en https://textthecheck.app\n2. Andá a Configuración → WhatsApp\n3. Copiá el código de vinculación\n4. Enviá acá: *VINCULAR <código>*\n\nEsto te habilita tanto *Grupos* como *Finanzas*.`)
    return
  }

  // Route to handler
  if (mode === 'grupos') {
    if (messageType !== 'text') return // Grupos only handles text
    const text = message.text?.body || ''
    if (!user) return
    await gruposHandler.handleMessage(from, text, messageId, user)
  } else {
    await finanzasHandler.handleMessage(from, messageType, message, contactName)
  }
}

// ─── VINCULAR / DESVINCULAR ──────────────────────────────────────

async function handleVincular(phone: string, code: string, contactName: string): Promise<void> {
  if (!code) {
    await sendMessage(phone, 'Formato incorrecto. Usá: VINCULAR <codigo>\n\nEjemplo: VINCULAR ABC123')
    return
  }

  try {
    const codeUpper = code.toUpperCase()
    const codeDoc = await db.collection('pt_whatsapp_link').doc(codeUpper).get()

    if (!codeDoc.exists) {
      await sendMessage(phone, 'Código no encontrado o expirado. Generá un nuevo código desde tu Perfil en la app.')
      return
    }

    const codeData = codeDoc.data()!
    if (codeData.status !== 'pending') {
      await sendMessage(phone, 'Código no válido. Generá un nuevo código desde tu Perfil en la app.')
      return
    }

    // Check 10-minute expiry
    const createdAt = codeData.createdAt?.toDate() || new Date(0)
    if ((Date.now() - createdAt.getTime()) / (1000 * 60) > 10) {
      await db.collection('pt_whatsapp_link').doc(codeUpper).delete()
      await sendMessage(phone, 'El código expiró. Generá un nuevo código desde tu Perfil en la app.')
      return
    }

    const userId = codeData.userId // Auth UID = ttc_user doc ID

    // Delete pending code doc
    await db.collection('pt_whatsapp_link').doc(codeUpper).delete()

    // Set ttc_user.phone (enables Grupos)
    await db.collection('ttc_user').doc(userId).update({ phone })

    // Create linked doc in pt_whatsapp_link (enables Finanzas)
    await db.collection('pt_whatsapp_link').doc(phone).set({
      status: 'linked',
      userId,
      phoneNumber: phone,
      contactName,
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    await sendMessage(phone, `¡Cuenta vinculada!\n\nAhora podés usar:\n• *Grupos* — dividir gastos con amigos\n• *Finanzas* — registrar gastos personales\n\nEscribí *MODE GRUPOS* o *MODE FINANZAS* para elegir modo.\nO simplemente mandá un mensaje y te guío.`)
  } catch (error) {
    console.error('Error in VINCULAR:', error)
    await sendMessage(phone, 'Error al vincular la cuenta. Intentá nuevamente.')
  }
}

async function handleDesvincular(phone: string): Promise<void> {
  try {
    const linkDoc = await db.collection('pt_whatsapp_link').doc(phone).get()
    if (!linkDoc.exists || linkDoc.data()?.status !== 'linked') {
      await sendMessage(phone, 'Este número no está vinculado a ninguna cuenta.')
      return
    }

    const userId = linkDoc.data()!.userId

    // Clear ttc_user.phone
    if (userId) {
      await db.collection('ttc_user').doc(userId).update({ phone: '' })
    }

    // Delete linked doc
    await db.collection('pt_whatsapp_link').doc(phone).delete()

    await sendMessage(phone, 'Cuenta desvinculada. Para volver a vincular, generá un nuevo código desde tu Perfil en la app.')
  } catch (error) {
    console.error('Error in DESVINCULAR:', error)
    await sendMessage(phone, 'Error al desvincular la cuenta. Intentá nuevamente.')
  }
}

// ─── User mode detection ──────────────────────────────────────────

interface UserWithMode {
  mode: string | null
  user: any | null
}

async function determineUserMode(phone: string): Promise<UserWithMode> {
  // 1. Look up user in ttc_user
  const user = await gruposHandler.getUserByPhone(phone)

  // 2. Check activeMode on user doc
  if (user?.activeMode) {
    return { mode: user.activeMode as string, user }
  }

  // 3. Check if linked in finanzas
  const isLinked = await finanzasHandler.checkLinked(phone)

  // 4. Check if member of any grupo
  const hasGroups = user !== null

  if (!isLinked && !hasGroups) {
    const candidates = generatePhoneCandidates(phone)
    console.log(`[MODE] User not found for phone ${phone}. Candidates tried: ${candidates.join(', ')}`)
  }

  if (isLinked && hasGroups) {
    // Both — need explicit mode selection
    // For now, default to the one they used most recently, or prompt
    await sendMessage(phone, `Estás registrado en ambos modos.\n\nEscribí *MODE GRUPOS* o *MODE FINANZAS* para elegir cómo procesar tus mensajes.`)
    return { mode: null, user }
  }

  if (isLinked) {
    // Auto-set finanzas
    if (user) await setActiveMode(user.id, 'finanzas')
    return { mode: 'finanzas', user }
  }

  if (hasGroups) {
    // Auto-set grupos
    if (user) await setActiveMode(user.id, 'grupos')
    return { mode: 'grupos', user }
  }

  return { mode: null, user: null }
}

async function setUserActiveMode(phone: string, mode: string): Promise<boolean> {
  const user = await gruposHandler.getUserByPhone(phone)
  if (!user) return false
  await setActiveMode(user.id, mode)
  return true
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
