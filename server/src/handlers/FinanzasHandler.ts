/**
 * FinanzasHandler — all finanzas (personal finance) domain logic.
 *
 * Commands, expense parsing, account linking, audio/image/PDF processing,
 * category matching, monthly summary, recurring payments, AI analysis.
 *
 * Firestore collections: pt_whatsapp_link, pt_payment, pt_expense_category, pt_recurrent
 */

import admin from 'firebase-admin'
import * as Sentry from '@sentry/node'
import { db } from '../config/firebase.js'
import { sendMessage, downloadMedia } from '../helpers/whatsapp.js'
import {
  formatAmount, formatNotLinkedError, formatHelpMessage,
  formatParseError, formatSaveError, formatMediaError,
  formatMonthlySummary, formatRecurringSummary,
  buildConfirmationRequest, buildConfirmationSuccess, buildConfirmationCancelled,
  isAffirmativeResponse, isNegativeResponse, isGreeting, formatGreetingResponse,
  formatTransferConfirmation, formatExpenseList,
  type MonthlySummaryOptions, type ExpenseListEntry,
} from '../helpers/responseFormatter.js'
import { generatePhoneCandidates } from '../helpers/phone.js'
import type GeminiHandler from './GeminiHandler.js'
import type { AIPersonalExpenseResult } from './GeminiHandler.js'

// ─── Constants ─────────────────────────────────────────────────────

const COLLECTIONS = {
  WHATSAPP_LINKS: 'pt_whatsapp_link',
  PAYMENTS: 'pt_payment',
  CATEGORIES: 'pt_expense_category',
  RECURRENTS: 'pt_recurrent',
}

const FALLBACK_CATEGORIES = ['supermercado', 'salidas', 'transporte', 'servicios', 'suscripciones']

interface PendingFinanzasExpense {
  phone: string
  userId: string
  originalText: string
  type: 'expense' | 'transfer'
  expense: {
    amount: number
    title: string
    categoryId: string
    categoryName: string
    description: string
    isRecurrent: boolean
    frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly' | null
  }
  source: string
  audioTranscription?: string | null
  paymentDate?: admin.firestore.FieldValue | admin.firestore.Timestamp
  recipient?: {
    name: string | null
    cbu: string | null
    alias: string | null
    bank: string | null
  } | null
  needsRevision?: boolean
  createdAt: Date
}

const NOT_LINKED_MSG = formatNotLinkedError()

// ─── Helpers ───────────────────────────────────────────────────────

