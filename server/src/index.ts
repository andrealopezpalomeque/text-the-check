/**
 * index.ts — Standalone Express server for the Auth API.
 *
 * OTP-based authentication for WhatsApp-created users.
 * Separate from the webhook server — each runs as its own service.
 */

import 'dotenv/config'
import './instrument.js'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import * as Sentry from '@sentry/node'

import { db, admin } from './config/firebase.js'
import { normalizeForComparison, generatePhoneCandidates } from './helpers/phone.js'
import { sendMessage } from './helpers/whatsapp.js'

// ─── Express setup ─────────────────────────────────────────────────

const app = express()
const PORT = process.env.API_PORT || 3002

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// ─── User lookup ────────────────────────────────────────────────────

async function getUserByPhone(phoneNumber: string): Promise<{ id: string; phone: string } | null> {
  try {
    const usersRef = db.collection('ttc_user')
    const candidates = generatePhoneCandidates(phoneNumber)

    for (const candidate of candidates) {
      const snapshot = await usersRef.where('phone', '==', candidate).limit(1).get()
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return { id: doc.id, phone: doc.data().phone }
      }
    }

    // Legacy fallback
    for (const candidate of candidates) {
      const snapshot = await usersRef.where('phoneNumber', '==', candidate).limit(1).get()
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return { id: doc.id, phone: doc.data().phoneNumber }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user by phone:', error)
    return null
  }
}

// ─── Routes ────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    name: 'Text The Check Auth API',
    version: '1.0.0',
    status: 'running',
    endpoints: { health: '/health', otpRequest: '/auth/otp/request', otpVerify: '/auth/otp/verify', otpMerge: '/auth/otp/merge' },
  })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
})

// ─── OTP Auth Routes ────────────────────────────────────────────────

const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Demasiados intentos. Esperá un minuto.' },
  keyGenerator: (req: any) => req.body?.phone || ipKeyGenerator(req.ip!),
})

app.post('/auth/otp/request', otpRateLimiter, async (req, res) => {
  try {
    const { phone } = req.body || {}
    if (!phone) return res.status(400).json({ error: 'Número de teléfono requerido' })

    console.log('[OTP] Looking up user...')
    const user = await getUserByPhone(phone)
    console.log('[OTP] User lookup result:', user?.id || 'not found')

    if (!user) {
      return res.status(404).json({ error: 'No hay cuenta asociada a este número' })
    }

    // Use the canonical phone from Firestore (not raw input) for both
    // the OTP doc key and WhatsApp delivery
    const canonicalPhone = normalizeForComparison(user.phone)

    const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')

    console.log('[OTP] Writing OTP doc...')
    await db.collection('ttc_otp').doc(canonicalPhone).set({
      code,
      userId: user.id,
      phone: canonicalPhone,
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log('[OTP] Sending WhatsApp message...')
    await sendMessage(user.phone, `Tu código de acceso es: *${code}*\n\nExpira en 5 minutos. No lo compartas.`)
    console.log(`[OTP] Code sent to ${user.phone} for user ${user.id}`)
    return res.json({ success: true })
  } catch (error) {
    console.error('[OTP] Error requesting code:', error)
    return res.status(500).json({ error: 'Error al enviar el código' })
  }
})

app.post('/auth/otp/verify', otpRateLimiter, async (req, res) => {
  try {
    const { phone, code } = req.body || {}
    if (!phone || !code) return res.status(400).json({ error: 'Teléfono y código requeridos' })

    // Look up user to get canonical phone (same lookup as request)
    const user = await getUserByPhone(phone)
    if (!user) {
      return res.status(401).json({ error: 'Código expirado o inválido' })
    }

    const canonicalPhone = normalizeForComparison(user.phone)
    const otpRef = db.collection('ttc_otp').doc(canonicalPhone)
    const otpDoc = await otpRef.get()

    if (!otpDoc.exists) {
      return res.status(401).json({ error: 'Código expirado o inválido' })
    }

    const entry = otpDoc.data()!

    // Check expiry (5 min)
    const createdAt = entry.createdAt?.toDate?.() || new Date(0)
    if (Date.now() - createdAt.getTime() > 5 * 60 * 1000) {
      await otpRef.delete()
      return res.status(401).json({ error: 'Código expirado o inválido' })
    }

    // Check max attempts
    if (entry.attempts >= 3) {
      await otpRef.delete()
      return res.status(401).json({ error: 'Demasiados intentos. Solicitá un nuevo código.' })
    }

    if (entry.code !== code) {
      await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) })
      return res.status(401).json({ error: 'Código incorrecto' })
    }

    // Valid — create custom token and clean up
    const token = await admin.auth().createCustomToken(entry.userId)

    // Ensure the Firebase Auth user exists, then set custom claims
    try {
      await admin.auth().getUser(entry.userId)
    } catch {
      await admin.auth().createUser({ uid: entry.userId })
    }
    await admin.auth().setCustomUserClaims(entry.userId, { ttcUserId: entry.userId })

    await otpRef.delete()

    console.log(`[OTP] Verified for user ${entry.userId}`)
    return res.json({ token })
  } catch (error) {
    console.error('[OTP] Error verifying code:', error)
    return res.status(500).json({ error: 'Error al verificar el código' })
  }
})

