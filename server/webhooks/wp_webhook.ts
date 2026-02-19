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

import { db } from '../config/firebase.js'
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

  console.log(`[WEBHOOK] ${messageType} from ${from}`)

  // Check for mode switch command (before routing)
  if (messageType === 'text') {
    const text = message.text?.body?.trim().toUpperCase() || ''
    if (text === 'MODE GRUPOS' || text === 'MODE FINANZAS') {
      const mode = text === 'MODE GRUPOS' ? 'grupos' : 'finanzas'
      await setUserActiveMode(from, mode)
      await sendMessage(from, `Modo cambiado a *${mode}*. Tus próximos mensajes se procesarán en este modo.`)
      return
    }
  }

  // Determine user mode
  const { mode, user } = await determineUserMode(from)

  if (!mode) {
    // Can't determine mode — neither linked nor in a group
    if (messageType === 'text') {
      const text = message.text?.body?.trim().toLowerCase() || ''
      if (text.startsWith('vincular ')) {
        // Allow vincular even without a mode
        await finanzasHandler.handleMessage(from, messageType, message, contactName)
        return
      }
    }
    await sendMessage(from, 'No encontré tu cuenta. Si querés usar Finanzas, escribí VINCULAR <codigo>. Si querés usar Grupos, registrate desde https://textthecheck.app')
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

async function setUserActiveMode(phone: string, mode: string): Promise<void> {
  const user = await gruposHandler.getUserByPhone(phone)
  if (user) await setActiveMode(user.id, mode)
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