function logError(message: string, error: unknown): void {
  const detail = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null
      ? JSON.stringify(error).slice(0, 200)
      : String(error ?? '')
  console.error(`[ERROR] ${message} ${detail}`)
  if (error instanceof Error) Sentry.captureException(error)
  else Sentry.captureMessage(message, { level: 'error', extra: { detail: error } })
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function parseDateOrNow(dateStr: string | null | undefined): admin.firestore.FieldValue | admin.firestore.Timestamp {
  if (!dateStr) return admin.firestore.FieldValue.serverTimestamp()
  const parsed = new Date(dateStr + 'T12:00:00')
  if (isNaN(parsed.getTime())) return admin.firestore.FieldValue.serverTimestamp()
  return admin.firestore.Timestamp.fromDate(parsed)
}

// ─── Handler class ─────────────────────────────────────────────────

export default class FinanzasHandler {
  private gemini: GeminiHandler
  private pendingAIExpenses = new Map<string, PendingFinanzasExpense>()
  private welcomedPhones = new Set<string>()
  private readonly AI_EXPENSE_TIMEOUT = 5 * 60 * 1000

  constructor(gemini: GeminiHandler) {
    this.gemini = gemini
    setInterval(() => this.cleanupPendingStates(), 60 * 1000)
  }

  private cleanupPendingStates(): void {
    const cutoff = Date.now() - this.AI_EXPENSE_TIMEOUT
    for (const [phone, p] of this.pendingAIExpenses.entries()) {
      if (p.createdAt.getTime() < cutoff) this.pendingAIExpenses.delete(phone)
    }
  }

  private async checkAndSendWelcome(phone: string, contactName: string): Promise<boolean> {
    if (this.welcomedPhones.has(phone)) return false

    for (const candidate of generatePhoneCandidates(phone)) {
      const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(candidate).get()
      if (linkDoc.exists && linkDoc.data()?.status === 'linked') {
        this.welcomedPhones.add(phone)
        if (!linkDoc.data()?.finanzasWelcomedAt) {
          const firstName = contactName?.split(' ')[0] || ''
          await sendMessage(phone, this.getWelcomeMessage(firstName))
          await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(candidate).update({ finanzasWelcomedAt: new Date() })
          return true
        }
        return false
      }
    }
    return false
  }

  private getWelcomeMessage(firstName: string): string {
    const greeting = firstName ? `¡Hola ${firstName}! 👋` : '¡Hola! 👋'
    return `${greeting} Bienvenido a *text the check*\n\nSoy tu bot para registrar gastos personales.\n\n💬 *Simplemente contame qué pagaste:*\n"1500 café"\n"Gasté 2 lucas en uber"\n"50 dólares la cena"\n\nLa IA entiende lo que escribas y te pide confirmar antes de guardar.\n\n🎤 *También podés enviar:*\n- Audio describiendo tu gasto\n- Foto de comprobante\n- PDF de comprobante\n\n⚡ *Comandos:*\n/balance → resumen del mes\n/lista → últimos gastos\n/ayuda → más opciones\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📊 Desde el dashboard podés ver y editar tus gastos:\nhttps://textthecheck.app\n\n¡Empezá a cargar gastos! 🎉`
  }

  private hasPendingAIExpense(phone: string): boolean {
    return this.pendingAIExpenses.has(phone)
  }

  private getPendingAIExpense(phone: string): PendingFinanzasExpense | undefined {
    return this.pendingAIExpenses.get(phone)
  }

  // ─── Main entry point ──────────────────────────────────────────

  async handleMessage(from: string, messageType: string, messageData: any, contactName: string): Promise<void> {
    try {
      // Welcome message on first interaction
      if (await this.checkAndSendWelcome(from, contactName)) return

      if (messageType === 'text') {
        const text = messageData.text?.body || messageData
        await this.processTextMessage(from, typeof text === 'string' ? text : String(text), contactName)
      } else if (messageType === 'audio') {
        await this.processAudioMessage(from, messageData.audio.id, contactName)
      } else if (messageType === 'image') {
        await this.processImageMessage(from, messageData.image.id, messageData.image?.caption, contactName)
      } else if (messageType === 'document') {
        const mimeType = messageData.document?.mime_type || ''
        if (mimeType === 'application/pdf') {
          await this.processPDFMessage(from, messageData.document.id, messageData.document?.caption, contactName)
        } else {
          await sendMessage(from, '⚠️ Solo se aceptan documentos PDF.')
        }
      }
    } catch (error) {
      logError('Error in FinanzasHandler:', error)
    }
  }

  // ─── Text message routing ──────────────────────────────────────

  private async processTextMessage(from: string, text: string, contactName: string): Promise<void> {
    const normalized = text.trim().toLowerCase()

    // Pending AI expense confirmation (check before command routing)
    if (this.hasPendingAIExpense(from)) {
      if (isAffirmativeResponse(normalized)) {
        const pending = this.getPendingAIExpense(from)
        if (pending) {
          await this.saveConfirmedExpense(pending)
          this.pendingAIExpenses.delete(from)
          return
        }
      }
      if (isNegativeResponse(normalized)) {
        this.pendingAIExpenses.delete(from)
        await sendMessage(from, buildConfirmationCancelled())
        return
      }
      // Something else — cancel pending, fall through to process new message
      this.pendingAIExpenses.delete(from)
    }

    if (normalized === 'ayuda' || normalized === 'help' || normalized === '/ayuda' || normalized === '/help') { await this.sendHelpMessage(from); return }
    if (normalized === 'categorias' || normalized === '/categorias') { await this.handleCategoriesCommand(from); return }
    if (normalized === 'resumen' || normalized === '/resumen' || normalized === '/balance') { await this.handleResumenCommand(from); return }
    if (normalized === 'fijos' || normalized === '/fijos') { await this.handleFijosCommand(from); return }
    if (normalized === 'analisis' || normalized === '/analisis') { await this.handleAnalisisCommand(from); return }
    if (normalized === '/lista') { await this.handleListaCommand(from); return }

    // Greeting detection — respond with mode context, don't send to AI
    if (isGreeting(normalized)) {
      await sendMessage(from, formatGreetingResponse('finanzas'))
      return
    }

    await this.handleExpenseMessage(from, text)
  }

  /** Check if phone is linked. Tries multiple format candidates. Returns userId (Firebase Auth UID) or null. */
  async checkLinked(phone: string): Promise<string | null> {
    for (const candidate of generatePhoneCandidates(phone)) {
      const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(candidate).get()
      if (linkDoc.exists && linkDoc.data()?.status === 'linked') {
        return linkDoc.data()!.userId
      }
    }
    return null
  }

  // ─── Commands ──────────────────────────────────────────────────

  private async sendHelpMessage(phone: string): Promise<void> {
    let commonCats = FALLBACK_CATEGORIES
    const userId = await this.checkLinked(phone)
    if (userId) commonCats = await this.getUserCommonCategories(userId)

    await sendMessage(phone, formatHelpMessage('finanzas', commonCats))
  }

  private async handleCategoriesCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const snapshot = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
      if (snapshot.empty) {
        await sendMessage(phone, '📋 No tenés categorías configuradas en tu cuenta.\n\nPodés crearlas desde la app.')
        return
      }

      const names = snapshot.docs.map(d => d.data().name).filter(Boolean).sort()
      const formatted = names.map(n => `#${n.toLowerCase()}`).join('\n')

      await sendMessage(phone, `🏷️ *Tus categorías:*\n\n${formatted}\n\n💡 *Tip:* Podés escribir solo parte del nombre y se detecta automáticamente.\n\nEjemplos:\n#super → Supermercado\n#sal → Salidas\n#trans → Transporte`)
    } catch (error) {
      logError('Error fetching categories:', error)
      await sendMessage(phone, '⚠️ Error al obtener las categorías. Intentá nuevamente.')
    }
  }

  private async handleResumenCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      const [currentSnap, prevSnap, catsSnap, pendingSnap] = await Promise.all([
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('createdAt', '>=', currentMonthStart).where('createdAt', '<=', currentMonthEnd).get(),
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('createdAt', '>=', prevMonthStart).where('createdAt', '<=', prevMonthEnd).get(),
        db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get(),
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('paymentType', '==', 'recurrent').where('isPaid', '==', false).get(),
      ])

      const currentPayments = currentSnap.docs.map(d => d.data())
      const currentTotal = currentPayments.reduce((s, p) => s + (p.amount || 0), 0)
      const prevTotal = prevSnap.docs.map(d => d.data()).reduce((s, p) => s + (p.amount || 0), 0)

      const categoryMap: Record<string, string> = {}
      catsSnap.docs.forEach(d => { categoryMap[d.id] = d.data().name })

      const byCategory: Record<string, number> = {}
      currentPayments.forEach(p => {
        const name = categoryMap[p.categoryId] || 'Otros'
        byCategory[name] = (byCategory[name] || 0) + (p.amount || 0)
      })

      const topCats = Object.entries(byCategory).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3)
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

      let comparison = ''
      if (prevTotal > 0) {
        const diff = currentTotal - prevTotal
        const pct = Math.round((diff / prevTotal) * 100)
        comparison = `vs mes anterior: ${diff >= 0 ? '+' : ''}${pct}% (${diff >= 0 ? '+' : ''}${formatAmount(diff)})`
      }

      const summaryOptions: MonthlySummaryOptions = {
        monthName: monthNames[now.getMonth()], year: now.getFullYear(),
        total: currentTotal, paymentCount: currentPayments.length, comparison,
        topCategories: topCats.map(([name, amt]) => ({ name, amount: amt as number })),
        pendingRecurrents: pendingSnap.size || undefined,
      }
      await sendMessage(phone, formatMonthlySummary(summaryOptions))
    } catch (error) {
      logError('Error in RESUMEN command:', error)
      await sendMessage(phone, '⚠️ Error al obtener el resumen. Intentá nuevamente.')
    }
  }

  private async handleFijosCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const recurrentSnap = await db.collection(COLLECTIONS.RECURRENTS).where('userId', '==', userId).get()
      if (recurrentSnap.empty) {
        await sendMessage(phone, '📌 No tenés gastos fijos configurados.\n\nPodés agregarlos desde la app en la sección "Fijos".')
        return
      }

      const recurrents = recurrentSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const instancesSnap = await db.collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId).where('paymentType', '==', 'recurrent')
        .where('createdAt', '>=', monthStart).where('createdAt', '<=', monthEnd).get()

      const instanceMap: Record<string, any> = {}
      instancesSnap.docs.forEach(d => { const data = d.data(); if (data.recurrentId) instanceMap[data.recurrentId] = data })

      const pending: any[] = []
      const paid: any[] = []

      recurrents.forEach(r => {
        const isPaid = instanceMap[r.id]?.isPaid ?? false
        const dueDateDay = parseInt(r.dueDateDay) || 1
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDateDay)
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        const item = { title: r.title, amount: r.amount, daysUntilDue }
        if (isPaid) paid.push(item); else pending.push(item)
      })

      pending.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      const total = recurrents.reduce((s, r) => s + (r.amount || 0), 0)

      await sendMessage(phone, formatRecurringSummary({ totalMonthly: total, pending, paid }))
    } catch (error) {
      logError('Error in FIJOS command:', error)
      await sendMessage(phone, '⚠️ Error al obtener los gastos fijos. Intentá nuevamente.')
    }
  }

  private async handleAnalisisCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(phone, '⚠️ El análisis con IA no está disponible en este momento.')
      return
    }

    try {
      await sendMessage(phone, '🤖 Analizando tus finanzas...')

      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

      const [paymentsSnap, recurrentSnap, catsSnap] = await Promise.all([
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('createdAt', '>=', threeMonthsAgo).orderBy('createdAt', 'desc').get(),
        db.collection(COLLECTIONS.RECURRENTS).where('userId', '==', userId).get(),
        db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get(),
      ])

      const categoryMap: Record<string, string> = {}
      catsSnap.docs.forEach(d => { categoryMap[d.id] = d.data().name })

      const payments = paymentsSnap.docs.map(d => {
        const data = d.data()
        return { amount: data.amount, category: categoryMap[data.categoryId] || 'Otros', month: data.createdAt?.toDate()?.toISOString().slice(0, 7) || 'unknown' }
      })

      const monthlyData: Record<string, { total: number; byCategory: Record<string, number>; count: number }> = {}
      payments.forEach(p => {
        if (!monthlyData[p.month]) monthlyData[p.month] = { total: 0, byCategory: {}, count: 0 }
        monthlyData[p.month].total += p.amount
        monthlyData[p.month].count++
        monthlyData[p.month].byCategory[p.category] = (monthlyData[p.month].byCategory[p.category] || 0) + p.amount
      })

      const recurrents = recurrentSnap.docs.map(d => ({
        title: d.data().title, amount: d.data().amount,
        category: categoryMap[d.data().categoryId] || 'Otros',
      }))

      const analysis = await this.gemini.getFinancialAnalysis({
        monthlyData,
        totalRecurrent: recurrents.reduce((s, r) => s + (r.amount || 0), 0),
        recurrentCount: recurrents.length,
        recurrents: recurrents.slice(0, 10),
        totalPayments: payments.length,
        months: Object.keys(monthlyData).sort(),
      })

      await sendMessage(phone, analysis)
    } catch (error) {
      logError('Error in ANALISIS command:', error)
      await sendMessage(phone, '⚠️ Error al analizar tus finanzas. Intentá nuevamente.')
    }
  }

  private async handleListaCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const snap = await db.collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId).orderBy('createdAt', 'desc').limit(10).get()

      if (snap.empty) {
        await sendMessage(phone, formatExpenseList([]))
        return
      }

      const entries: ExpenseListEntry[] = snap.docs.map(d => {
        const data = d.data()
        return {
          amount: data.amount || 0,
          description: data.title || 'Sin título',
          userName: 'Yo',
          timestamp: data.createdAt?.toDate?.() || new Date(),
        }
      })

      await sendMessage(phone, formatExpenseList(entries))
    } catch (error) {
      logError('Error in LISTA command:', error)
      await sendMessage(phone, '⚠️ Error al obtener la lista. Intentá nuevamente.')
    }
  }

  // ─── Expense message parsing ───────────────────────────────────

  private async handleExpenseMessage(phone: string, text: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(phone, '⚠️ El servicio no está disponible en este momento. Intentá de nuevo más tarde.')
      return
    }

    try {
      const categoryNames = await this.getUserCategoryNames(userId)
      const aiResult = await this.gemini.parsePersonalExpenseNL(text, categoryNames)

      if (aiResult.type === 'personal_expense' && aiResult.confidence >= this.gemini.getConfidenceThreshold() && aiResult.amount > 0) {
        await this.handleAIExpense(phone, userId, aiResult, text)
        return
      }

      // AI couldn't parse — show our formatted parse error (not raw AI suggestion)
      await sendMessage(phone, formatParseError('finanzas'))
    } catch (error) {
      logError('Error in AI expense parsing:', error)
      await sendMessage(phone, '⚠️ Ocurrió un error al procesar tu mensaje. Intentá de nuevo.')
    }
  }

  // ─── Audio processing ──────────────────────────────────────────

  private async processAudioMessage(from: string, audioId: string, _contactName: string): Promise<void> {
    const userId = await this.checkLinked(from)
    if (!userId) { await sendMessage(from, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, '⚠️ Esta función no está disponible en este momento.')
      return
    }

    const media = await downloadMedia(audioId)
    if (!media) { await sendMessage(from, formatMediaError('descargar')); return }

    const catsSnap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
    const categoryNames = catsSnap.docs.map(d => d.data().name).filter(Boolean)

    await sendMessage(from, '🎤 Procesando audio...')
    const transcription = await this.gemini.transcribeAudio(media.base64, media.mimeType, categoryNames)
    if (!transcription) { await sendMessage(from, formatMediaError('procesar')); return }

    const amount = parseFloat(String(transcription.totalAmount)) || 0
    if (amount <= 0) {
      let msg = '⚠️ No pude determinar el gasto del audio.'
      if (transcription.transcription) msg = `_"${transcription.transcription}"_\n\n${msg}`
      await sendMessage(from, msg)
      return
    }

    const categoryResult = await this.findCategoryId(userId, transcription.category)
    const audioTitle = transcription.title || 'Gasto por audio'

    // Store pending and send confirmation request
    this.pendingAIExpenses.set(from, {
      phone: from,
      userId,
      originalText: `[audio] ${transcription.transcription || ''}`,
      type: 'expense',
      expense: {
        amount,
        title: audioTitle,
        categoryId: categoryResult.id,
        categoryName: categoryResult.name,
        description: transcription.description || '',
        isRecurrent: false,
        frequency: null,
      },
      source: 'whatsapp-audio',
      audioTranscription: transcription.transcription || null,
      paymentDate: parseDateOrNow(transcription.date),
      createdAt: new Date(),
    })

    let confirmMsg = buildConfirmationRequest({
      mode: 'finanzas',
      amount,
      title: audioTitle,
      categoryName: categoryResult.name,
      description: transcription.description || undefined,
    })
    if (transcription.transcription) {
      confirmMsg = `_"${transcription.transcription}"_\n\n${confirmMsg}`
    }
    await sendMessage(from, confirmMsg)
  }

  // ─── Image processing ──────────────────────────────────────────

  private async processImageMessage(from: string, imageId: string, caption: string | undefined, _contactName: string): Promise<void> {
    const userId = await this.checkLinked(from)
    if (!userId) { await sendMessage(from, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, '⚠️ Esta función no está disponible en este momento.')
      return
    }

    const media = await downloadMedia(imageId)
    if (!media) { await sendMessage(from, formatMediaError('descargar')); return }

    await sendMessage(from, '📷 Procesando imagen...')
    const transferData = await this.gemini.parseTransferImage(media.base64, media.mimeType)
    if (!transferData) { await sendMessage(from, formatMediaError('procesar')); return }

    await this.processTransferData(from, userId, transferData, caption, 'whatsapp-image')
  }

  // ─── PDF processing ────────────────────────────────────────────

  private async processPDFMessage(from: string, docId: string, caption: string | undefined, _contactName: string): Promise<void> {
    const userId = await this.checkLinked(from)
    if (!userId) { await sendMessage(from, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, '⚠️ Esta función no está disponible en este momento.')
      return
    }

    const media = await downloadMedia(docId)
    if (!media) { await sendMessage(from, formatMediaError('descargar')); return }

    await sendMessage(from, '📄 Procesando PDF...')
    const transferData = await this.gemini.parseTransferPDF(media.base64, media.mimeType)
    if (!transferData) { await sendMessage(from, formatMediaError('procesar')); return }

    await this.processTransferData(from, userId, transferData, caption, 'whatsapp-pdf')
  }

  // ─── Transfer data processing ──────────────────────────────────

  private async processTransferData(phone: string, userId: string, transferData: any, caption: string | undefined, source: string): Promise<void> {
    const amount = parseFloat(transferData.amount) || 0
    if (amount <= 0) {
      await sendMessage(phone, '⚠️ No pude determinar el monto del comprobante.')
      return
    }

    const recipient = {
      name: transferData.recipientName || null,
      cbu: transferData.recipientCBU || null,
      alias: transferData.recipientAlias || null,
      bank: transferData.recipientBank || null,
    }

    const history = await this.findRecipientHistory(userId, transferData)

    let title: string
    let categoryId: string
    let needsRevision: boolean

    if (history?.suggestedTitle) {
      title = history.suggestedTitle
      categoryId = history.suggestedCategoryId
      needsRevision = false
    } else {
      const label = transferData.recipientName || transferData.recipientAlias || 'desconocido'
      title = `Transferencia a ${label}`
      const otros = await this.findOtrosCategory(userId)
      categoryId = otros.id
      needsRevision = true
    }

    // Caption override
    if (caption) {
      const parsed = this.parseExpenseMessage(`$${amount} ${caption}`)
      if (parsed) {
        title = parsed.title || title
        if (parsed.category) {
          const catResult = await this.findCategoryId(userId, parsed.category)
          categoryId = catResult.id
          needsRevision = false
        }
      }
    }

    // Get category name for display
    let categoryName = 'Otros'
    if (categoryId) {
      const catDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).get()
      if (catDoc.exists) categoryName = catDoc.data()!.name
    }

    // Store pending and send confirmation request
    this.pendingAIExpenses.set(phone, {
      phone,
      userId,
      originalText: `[${source}] ${title}`,
      type: 'transfer',
      expense: {
        amount,
        title,
        categoryId: categoryId || '',
        categoryName,
        description: transferData.concept || '',
        isRecurrent: false,
        frequency: null,
      },
      source,
      paymentDate: parseDateOrNow(transferData.date),
      recipient,
      needsRevision,
      createdAt: new Date(),
    })

    await sendMessage(phone, buildConfirmationRequest({
      mode: 'finanzas',
      amount,
      title,
      categoryName,
      recipientName: recipient.name || undefined,
      isTransfer: true,
    }))
  }

  // ─── Category matching ─────────────────────────────────────────

  private async findCategoryId(userId: string, categoryInput: string | null): Promise<{ id: string; name: string }> {
    if (!categoryInput) return this.findOtrosCategory(userId)

    const normalized = categoryInput.toLowerCase()
    const snap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
    if (snap.empty) return { id: '', name: 'Otros' }

    const categories = snap.docs.map(d => ({ id: d.id, name: d.data().name || '' }))

    // 4-level fallback: exact → startsWith → contains → Otros
    const exact = categories.find(c => c.name.toLowerCase() === normalized)
    if (exact) return exact
    const starts = categories.find(c => c.name.toLowerCase().startsWith(normalized))
    if (starts) return starts
    const contains = categories.find(c => c.name.toLowerCase().includes(normalized))
    if (contains) return contains

    return this.findOtrosCategory(userId)
  }

  private async findOtrosCategory(userId: string): Promise<{ id: string; name: string }> {
    const snap = await db.collection(COLLECTIONS.CATEGORIES)
      .where('userId', '==', userId).where('name', '==', 'Otros').limit(1).get()
    if (!snap.empty) return { id: snap.docs[0].id, name: 'Otros' }
    return { id: '', name: 'Otros' }
  }

  // ─── AI expense flow ─────────────────────────────────────────

  private async handleAIExpense(phone: string, userId: string, aiResult: AIPersonalExpenseResult, originalText: string): Promise<void> {
    // Match category from AI result
    let categoryResult = await this.findCategoryId(userId, aiResult.category)

    // If landed on "Otros" and we have a title, try AI categorization as backup
    if (categoryResult.name === 'Otros' && aiResult.title) {
      try {
        const categoryNames = await this.getUserCategoryNames(userId)
        if (categoryNames.length > 0) {
          const aiCategory = await this.gemini.categorizeExpense(aiResult.title, aiResult.description, categoryNames)
          if (aiCategory !== 'Otros') {
            const betterMatch = await this.findCategoryId(userId, aiCategory)
            if (betterMatch.name !== 'Otros') categoryResult = betterMatch
          }
        }
      } catch {
        // Keep "Otros" — not critical
      }
    }

    // Store pending expense (keyed by phone)
    this.pendingAIExpenses.set(phone, {
      phone,
      userId,
      originalText,
      type: 'expense',
      expense: {
        amount: aiResult.amount,
        title: aiResult.title,
        categoryId: categoryResult.id,
        categoryName: categoryResult.name,
        description: aiResult.description,
        isRecurrent: aiResult.isRecurrent,
        frequency: aiResult.frequency,
      },
      source: 'whatsapp-nlp',
      createdAt: new Date(),
    })

    // Build confirmation message
    let confirmMsg = buildConfirmationRequest({
      mode: 'finanzas',
      amount: aiResult.amount,
      title: aiResult.title,
      categoryName: categoryResult.name,
      description: aiResult.description || undefined,
    })

    // Append recurrent note if AI detected recurring pattern
    if (aiResult.isRecurrent) {
      confirmMsg += '\n\n_Parece un gasto fijo. Después de confirmar, podés configurarlo como "fijo" desde la app._'
    }

    await sendMessage(phone, confirmMsg)
  }

  private async saveConfirmedExpense(pending: PendingFinanzasExpense): Promise<void> {
    const entityType = pending.type === 'transfer' ? 'transferencia' as const : 'gasto' as const
    try {
      const paymentDate = pending.paymentDate || admin.firestore.FieldValue.serverTimestamp()

      await db.collection(COLLECTIONS.PAYMENTS).add({
        title: pending.expense.title,
        description: pending.expense.description,
        amount: pending.expense.amount,
        categoryId: pending.expense.categoryId,
        isPaid: true,
        paidDate: paymentDate,
        paymentType: pending.expense.isRecurrent ? 'recurrent' : 'one-time',
        userId: pending.userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dueDate: paymentDate,
        recurrentId: null,
        isWhatsapp: true,
        status: 'pending',
        source: pending.source,
        needsRevision: pending.needsRevision || pending.expense.isRecurrent,
        recipient: pending.recipient || null,
        audioTranscription: pending.audioTranscription || null,
      })

      if (pending.type === 'transfer') {
        await sendMessage(pending.phone, formatTransferConfirmation({
          title: pending.expense.title,
          amount: pending.expense.amount,
          categoryName: pending.expense.categoryName,
          recipientName: pending.recipient?.name || undefined,
          needsRevision: pending.needsRevision || false,
        }))
      } else {
        let msg = buildConfirmationSuccess({
          mode: 'finanzas',
          title: pending.expense.title,
          amount: pending.expense.amount,
          categoryName: pending.expense.categoryName,
          description: pending.expense.description || undefined,
        })
        if (pending.audioTranscription) msg += `\n_"${pending.audioTranscription}"_`
        await sendMessage(pending.phone, msg)
      }
    } catch (error) {
      logError(`Error saving ${entityType}:`, error)
      await sendMessage(pending.phone, formatSaveError(entityType))
    }
  }

  /** Fetch ALL category names for the AI prompt (distinct from getUserCommonCategories which returns top 5) */
  private async getUserCategoryNames(userId: string): Promise<string[]> {
    try {
      const snap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
      return snap.docs.map(d => d.data().name).filter(Boolean)
    } catch (error) {
      logError('Error fetching category names:', error)
      return []
    }
  }

  // ─── Expense message parsing ───────────────────────────────────

  private parseExpenseMessage(text: string): { amount: number; title: string; category: string | null; description: string } | null {
    const clean = text.trim()
    const match = clean.match(/^\$?\s*([\d.,]+)\s+(.+)$/i)
    if (!match) return null

    // Argentine format: remove thousand separators (.), convert decimal comma to dot
    let amountStr = match[1].replace(/\./g, '').replace(',', '.')
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) return null

    let rest = match[2].trim()

    // Extract category (#hashtag)
    let category: string | null = null
    const catMatch = rest.match(/#(\S+)/)
    if (catMatch) { category = catMatch[1].toLowerCase(); rest = rest.replace(/#\S+/, '').trim() }

    // Extract description (d:)
    let description = ''
    const descMatch = rest.match(/d:(.+?)(?=#|$)/i)
    if (descMatch) { description = descMatch[1].trim(); rest = rest.replace(/d:.+?(?=#|$)/i, '').trim() }

    const title = capitalizeFirst(rest.trim())
    if (!title) return null

    return { amount, title, category, description }
  }

  // ─── Recipient history ─────────────────────────────────────────

  private async findRecipientHistory(userId: string, recipientData: any): Promise<{ suggestedTitle: string; suggestedCategoryId: string } | null> {
    try {
      let query: FirebaseFirestore.Query | null = null

      if (recipientData.recipientName) {
        query = db.collection(COLLECTIONS.PAYMENTS)
          .where('userId', '==', userId).where('recipient.name', '==', recipientData.recipientName)
          .orderBy('createdAt', 'desc').limit(5)
      } else if (recipientData.recipientCBU) {
        query = db.collection(COLLECTIONS.PAYMENTS)
          .where('userId', '==', userId).where('recipient.cbu', '==', recipientData.recipientCBU)
          .orderBy('createdAt', 'desc').limit(5)
      }

      if (!query) return null
      const snap = await query.get()
      if (snap.empty) return null

      const pastPayments = snap.docs.map(d => d.data())
      const titleCounts: Record<string, number> = {}
      const catCounts: Record<string, number> = {}

      pastPayments.forEach(p => {
        if (p.title) titleCounts[p.title] = (titleCounts[p.title] || 0) + 1
        if (p.categoryId) catCounts[p.categoryId] = (catCounts[p.categoryId] || 0) + 1
      })

      const suggestedTitle = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const suggestedCategoryId = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

      if (!suggestedTitle) return null
      return { suggestedTitle, suggestedCategoryId: suggestedCategoryId || '' }
    } catch (error) {
      logError('Error finding recipient history:', error)
      return null
    }
  }

  // ─── User common categories ────────────────────────────────────

  private async getUserCommonCategories(userId: string): Promise<string[]> {
    try {
      const paymentsSnap = await db.collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId).orderBy('createdAt', 'desc').limit(10).get()

      if (paymentsSnap.empty) return FALLBACK_CATEGORIES

      const categoryIds = paymentsSnap.docs.map(d => d.data().categoryId).filter(Boolean)
      if (categoryIds.length === 0) return FALLBACK_CATEGORIES

      const uniqueIds = [...new Set(categoryIds)]
      const catsSnap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()

      const catMap: Record<string, string> = {}
      catsSnap.docs.forEach(d => { catMap[d.id] = d.data().name })

      const names = uniqueIds.map(id => catMap[id]).filter(n => n && n.toLowerCase() !== 'otros').slice(0, 5).map(n => n.toLowerCase())
      return names.length > 0 ? names : FALLBACK_CATEGORIES
    } catch (error) {
      logError('Error getting common categories:', error)
      return FALLBACK_CATEGORIES
    }
  }
}