// ─── Merge endpoint ─────────────────────────────────────────────────

app.post('/auth/otp/merge', otpRateLimiter, async (req, res) => {
  try {
    const { phone, code, email } = req.body || {}
    if (!phone || !code || !email) {
      return res.status(400).json({ error: 'Teléfono, código y email requeridos' })
    }

    // Verify OTP (same logic as /auth/otp/verify)
    const user = await getUserByPhone(phone)
    if (!user) {
      return res.status(401).json({ error: 'Código expirado o inválido' })
    }

    const canonicalPhone = normalizeForComparison(user.phone)
    const otpRef = db.collection('ttc_otp').doc(canonicalPhone)
    const otpDoc = await otpRef.get()

    if (!otpDoc.exists) {
      return res.status(401).json({ error: 'Código expirado o inválido' })
    }

    const entry = otpDoc.data()!

    const createdAt = entry.createdAt?.toDate?.() || new Date(0)
    if (Date.now() - createdAt.getTime() > 5 * 60 * 1000) {
      await otpRef.delete()
      return res.status(401).json({ error: 'Código expirado o inválido' })
    }

    if (entry.attempts >= 3) {
      await otpRef.delete()
      return res.status(401).json({ error: 'Demasiados intentos. Solicitá un nuevo código.' })
    }

    if (entry.code !== code) {
      await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) })
      return res.status(401).json({ error: 'Código incorrecto' })
    }

    // OTP valid — now merge the email into the phone-based user
    const userRef = db.collection('ttc_user').doc(user.id)
    const userDoc = await userRef.get()
    const userData = userDoc.data()

    // Safety: don't overwrite an existing different email
    if (userData?.email && userData.email !== email.toLowerCase()) {
      await otpRef.delete()
      return res.status(409).json({ error: 'Esta cuenta ya tiene otro email vinculado' })
    }

    await userRef.update({ email: email.toLowerCase() })

    // Set custom claims on the Google Auth user so Firestore rules map to the canonical ttc_user ID
    const googleUser = await admin.auth().getUserByEmail(email.toLowerCase())
    await admin.auth().setCustomUserClaims(googleUser.uid, { ttcUserId: user.id })

    await otpRef.delete()

    // Clean up orphaned ttc_user docs that have this email (auto-created by old flow)
    const dupeSnapshot = await db.collection('ttc_user')
      .where('email', '==', email.toLowerCase())
      .get()
    for (const dupeDoc of dupeSnapshot.docs) {
      if (dupeDoc.id !== user.id) {
        await dupeDoc.ref.delete()
        console.log(`[MERGE] Deleted orphaned user doc ${dupeDoc.id}`)
      }
    }

    console.log(`[MERGE] Email ${email} merged into user ${user.id}`)
    return res.json({
      user: {
        id: user.id,
        name: userData?.name || '',
        phone: user.phone,
        email: email.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('[MERGE] Error merging account:', error)
    return res.status(500).json({ error: 'Error al vincular la cuenta' })
  }
})

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
  console.log(`[INIT] Text The Check Auth API running on http://localhost:${PORT}`)
  console.log(`[INIT] Endpoints: GET /health, POST /auth/otp/request, POST /auth/otp/verify, POST /auth/otp/merge`)
})
